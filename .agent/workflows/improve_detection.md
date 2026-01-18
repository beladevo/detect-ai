---
description: Review the detection pipeline, research new techniques, and implement 1 improvement.
---
# Continuous Improvement: AI Detection Pipeline

This workflow guides the agent to self-improve the detection capabilities.

## 1. Context & Review
First, read the senior architect principles to ensure high-quality code.
```bash
agent view_file .agent/rules/senior_architect_principles.md
```

Then, read the technical documentation and the core pipeline files.

```bash
# Read technical documentation
agent view_file src/lib/pipeline/TECHNICAL_DOCS.md
```

```bash
# Read key pipeline files
agent list_dir src/lib/pipeline
agent view_file src/lib/pipeline/preprocess.ts
agent view_file src/lib/pipeline/fusion.ts
```

## 2. Research
Search for **one specific** new technique or heuristic to distinguish Real vs AI images. Focus on recent papers or developer blog posts (2024-2027).

**Possible topics:**
- "Flux model artifacts"
- "Midjourney v6 forensic signatures"
- "Fourier transform patterns in diffusion models"
- "Compression level inconsistencies in real photos"

```bash
# Example search (Agent will generate specific query)
agent search_web "new forensic techniques for AI image detection 2025"
```

## 3. Implementation Plan
Based on the research, propose **one** concrete code change. This could be:
- Adding a new check to `visualArtifacts.ts`.
- Tuning weights in `fusion.ts`.
- Adding a new metadata flag in `metadataForensics.ts`.

Create a new file or modify an existing one.

## 4. Execution
Implement the change.

```bash
# (Agent determines specific implementation steps)
```

## 5. Documentation
Update `src/lib/pipeline/TECHNICAL_DOCS.md` to reflect the new capability.

```bash
agent view_file src/lib/pipeline/TECHNICAL_DOCS.md
# (Agent updates the docs)
```

## 6. Verification
Verify the build prevents regressions.

```bash
// turbo
npm run build
npx tsc --noEmit
```
