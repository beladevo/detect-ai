# Imagion Improvement Roadmap

> Comprehensive task list for improving AI-generated image detection accuracy and user experience.

## Progress Tracker

**Last Updated:** 2026-01-20

| Phase | Status | Completed | Total | Progress |
|-------|--------|-----------|-------|----------|
| Phase 1: Quick Wins | ✅ Complete | 6 | 6 | 100% |
| Phase 2: Core Improvements | 🟢 Nearly Complete | 5 | 6 | 83% |
| Phase 3: Advanced Detection | ⚪ Not Started | 0 | 6 | 0% |
| Phase 4: Polish & Scale | ⚪ Not Started | 0 | 7 | 0% |
| **Overall** | **🟡 In Progress** | **11** | **42** | **26%** |

### Recent Changes

**2026-01-20 (Part 4)** - Model Selection & Ensemble:
- ✅ Added `ModelSelector` component for single and ensemble modes
- ✅ Created model selection utilities (`modelSelection.ts`)
- ✅ Added `.env.example` with ensemble configuration docs
- ✅ Updated `CLAUDE.md` with multi-model setup instructions

**2026-01-20 (Part 3)** - Export & Bug Fixes:
- ✅ Fixed `weighted_scores` missing from fusion result (caused FusionBreakdown error)
- ✅ Implemented report export (JSON + Text formats)
- ✅ Created `ExportButton` component with dropdown menu

**2026-01-20 (Part 2)** - Phase 2 WASM Improvements:
- ✅ Fixed WASM parity - browser mode now returns full pipeline data
- ✅ Added multi-crop analysis to WASM detector (5-crop strategy matching server)
- ✅ Created `analyzeImagePipelineBrowser.ts` for client-side forensic analysis

**2026-01-20 (Part 1)** - Phase 1 Complete:
- ✅ Added forensic explanation system (`src/lib/explanations.ts`)
- ✅ Implemented confidence interval calculation (uncertainty ±σ)
- ✅ Enhanced error messages with specific error types
- ✅ Added API rate limiting (10 req/min per IP)
- ✅ Implemented file size validation (10MB max)
- ✅ Created UI components: `ModuleBreakdown`, `ExplanationList`, `ConfidenceDisplay`

---

## Table of Contents

