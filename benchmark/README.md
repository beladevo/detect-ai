# AI Detection Model Benchmark Tool

Internal tool for evaluating and comparing ONNX models to choose the best one for production.

## Quick Start

```bash
# 1. Add test images
# Place real photos in: benchmark/test-assets/real/
# Place AI-generated images in: benchmark/test-assets/fake/

# 2. Run benchmark
npx tsx benchmark/benchmark.ts
```

## Directory Structure

```
benchmark/
├── test-assets/
│   ├── real/          # Real photos (ground truth: NOT AI)
│   │   ├── photo1.jpg
│   │   └── ...
│   └── fake/          # AI-generated images (ground truth: AI)
│       ├── midjourney1.png
│       └── ...
├── results/           # Benchmark output (JSON files)
├── benchmark.ts       # Main script
└── README.md
```

## Usage

### Run all models
```bash
npx tsx benchmark/benchmark.ts
```

### Run specific models
```bash
npx tsx benchmark/benchmark.ts --models model_q4.onnx,nyuad.onnx
```

### Custom threshold
```bash
npx tsx benchmark/benchmark.ts --threshold 60
```

### Combined
```bash
npx tsx benchmark/benchmark.ts --models model_q4.onnx --threshold 55
```

### Show misclassified image paths
```bash
npx tsx benchmark/benchmark.ts --show-misses
```

## Test Image Guidelines

### Real Images (`test-assets/real/`)
- Actual photographs taken with cameras
- No AI-generated content
- Mix of subjects: portraits, landscapes, objects, etc.
- Various quality levels (phone photos, DSLR, etc.)

### Fake Images (`test-assets/fake/`)
- AI-generated images from various sources:
  - Midjourney
  - DALL-E
  - Stable Diffusion
  - Other AI generators
- Mix of styles and subjects
- Include challenging cases (photorealistic AI images)

### Supported Formats
- `.jpg`, `.jpeg`
- `.png`
- `.webp`
- `.gif`
- `.bmp`

### Recommended Test Set Size
- Minimum: 10 images per category (20 total)
- Recommended: 50+ images per category (100+ total)
- For best results: 100+ images per category

## Output

### Console Output
- Progress bar during testing
- Per-model metrics (accuracy, precision, recall, F1)
- Confusion matrix
- Final ranking sorted by F1 score

### JSON Output
Results saved to `benchmark/results/benchmark-{timestamp}.json`:

```json
{
  "timestamp": "2026-01-17T12:00:00Z",
  "threshold": 50,
  "testSet": {
    "realCount": 50,
    "fakeCount": 50,
    "totalImages": 100
  },
  "models": [
    {
      "name": "model_q4.onnx",
      "accuracy": 0.92,
      "precision": 0.91,
      "recall": 0.94,
      "f1Score": 0.925,
      "avgInferenceMs": 145,
      "confusion": { ... },
      "perImageResults": [ ... ]
    }
  ],
  "ranking": ["model_q4.onnx", "nyuad.onnx"]
}
```

## Metrics Explained

| Metric | Description |
|--------|-------------|
| **Accuracy** | Overall correct predictions / total |
| **Precision** | True positives / (True positives + False positives). High precision = few false alarms |
| **Recall** | True positives / (True positives + False negatives). High recall = catches most fakes |
| **F1 Score** | Harmonic mean of precision and recall. Best single metric for comparison |
| **Avg Time** | Average inference time per image in milliseconds |

## Model Configuration

Models are loaded from `public/models/onnx/`. Each model may have different output configurations:

Edit `MODEL_AI_INDEX` in `benchmark.ts` to configure which output index represents "AI":

```typescript
const MODEL_AI_INDEX: Record<string, number> = {
  "model_q4.onnx": 0,  // AI class is at index 0
  "other_model.onnx": 1, // AI class is at index 1 (default)
};
```

## Choosing the Best Model

1. **F1 Score** - Primary metric for overall performance
2. **Precision** - Important if false positives are costly
3. **Recall** - Important if missing fakes is costly
4. **Inference Time** - Consider for production latency requirements

Example decision matrix:
- Use case needs to catch all fakes → prioritize **Recall**
- Use case can't tolerate false accusations → prioritize **Precision**
- General use case → prioritize **F1 Score**
- Performance critical → consider **Avg Time** as secondary metric
