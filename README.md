# Enki-Turkana: Roman Fortification Surveillance Pipeline

![Project Status](https://img.shields.io/badge/Status-Research_Prototype-amber)
![Architecture](https://img.shields.io/badge/Architecture-U--Net-blue)
![Data](https://img.shields.io/badge/Data-SAR%20%7C%20RGB%20%7C%20NDVI-green)

**Enki-Turkana** is a specialized archaeological prospection tool designed for the detection of subsurface Roman military installations in arid environments. By leveraging multi-sensor satellite data fusion and deep semantic segmentation, the pipeline reveals anthropogenic anomalies that are frequently invisible to single-band optical sensors.

## 🛰️ Scientific Overview

Archaeological prospection in the Turkana Basin and similar arid regions (such as the Limes Tripolitanus) faces significant challenges due to aeolian sand cover and surface scrub. Enki-Turkana addresses these by fusing:

*   **Pleiades Optical (RGB):** High-resolution surface geometry and rectilinear color anomalies.
*   **Sentinel-2 NDVI:** Normalized Difference Vegetation Index to detect "crop marks" caused by differential moisture retention in buried masonry.
*   **Sentinel-1 SAR (Radar):** C-band radar capable of detecting surface roughness variations and sub-surface penetration in dry environments.

## 🧠 Technical Architecture

### 1. Neural Tile Processor
The core engine utilizes a modified **U-Net architecture** for semantic segmentation. 
*   **Encoder:** Leveraging a ResNet-based backbone for robust feature extraction across multiple spatial scales.
*   **Bottleneck:** Dense convolutional layers capturing high-level latent representations of military geometry.
*   **Decoder:** Symmetrical upsampling with skip-connections to preserve precise spatial localization of wall footprints.

### 2. Explainable AI (XAI)
The pipeline implements **Grad-CAM (Gradient-weighted Class Activation Mapping)** to provide scientific interpretability. This allows researchers to visualize which spectral bands (SAR vs. Optical) most heavily influenced specific site detections, ensuring the model is attending to geometric structures rather than environmental noise.

### 3. Multi-Modal Fusion
Input data is ingested as a multi-spectral cube. SAR data undergoes a custom **despeckling pre-processing** phase to reduce inherent radar noise, enhancing the signal-to-noise ratio for linear feature detection.

## 🛠️ Tech Stack

*   **Frontend:** Next.js 15 (App Router), Tailwind CSS
*   **Animation:** Motion (framer-motion)
*   **Inference Mockpad:** Gemini Pro Vision (via Google GenAI SDK)
*   **Icons:** Lucide React
*   **Language:** TypeScript

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   NPM or Yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/enki-turkana.git
   cd enki-turkana
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file and add your Gemini API key:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## 📋 Usage Protocol

1.  **Data Ingestion:**
    *   Enter coordinates (Latitude/Longitude) to fetch regional tiles.
    *   Or, manually upload a processed GeoTIFF or PNG tile via the **Ingestion Portal**.
2.  **Multispectral Review:**
    *   Toggle between RGB, NDVI, and SAR views.
    *   Enable **Despeckling** on SAR data to isolate rectilinear roughness anomalies.
3.  **Inference:**
    *   Trigger `Neural Analysis` to run the U-Net inference and Gemini diagnostic.
4.  **Verification:**
    *   Switch to the **Heatmap (XAI)** tab to verify model activation zones against known archaeological typologies (e.g., watchtower footprints).

## 📄 References

*   *Parcak, S. (2009). Satellite Remote Sensing for Archaeology.*
*   *Luo, L., et al. (2019). Archaeological Remote Sensing in Arid Lands.*
*   *MDPI Heritage 2024 - SAR prospection methodologies in North African Roman Limes.*

---
*Developed for the Enki-Turkana Research Initiative (2024)*