- [Summary](#summary)
- [Detection Pipeline Improvements](#-detection-pipeline-improvements)
- [UI/UX Improvements](#-uiux-improvements)
- [Infrastructure & Performance](#%EF%B8%8F-infrastructure--performance)
- [Testing & Benchmarking](#-testing--benchmarking)
- [Implementation Phases](#-implementation-phases)

---

## Summary

| Category | Total Tasks | High Priority | Medium | Low |
|----------|-------------|---------------|--------|-----|
| Detection Pipeline | 16 | 5 | 7 | 4 |
| UI/UX | 14 | 5 | 5 | 4 |
| Infrastructure | 7 | 2 | 3 | 2 |
| Testing | 5 | 0 | 3 | 2 |
| **TOTAL** | **42** | **12** | **18** | **12** |

---

## 🔬 Detection Pipeline Improvements

### High Priority

| Task | Description | Impact | Effort |
|------|-------------|--------|--------|
| **Multi-model ensemble** | Load 2-3 models by default with weighted voting instead of single model | Very High | High |
| **Grad-CAM attention visualization** | Replace fake procedural heatmap with real model attention maps | Very High | Medium |
| **Fix WASM parity** | Return pipeline data from browser mode + add multi-crop analysis (currently server-only) | Very High | Medium |
| **Face anomaly detection** | Add checks for eye reflection consistency, pupil shape, teeth patterns | High | High |
| **Hand structure validation** | Validate finger count, joint positions, anatomical consistency | High | High |

### Medium Priority

| Task | Description | Impact | Effort |
|------|-------------|--------|--------|
| **Uncertainty quantification** | Return confidence intervals (87% ± 6%) instead of point estimates | High | Medium |
| **Wavelet frequency analysis** | Add wavelet analysis for better transient/artifact detection | Medium | Medium |
| **Per-channel frequency analysis** | Analyze R/G/B channels independently (generators affect them differently) | Medium | Low |
| **Improve skin detection** | Support diverse ethnicities and lighting conditions beyond current YCbCr thresholds | Medium | Medium |
| **Multi-scale texture analysis** | Check texture at multiple scales (2x2, 8x8, 16x16, 32x32 blocks) | Medium | Low |
| **Full C2PA validation** | Implement actual signature verification, not just marker detection | Medium | High |
| **Watermark detection** | Add steganographic and visual watermark detection | Medium | High |

### Low Priority

| Task | Description | Impact | Effort |
|------|-------------|--------|--------|
| **Improve physics module** | Add vanishing point validation, occlusion consistency checks | Medium | High |
| **Fix fusion contradiction penalty** | Conflicting module signals don't necessarily indicate AI | Low | Low |
| **Model-specific thresholds** | Tune thresholds per AI generator (FLUX, Midjourney, DALL-E, Stable Diffusion) | Medium | Medium |

---

## 🎨 UI/UX Improvements

### High Priority

| Task | Description | Impact | Effort |
|------|-------------|--------|--------|
| **Forensic finding explanations** | Show detailed text explaining why each detection triggered | Very High | Low |
| **Module contribution breakdown** | Visual bar chart showing each module's weight in final verdict | Very High | Low |
| **Confidence intervals display** | Show "87% ± 6%" instead of flat "87%" | High | Low |
| **Real attention heatmap** | Overlay actual Grad-CAM attention on image (replace fake gradient) | Very High | Medium |
| **Better error messages** | Specific error causes with recovery options (e.g., "File too large. [Compress] or [Try Different]") | High | Low |

### Medium Priority

| Task | Description | Impact | Effort |
|------|-------------|--------|--------|
| **Model selection dropdown** | Let users choose which detection model to use | Medium | Low |
| **Sensitivity slider** | Aggressive vs conservative detection threshold | Medium | Medium |
| **Batch upload** | Upload multiple images with side-by-side comparison view | High | High |
| **Report export** | Download PDF or JSON report of detection results | Medium | Medium |
| **Enhanced history** | Re-analyze option, comparison between scans, timeline view | Medium | Medium |

### Low Priority

| Task | Description | Impact | Effort |
|------|-------------|--------|--------|
| **Educational tooltips** | Explain what each forensic module detects on hover | Medium | Low |
| **"What to look for" tips** | Add guidance in detailed analysis modal | Low | Low |
| **Progressive disclosure** | Quick verdict first, then animate detailed breakdown | Low | Medium |
| **Mobile optimization** | Touch-friendly drag-drop, responsive modals | Medium | Medium |

---

## ⚙️ Infrastructure & Performance

### High Priority

| Task | Description | Impact | Effort |
|------|-------------|--------|--------|
| **API rate limiting** | Prevent abuse and DDoS attacks | High | Low |
| **File size validation** | Validate before processing to prevent memory issues | High | Low |

### Medium Priority

| Task | Description | Impact | Effort |
|------|-------------|--------|--------|
| **Result caching** | Cache results by SHA256 hash for repeated uploads | Medium | Medium |
| **Batch inference** | Parallelize multi-crop inference for better performance | Medium | Medium |
| **Streaming results** | Show intermediate progress during multi-step analysis | Medium | High |

### Low Priority

| Task | Description | Impact | Effort |
|------|-------------|--------|--------|
| **Sign ONNX models** | Cryptographically sign models to prevent tampering | Low | Medium |
| **Model versioning** | Track versions with rollback capability | Low | Medium |

---

## 🧪 Testing & Benchmarking

### Medium Priority

| Task | Description | Impact | Effort |
|------|-------------|--------|--------|
| **Expand benchmark dataset** | Add diverse image sources beyond current test-assets | High | Medium |
| **Per-image-type metrics** | Track accuracy for faces, landscapes, text, screenshots separately | Medium | Low |
| **Per-generator metrics** | Track accuracy for DALL-E, Midjourney, Stable Diffusion, FLUX separately | Medium | Low |

### Low Priority

| Task | Description | Impact | Effort |
|------|-------------|--------|--------|
| **Adversarial testing** | Test robustness against modified/adversarial images | Medium | High |
| **A/B testing framework** | Framework for comparing model updates | Low | High |

---

## 🚀 Implementation Phases

### Phase 1: Quick Wins ✅ COMPLETE

High impact, low effort tasks that provide immediate value:

- [x] **Forensic finding explanations** - Created `src/lib/explanations.ts` with human-readable descriptions for all detection flags
- [x] **Module contribution breakdown** - Created `ModuleBreakdown.tsx` component with visual weight chart and contribution calculations
- [x] **Confidence intervals display** - Added `uncertainty` field to `FusionResult` and `VerdictResult` types, calculated from module score variance. Created `ConfidenceDisplay.tsx` component showing ±σ range
- [x] **Better error messages** - Enhanced API error responses with specific error types (FILE_TOO_LARGE, UNSUPPORTED_TYPE, etc.) and actionable messages
- [x] **API rate limiting** - Implemented in-memory rate limiter (10 requests/min per IP) with proper HTTP 429 responses and retry headers
- [x] **File size validation** - Added 10MB max file size check with detailed error messages

**New Files Created:**
- `src/lib/explanations.ts` - Explanation mapping system
- `src/lib/rateLimit.ts` - Rate limiting utilities
- `src/components/ui/ModuleBreakdown.tsx` - Visual breakdown component
- `src/components/ui/ExplanationList.tsx` - Detailed findings display
- `src/components/ui/ConfidenceDisplay.tsx` - Confidence with uncertainty intervals

**Modified Files:**
- `src/lib/pipeline/types.ts` - Added `uncertainty` and `module_scores` fields
- `src/lib/pipeline/fusion.ts` - Calculate uncertainty from module variance
- `src/lib/pipeline/verdict.ts` - Pass uncertainty through to final result
- `src/app/api/detect/route.ts` - Add validation, rate limiting, and better errors

### Phase 2: Core Improvements 🟡 IN PROGRESS

Foundation improvements for detection quality and transparency:

- [x] **Fix WASM parity** - Browser mode now returns full pipeline data with all forensic modules. Created `analyzeImagePipelineBrowser.ts` that runs visual, metadata, physics, frequency, and provenance checks client-side
- [x] **Multi-crop analysis in WASM** - Implemented 5-crop strategy (center + 4 corners) matching server-side behavior for images ≥512px
- [x] **Report export** - Implemented JSON and Text export with detailed findings, module breakdown, and explanations
- [x] **Multi-model ensemble** - Infrastructure already exists via `AI_ENSEMBLE_MODELS` env var. Created ensemble presets (fast/balanced/thorough) and configuration utilities
- [x] **Model selection dropdown** - Created `ModelSelector` component with single and ensemble modes
- [ ] Grad-CAM attention visualization

**New Files Created:**
- `src/lib/pipeline/analyzeImagePipelineBrowser.ts` - Browser-compatible forensic pipeline
- `src/lib/exportReport.ts` - Export utilities for JSON and text reports
- `src/components/ui/ExportButton.tsx` - Export dropdown component
- `src/components/ui/ModelSelector.tsx` - Model selection UI (single + ensemble modes)
- `src/lib/modelSelection.ts` - Ensemble configuration and validation utilities
- `.env.example` - Environment configuration template

**Modified Files:**
- `src/lib/wasmDetector.ts` - Added multi-crop support + full pipeline execution in browser
- `src/lib/pipeline/fusion.ts` - Added `weighted_scores` field for UI display
- `CLAUDE.md` - Updated with multi-model setup instructions and WASM details

### Phase 3: Advanced Detection (4-6 weeks)

Sophisticated detection capabilities:

- [ ] Face anomaly detection
- [ ] Hand structure validation
- [ ] Uncertainty quantification
- [ ] Wavelet frequency analysis
- [ ] Per-channel frequency analysis
- [ ] Improve skin detection

### Phase 4: Polish & Scale (Ongoing)

Long-term improvements and optimization:

- [ ] Batch upload & comparison
- [ ] Full C2PA validation
- [ ] Enhanced history features
- [ ] Mobile optimization
- [ ] Steganographic watermark detection
- [ ] Adversarial testing
- [ ] A/B testing framework

---

## Current Architecture Reference

### Detection Pipeline Flow

```
Image → Preprocessing → [7 Parallel Modules] → Fusion → Verdict → Result
```

### Module Weights

| Module | Weight | File |
|--------|--------|------|
| ML Ensemble | 30% | `src/lib/pipeline/mlEnsemble.ts` |
| Frequency Forensics | 25% | `src/lib/pipeline/frequencyForensics.ts` |
| Physics Consistency | 20% | `src/lib/pipeline/physicsConsistency.ts` |
| Visual Artifacts | 15% | `src/lib/pipeline/visualArtifacts.ts` |
| Metadata Forensics | 10% | `src/lib/pipeline/metadataForensics.ts` |
| Provenance | - | `src/lib/pipeline/provenance.ts` |

### Verdict Thresholds

| Verdict | Score Range |
|---------|-------------|
| AI_GENERATED | ≥ 0.85 |
| LIKELY_AI | ≥ 0.70 |
| UNCERTAIN | 0.30 - 0.70 |
| LIKELY_REAL | ≤ 0.30 |
| REAL | ≤ 0.15 |

---

## References

- [Reporter's Guide to Detecting AI-Generated Content](https://gijn.org/resource/guide-detecting-ai-generated-content/)
- [Methods and Trends in Detecting AI-Generated Images](https://arxiv.org/html/2502.15176v2)
- [AI detection using uncertainty measures](https://www.nature.com/articles/s41598-025-28572-8)
- [Grad-CAM interpretability for AI detection](https://www.nature.com/articles/s41598-025-29229-2)
- [Fingerprinting real content approach](https://www.techradar.com/ai-platforms-assistants/ai-slop-won-in-2025-fingerprinting-real-content-might-be-the-answer-in-2026)
- [The Shape of AI - UX Patterns](https://www.shapeof.ai/)
- [UI Design Trends 2026](https://zumeirah.com/ui-design-in-2026-trends-tools-ux-standards/)
