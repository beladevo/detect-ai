# AI Detection Pipeline - Technical Documentation

## Overview
This document serves as the technical reference for the AI detection pipeline. It outlines the current architecture, implemented analysis modules, and known limitations. The "Improve Detection" workflow uses this document to track capabilities and plan enhancements.

## Architecture
The pipeline follows a modular architecture where an image passes through a preprocessing stage followed by parallel analysis modules. The results are aggregated by a fusion engine to produce a final verdict.

### Core Modules

1.  **Preprocessing (`preprocess.ts`)**
    -   Standardizes images to 256x256 for analysis.
    -   Generates grayscale and edge-detected variants.
    -   Computes perceptual hashes (pHash).

2.  **Visual Artifacts (`visualArtifacts.ts`)**
    -   Analyzes skin texture for unnatural smoothing.
    -   **Chrominance Variance Analysis**: Detects subtle "color noise" or mottling in skin tones, a common artifact in recent diffusion models like Flux.
    -   Checks for symmetry anomalies in facial features.
    -   Detects "melting" textures common in diffusion models.

3.  **Metadata Forensics (`metadataForensics.ts`)**
    -   Parses EXIF/IPTC metadata.
    -   Flags known generator signatures (e.g., "Adobe Firefly", "Stable Diffusion", "Flux", "Midjourney v6").
    -   **Deep Metadata Validation**: Cross-checks "Make" and "Model" tags against expected capture-specific technical details (ISO, Aperture). Detects spoofed metadata commonly found in advanced AI outputs.
    -   Checks for missing or inconsistent camera make/model tags.

4.  **Physics Consistency (`physicsConsistency.ts`)**
    -   Estimates light direction from shadows.
    -   Flags inconsistent shadow angles.
    -   Analyzes perspective anomalies (vanishing point consistency).

5.  **Frequency Analysis (`frequencyForensics.ts`)**
    -   Performs FFT (Fast Fourier Transform) analysis.
    -   Detects grid-like artifacts common in GANs and early diffusion models.

6.  **Provenance (`provenance.ts`)**
    -   Checks for C2PA/CAI digital signatures.
    -   Validates the chain of custody if present.

7.  **ML Ensemble (`mlEnsemble.ts`)**
    -   Integrates ONNX Runtime for server-side inference (if models are loaded).
    -   Acts as a fallback or validator for heuristic checks.

## Fusion Logic (`fusion.ts`)
The `fusion.ts` module aggregates scores from all active modules using weighted averages. It applies a sigmoid-like curve to determine the final "AI Probability" score.

## Current Limitations
-   **Face Detection**: Relies on heuristic skin color detection, not full facial recognition.
-   **Shadows**: Simple intensity-based shadow detection; struggles with complex lighting.
-   **New Models**: Heuristics may miss the latest Flux/Midjourney v6 outputs which have fewer visual artifacts.
