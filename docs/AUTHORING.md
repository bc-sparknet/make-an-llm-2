# Authoring guide

How the site is put together and how to add or edit content.

## Stack

- **Vite + React + TypeScript**: build tooling and UI.
- **MDX**: chapter prose is Markdown with embedded React components.
- **react-router (HashRouter)**: works from any static host with no server config.
- **prism-react-renderer**: syntax highlighting for code blocks.
- **Vitest**: unit tests for the math/tokenizer helpers in `src/lib`.

## Layout

```
src/
  chapters/
    registry.ts               ← course outline (order, titles, summaries)
    NN-slug/
      index.mdx               ← the chapter prose
      quiz.ts                 ← the chapter's quiz questions (data only)
      SomeWidget.tsx          ← chapter-specific interactive visuals
      SomeWidget.module.css
  components/
    index.ts                  ← barrel: import shared components from here
    content/                  ← Callout, CodeBlock, Figure, Quiz, InlineMarkdown
    controls/                 ← Slider, Segmented, Stepper (useStepper + StepControls)
    viz/                      ← HeatGrid, TokenChips, ProbabilityBars, FunctionPlot
    layout/                   ← app shell (header, drawer, progress bar)
  lib/
    math.ts                   ← softmax, matmul, layerNorm, gelu, seeded random…
    tokenizer.ts              ← simple tokenizer + toy BPE
    progress.ts               ← learner progress (localStorage)
  pages/                      ← Home, Chapter, NotFound
  styles/tokens.css           ← all colours/spacing as CSS variables (light + dark)
```

## Adding a chapter

1. Create `src/chapters/NN-slug/index.mdx`.
2. Add an entry to `chapters` in `src/chapters/registry.ts`.

## Writing a chapter

- The page already renders the chapter number and title, so **don't** start the MDX with an `# h1`. Use `##` for sections, `###` for subsections.
- Fenced code blocks (```` ```python ````) are automatically highlighted with a copy button.
- Put widget components next to the chapter that uses them. Move them to `src/components` only once a second chapter needs them.
- Keep prose original. The site follows the *progression* of the book but must not copy its text or code verbatim.

Shared building blocks (import from `../../components`):

| Component | Use |
| --- | --- |
| `<Callout type="note\|tip\|key\|warning">` | Asides and key takeaways |
| `<Figure title caption>` | Card frame around every interactive visual |
| `<Quiz questions={quiz} />` | End-of-chapter quiz; score is saved to progress |
| `<Slider>`, `<Segmented>` | Inputs for visuals |
| `useStepper(n)` + `<StepControls>` | Step-through / autoplay animations |
| `<HeatGrid data rowLabels colLabels>` | Matrices, attention weights (handles −∞) |
| `<TokenChips tokens ids>` | Tokens as coloured chips |
| `<ProbabilityBars labels values>` | Distributions (softmax outputs, etc.) |
| `<FunctionPlot series xRange yRange>` | Plots of functions like GELU |

## Colab notebooks

Every chapter with Python code gets a runnable notebook in `notebooks/`, linked from the chapter page with a "Run this chapter's code in Colab" button. The notebooks are **generated from the chapter MDX**, so the site and the notebooks can't drift apart:

```bash
npm run notebooks        # regenerate notebooks/*.ipynb after editing a chapter
```

`npm test` (and CI) fails if the committed notebooks are out of date.

Code fences control what goes into the notebook:

| Fence | Site | Notebook |
| --- | --- | --- |
| ```` ```python ```` | shown | code cell |
| ```` ```python carry ```` | shown | code cell, **and** copied into the setup cell of every later chapter (classes/helpers later chapters use; `torch`, `nn`, `F`, `math` and `tiktoken` are imported for them) |
| ```` ```python skip ```` | shown | left out (fragments that only make sense next to the prose) |
| ```` ```python no-test ```` | shown | code cell, skipped by the local test runner (needs an external service, e.g. Ollama) |

A chapter can also have a `notebook-setup.py` next to its `index.mdx`; it's appended to that notebook's setup cell. In it, `# @embed notebooks/data/<file>` writes that repo file into the notebook's working directory (the repo may be private, so notebooks never download from it).

**Code blocks must run top to bottom.** Before committing chapter code changes, execute the notebooks:

```bash
pip install torch tiktoken pandas safetensors nbclient nbformat ipykernel
python scripts/run_notebooks.py            # all chapters (training runs take a while on CPU)
python scripts/run_notebooks.py 05 --fast  # one chapter, with shortened training
```

Notebooks that download data (GPT-2 weights, datasets) cache it on disk, so `--fixtures DIR` can pre-seed those files when running offline.

## Design rules

- **Mobile first.** Design every widget for a 360–390px-wide screen first. No horizontal page scroll; wide matrices go inside `<HeatGrid>` (which scrolls itself) or a `.scroll-x` div. Touch targets are at least 44px.
- **Colours come from `styles/tokens.css`** (`var(--accent)`, `var(--blue)`, …). Never hard-code colours in components, or dark mode breaks.
- **Use CSS Modules** (`Widget.module.css`) for component styles.
- **Deterministic visuals.** Use `seededRandom` / `randomMatrix` from `lib/math.ts` for "random" weights so a figure looks the same every render.
- **Put math in `lib/`** when it's reusable, and add a test in `src/lib/*.test.ts`.
- Respect `prefers-reduced-motion` (handled globally for CSS transitions).

## Commands

```bash
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build into dist/
npm test           # unit tests + notebook freshness check
npm run notebooks  # regenerate Colab notebooks from the chapters
```
