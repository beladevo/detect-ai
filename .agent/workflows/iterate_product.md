---
description: Product Iteration & Continuous Improvement
---

This workflow guides the agent to iterate on the product beyond the detection pipeline, focusing on UI/UX, feature expansion, and operational excellence.

## 1. Context & Feedback Review
Review the current product state and user feedback to identify areas for improvement.

```bash
# Review UI components
agent list_dir src/components

# Review recent logs for errors or user behavior hints
agent view_file scripts/verify-api.cjs
```

## 2. Identify High-Impact Improvement
Choose **one** specific area to improve:
- **UI/UX**: Refine animations, improve glass-morphism effects, or enhance responsive layouts.
- **Features**: Add new pages, analytics dashboards, or batch processing capabilities.
- **Performance**: Optimize build times, refine WASM loading, or improve API response latency.

## 3. Implementation Plan
Create an `implementation_plan.md` documenting the proposed changes.

## 4. Execution
Implement the changes following the [Design Guide](file:///c:/Users/omrib/source/omri/detect-ai/MEMORY[code-style-guide.md]) and [Architect Principles](file:///c:/Users/omrib/source/omri/detect-ai/MEMORY[senior_architect_principles.md]).

```bash
# Example: Adding a new UI component
agent write_to_file src/components/NewFeature.tsx ...
```

## 5. Verification
Verify the changes with the project's standard quality checks.

```bash
# Run existing verification workflow
agent run_command npx tsc --noEmit
agent run_command npm run build
```

## 6. Documentation & Walkthrough
Create a `walkthrough.md` with screenshots or recordings of the new/improved features.
