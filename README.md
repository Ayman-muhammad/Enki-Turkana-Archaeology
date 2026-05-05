# Enki-Turkana: Subsurface Archaeological Surveillance Pipeline

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Status: Research Alpha](https://img.shields.io/badge/Status-Research%20Alpha-amber)
![Field: Remote Sensing Archaeology](https://img.shields.io/badge/Field-Remote%20Sensing%20Archaeology-green)

**Enki-Turkana** is a state-of-the-art satellite inference platform engineered for the detection of subsurface Roman military fortifications in arid and semi-arid environments. Utilizing multi-band sensor fusion (SAR, NDVI, RGB) and deep semantic segmentation, the platform reveals anthropogenic structures buried under aeolian sand or obscured by sparse xerophytic vegetation.

---

## 🛰️ Visual Pipeline Overview

| Sensor Input (SAR/RGB/NDVI) | Neural Segmentation Map | Explainable AI (Grad-CAM) |
| :--- | :--- | :--- |
| ![Satellite Input](https://picsum.photos/seed/enki_input/400/225) | ![Segmentation](https://picsum.photos/seed/enki_seg/400/225) | ![Grad-CAM](https://picsum.photos/seed/enki_xai/400/225) |

---

## 🏛️ Project Motivation

Arid environments, such as the Turkana Basin, act as "archaeological time capsules." However, identifying site footprints—specifically Roman *tempora* (temporary camps) or watchtowers—is increasingly difficult due to environmental degradation and shifting sands. 

Enki-Turkana solves this by:
1.  **SAR Penetration:** Utilizing C-band radar to identify texture differentials in subsurface stonework.
2.  **Vegetation Stress Analysis:** Monitoring NDVI anomalies where buried walls inhibit root growth.
3.  **Spectral Fusion:** Aggregating disparate inputs into a single inference tensor.

---

## 🧠 Technical Architecture

### 1. The Core Engine: U-Net Modernized
The platform utilizes a **U-Net architecture** with a ResNet-50 encoder backbone. 
*   **Multi-Modal Encoder:** Accepts 4-channel input (R, G, B, SAR-Intensity).
*   **Skip-Connections:** Ensures high-frequency spatial features (sharp corners of fort walls) are preserved during upsampling.
*   **Feature Pyramid Pooling:** Captures structures across multiple geographical scales (from small watchtowers to large *castra*).

### 2. Scientific XAI (Explainable AI)
To prevent "Black Box" archaeology, we implement **Grad-CAM**. This highlights the specific pixels that triggered a detection. 
*   **Scientific Validation:** Helps archaeologists confirm if the detection is based on geometric wall patterns or geological outcrops.
*   **Band Influence Weighting:** Dynamically calculates which sensor (e.g., SAR vs NDVI) is driving the current inference.

### 3. SAR Pre-processing (Despeckle Logic)
Synthetic Aperture Radar data is notorious for "speckle noise." Enki-Turkana includes an optional **Adaptive Speckle Reduction** filter that enhances the signal-to-noise ratio of linear features before they enter the neural network.

---

## 🛠️ Stack & Methodology

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Interface** | Next.js 15 (App Router) | High-performance full-stack framework |
| **Styling** | Tailwind v4 | Low-latency utility-first design |
| **Animation** | Motion / React | Fluid modal transitions and data visualization |
| **Inference/LLM** | Gemini 3.1 Flash | Deep-learning diagnostic reasoning |
| **State** | React Hooks / syncExternalStore | Multi-sensor display synchronization |

---

## 📖 Usage Protocol

### 1. Data Ingestion
Access the **Ingestion Portal** to either:
*   Input precise **WGS84 Coordinates** for automated tile retrieval.
*   Drag and drop pre-processed **GeoTIFF/PNG** tiles into the processor.

### 2. Neural Processing
Navigate to the **Processor View**:
*   **Spectral Toggle:** Quickly switch between RGB, NDVI, and SAR bands to identify visual anomalies.
*   **Despeckle Filter:** Enable on SAR imagery to isolate sharp, rectilinear radar reflections.
*   **Run Analysis:** Execute the neural inference.

### 3. Result Interpretation
Inspect the **Grad-CAM Heatmap** to verify the high-activation zones. A detailed report will be generated via the AI Diagnostic engine, classifying the likelihood of Roman military origin.

---

## 🔬 Academic Attribution & Research

This project is part of the **Enki-Turkana Research Initiative**. It builds upon methodologies described in:
*   *Satellite imagery in desert archaeology (Parcak, 2011)*
*   *SAR for archaeological prospection in arid regions (Luo, 2020)*

---
*Developed by the Enki-Turkana Engineering Group (2024)*
