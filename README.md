# Build an LLM, Interactively

A mobile-first interactive course that walks through building a GPT-style large language model from scratch. It follows the chapter progression of Sebastian Raschka's *Build a Large Language Model (From Scratch)*, with original explanations, PyTorch code examples, step-through animations, playable visualizations and a quiz for each chapter.

This is an independent study companion, not affiliated with the author or publisher.

## Chapters

1. Understanding Large Language Models
2. Working with Text Data: tokenization, BPE, sliding-window sampling, embeddings
3. Coding Attention Mechanisms: self-attention, causal masking, multi-head attention
4. Implementing a GPT Model: layer norm, GELU, shortcuts, transformer blocks, generation
5. Pretraining on Unlabeled Data: cross-entropy, training loop, temperature and top-k
6. Fine-tuning for Classification: a spam classifier
7. Fine-tuning to Follow Instructions: prompt formats, collation, LLM-as-judge evaluation

## Running locally

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests for the math/tokenizer helpers
npm run build    # typecheck + static build in dist/
```

The build is fully static (hash-based routing, relative asset paths) so `dist/` can be served from any static host. A GitHub Pages workflow is included in `.github/workflows/deploy.yml`.

## Contributing content

See [docs/AUTHORING.md](docs/AUTHORING.md) for the project layout, the shared component library, and the design rules (mobile-first, theme tokens, deterministic visuals).
