#!/usr/bin/env python3
"""
Executes the generated chapter notebooks top to bottom to prove they run.

    python scripts/run_notebooks.py                 # all notebooks
    python scripts/run_notebooks.py 03 04           # only chapters whose file starts with 03 / 04
    python scripts/run_notebooks.py --fast          # shrink training loops for a quick smoke test

Requirements: pip install torch tiktoken nbclient nbformat ipykernel pandas safetensors

Each notebook runs in a fresh temporary directory. `%pip` cells are skipped
(install the requirements locally instead). If a `fixtures` hook below knows a
notebook needs downloaded data, you can pre-seed its cache directory with
--fixtures DIR so the notebook's download code finds the files and skips the
network.
"""
import argparse
import re
import sys
import tempfile
import time
from pathlib import Path

import nbformat
from nbclient import NotebookClient
from nbclient.exceptions import CellExecutionError

ROOT = Path(__file__).resolve().parent.parent
NOTEBOOKS = ROOT / "notebooks"

# In --fast mode these substitutions keep long runs short on a CPU. They only
# shrink epochs, data and generation length, never the logic under test.
FAST_REWRITES = [
    (re.compile(r"\bnum_epochs\s*=\s*\d+"), "num_epochs=1"),
    (re.compile(r"^(train_data|val_data|test_data) = (data\[.*\])$", re.M), r"\1 = \2[:16]"),
    (re.compile(r"\bmax_new_tokens=256\b"), "max_new_tokens=8"),
]


def run(path: Path, fast: bool, fixtures: Path | None, timeout: int) -> bool:
    nb = nbformat.read(path, as_version=4)
    for cell in nb.cells:
        if cell.cell_type != "code":
            continue
        if cell.source.lstrip().startswith("%pip") or "no-test" in cell.metadata.get("tags", []):
            cell.source = "# (skipped by run_notebooks.py)"
        elif fast:
            for pattern, replacement in FAST_REWRITES:
                cell.source = pattern.sub(replacement, cell.source)

    with tempfile.TemporaryDirectory() as tmp:
        if fixtures and fixtures.exists():
            # Symlink rather than copy: fixtures can include multi-GB checkpoints.
            for item in fixtures.iterdir():
                (Path(tmp) / item.name).symlink_to(item.resolve())
        client = NotebookClient(nb, timeout=timeout, kernel_name="python3", resources={"metadata": {"path": tmp}})
        start = time.time()
        try:
            client.execute()
        except CellExecutionError as err:
            print(f"FAIL {path.name}\n{str(err)[-3000:]}")
            return False
    print(f"ok   {path.name}  ({time.time() - start:.0f}s)")
    return True


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("only", nargs="*", help="notebook filename prefixes to run")
    parser.add_argument("--fast", action="store_true")
    parser.add_argument("--fixtures", type=Path, help="directory copied into each notebook's working dir")
    parser.add_argument("--timeout", type=int, default=1800, help="per-cell timeout in seconds")
    args = parser.parse_args()

    paths = sorted(NOTEBOOKS.glob("*.ipynb"))
    if args.only:
        paths = [p for p in paths if any(p.name.startswith(o) for o in args.only)]
    results = [run(p, args.fast, args.fixtures, args.timeout) for p in paths]
    sys.exit(0 if all(results) else 1)


if __name__ == "__main__":
    main()
