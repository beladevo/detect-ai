# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Imagion** - AI-generated image detection web application. Uses a multi-module forensics pipeline combining ML models (ONNX), visual artifact detection, metadata analysis, frequency forensics, and physics consistency checks.

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx tsx benchmark/benchmark.ts                    # Run model benchmark
npx tsx benchmark/benchmark.ts --models model.onnx --verbose  # Single model with logs
```

## Architecture

### Detection Pipeline Flow

```
Image → Preprocessing → [7 Parallel Modules] → Fusion → Verdict → Result
```

**Modules** (in `src/lib/pipeline/`):
- `visualArtifacts.ts` - Skin smoothing, texture melting, symmetry (15% weight)
- `metadataForensics.ts` - EXIF analysis, AI generator signatures (10% weight)
- `physicsConsistency.ts` - Light direction, shadow alignment (20% weight)
- `frequencyForensics.ts` - FFT spectral analysis, DCT patterns (25% weight)
- `mlEnsemble.ts` - ONNX model inference (30% weight)
- `provenance.ts` - C2PA digital signature detection
- `fusion.ts` - Weighted aggregation with contradiction penalty
- `verdict.ts` - Final classification (AI_GENERATED, LIKELY_AI, UNCERTAIN, LIKELY_REAL, REAL)

### ONNX Model System

**Configuration**: `src/lib/modelConfigs.ts`
```typescript
// Each model has different output order - aiIndex specifies which index is AI probability
MODEL_CONFIGS = {
  "model.onnx": { aiIndex: 0 },      // Output: [AI, Real]
  "model_q4.onnx": { aiIndex: 1 },   // Output: [Real, AI]
  "nyuad.onnx": { aiIndex: 1 },      // Output: [class0, AI, class2]
}
```

**Inference**: `src/lib/nodeDetector.ts` (server) + `src/lib/wasmDetector.ts` (browser)
- Session caching for loaded models
- Multi-crop analysis for images ≥512px (5 crops: center + 4 corners, center weighted 2x)
- ImageNet normalization (mean: [0.485, 0.456, 0.406], std: [0.229, 0.224, 0.225])
- Supports NCHW and NHWC tensor layouts
- **WASM mode**: Full forensic pipeline runs client-side via `analyzeImagePipelineBrowser.ts`

**Multi-Model Ensemble**: `src/lib/pipeline/mlEnsemble.ts`
- Configure via `AI_ENSEMBLE_MODELS` environment variable (comma-separated)
- Presets: `fast` (1 model), `balanced` (2 models), `thorough` (3 models)
- Weighted voting with disagreement detection (spread > 0.25 flags conflict)

### API

**POST `/api/detect`** - Main detection endpoint
- Input: `multipart/form-data` with `file` field
- Output: `{ score, verdict, confidence, explanations, modules, hashes }`

## Key Configuration

**Environment Variables** (`.env.local` - see `.env.example` for full list):
```bash
# Single model
NEXT_PUBLIC_MODEL_NAME=model_q4.onnx

# Multi-model ensemble (recommended for production)
AI_ENSEMBLE_MODELS=model_q4.onnx,model.onnx,nyuad.onnx
# OR use preset
AI_ENSEMBLE_PRESET=balanced  # fast | balanced | thorough

# Remote storage
NEXT_PUBLIC_BLOB_BASE_URL=...           # CDN/blob storage URL (production)

# Logging
INFERENCE_LOG_ENABLED=true

# API limits
MAX_FILE_SIZE=10485760                  # 10MB max
RATE_LIMIT_MAX_REQUESTS=10             # 10 req/min per IP
```

**Models Location**: `public/models/onnx/`

## Code Standards

### Comments
- Minimal comments - code should be self-documenting
- Only add comments for truly complex/non-obvious logic

### Architecture
- Analyze scalability needs before writing code
- Use appropriate design patterns (Singleton for caches, Strategy for algorithms)
- Strong TypeScript typing - avoid `any`

### Adding New Models

1. Place `.onnx` file in `public/models/onnx/`
2. Run benchmark to determine `aiIndex`: `npx tsx benchmark/benchmark.ts --models new-model.onnx --verbose`
3. Add config to `src/lib/modelConfigs.ts`
4. Update `benchmark/benchmark.ts` MODEL_AI_INDEX

### Benchmark Tool

Tests model accuracy against labeled test images in `benchmark/test-assets/`:
```
benchmark/test-assets/
├── real/    # Authentic images
└── fake/    # AI-generated images
```

Output metrics: Accuracy, Precision, Recall, F1 Score, Confusion Matrix
