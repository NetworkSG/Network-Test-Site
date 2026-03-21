# 2D Floor Plan to 3D Model Conversion — Full Technical Pipeline

> **How Planner5D (and similar platforms) detect a 2D floor plan image and automatically generate a 3D walkable model.**

---

## Table of Contents

1. [Overview — What's Actually Happening](#1-overview--whats-actually-happening)
2. [The Full Pipeline (6 Stages)](#2-the-full-pipeline-6-stages)
3. [Stage 1 — Input & Preprocessing](#3-stage-1--input--preprocessing)
4. [Stage 2 — Text & Graphics Separation (Dual Pipeline)](#4-stage-2--text--graphics-separation-dual-pipeline)
5. [Stage 3 — Structural Element Detection & Semantic Segmentation](#5-stage-3--structural-element-detection--semantic-segmentation)
6. [Stage 4 — Room Contour Extraction & Semantic Labeling](#6-stage-4--room-contour-extraction--semantic-labeling)
7. [Stage 5 — Vectorization (Pixels → Geometry)](#7-stage-5--vectorization-pixels--geometry)
8. [Stage 6 — 3D Reconstruction & Scene Generation](#8-stage-6--3d-reconstruction--scene-generation)
9. [The AI Architecture Stack (What's Under the Hood)](#9-the-ai-architecture-stack-whats-under-the-hood)
10. [Key Datasets & Benchmarks](#10-key-datasets--benchmarks)
11. [Open-Source Repos to Study](#11-open-source-repos-to-study)
12. [How to Build This Yourself — Practical Roadmap](#12-how-to-build-this-yourself--practical-roadmap)
13. [Tech Stack Summary](#13-tech-stack-summary)
14. [References & Further Reading](#14-references--further-reading)

---

## 1. Overview — What's Actually Happening

When you upload a 2D floor plan image (JPG, PNG, PDF, DWG) to Planner5D, their system runs it through an **AI-powered Floor Plan Recognition (FPR) pipeline** that:

1. **Sees** the image using computer vision (CV)
2. **Understands** what each pixel means (wall, door, window, room, furniture) using deep learning semantic segmentation
3. **Reads** any text labels and dimensions using OCR
4. **Converts** pixel data into clean vector geometry (lines, polygons, coordinates)
5. **Extrudes** the 2D vectors into 3D geometry (walls get height, rooms get floors/ceilings)
6. **Furnishes** the space by mapping detected room types to a 3D object library

The whole process takes 1–2 minutes on their cloud GPU infrastructure. The output is a fully editable 3D project inside their editor.

This is **not** simple image tracing. It's a multi-stage deep learning pipeline combining **semantic segmentation**, **object detection**, **OCR**, **graph neural networks**, and **parametric 3D modeling**.

---

## 2. The Full Pipeline (6 Stages)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INPUT IMAGE                                  │
│            (JPG / PNG / PDF / BMP / DWG / DXF)                      │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STAGE 1: PREPROCESSING                                             │
│  • Format normalization (PDF→raster, DWG→raster)                    │
│  • Resolution standardization (resize to model input, e.g. 512×512) │
│  • Noise removal, binarization, deskew                              │
│  • Contrast enhancement                                             │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌──────────────────┐   ┌──────────────────────┐
│ STAGE 2a:        │   │ STAGE 2b:            │
│ TEXT EXTRACTION   │   │ GRAPHICS ANALYSIS    │
│ (I-OCR Pipeline)  │   │ (CV Pipeline)        │
│ • YOLO/EAST for   │   │ • CNN encoder        │
│   text detection  │   │ • Feature extraction │
│ • PARSEq/Tesseract│   │   (walls, doors,     │
│   for OCR         │   │   windows, stairs)   │
│ • Dimension       │   │                      │
│   parsing         │   │                      │
└────────┬─────────┘   └──────────┬───────────┘
         │                        │
         └────────────┬───────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STAGE 3: STRUCTURAL ELEMENT DETECTION & SEMANTIC SEGMENTATION      │
│  • Multi-task CNN (U-Net / SegFormer / MuraNet / DeepFloorPlan)     │
│  • Task A: Wall boundary prediction (pixel-level)                   │
│  • Task B: Room type classification (pixel-level)                   │
│  • Task C: Object detection (doors, windows, stairs, furniture)     │
│  • Room-Boundary-Guided Attention (RBGA) for spatial relationships  │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STAGE 4: ROOM CONTOUR EXTRACTION & SEMANTIC LABELING               │
│  • Close openings (doors/windows → temporary solid lines)           │
│  • Flood fill to identify enclosed room regions                     │
│  • Contour tracing → room polygons                                  │
│  • Room type assignment via pixel voting + OCR cross-reference      │
│  • Build topological graph (rooms = nodes, doors = edges)           │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STAGE 5: VECTORIZATION                                             │
│  • Convert pixel masks → vector lines (wall centerlines)            │
│  • Junction detection and optimization (corner snapping)            │
│  • Wall thickness calculation                                       │
│  • Line simplification (Douglas-Peucker or iterative optimization)  │
│  • Scale calibration using OCR-detected dimensions                  │
│  • Output: structured JSON/graph with vertices, edges, room types   │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STAGE 6: 3D RECONSTRUCTION & SCENE GENERATION                      │
│  • Extrude walls to default height (2.7m–3.0m)                     │
│  • Place door/window openings with correct dimensions               │
│  • Generate floor planes and ceiling planes per room                 │
│  • Apply materials/textures based on room type                      │
│  • Auto-furnish rooms from 3D object library (8,000+ items)         │
│  • Light placement and shadow setup                                 │
│  • Output: editable 3D scene (WebGL / Three.js / proprietary)       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Stage 1 — Input & Preprocessing

### What Planner5D Accepts
- **Raster images:** PNG, JPG, BMP, PBM, PGM, PPM, PNM, TIFF
- **Documents:** PDF (rasterized internally)
- **CAD formats:** DWG, DXF (parsed to vector or rasterized)

### Preprocessing Steps

| Step | What It Does | Why It Matters |
|------|-------------|----------------|
| **Format Normalization** | Convert PDF pages to raster at 150–300 DPI. Parse DWG/DXF into line data or rasterize. | Uniform input format for the neural network |
| **Resolution Standardization** | Resize to fixed dimensions (commonly 512×512 or 1024×1024 pixels) using area interpolation for downsampling, cubic for upsampling | CNN models expect fixed input sizes |
| **Binarization** | Convert to grayscale → apply adaptive thresholding (Otsu or Sauvola) | Separates structural lines from background noise |
| **Deskew** | Detect dominant line angles via Hough Transform → rotate to align walls with axes | Axis-aligned walls are easier for the model to detect |
| **Noise Removal** | Morphological operations (erosion/dilation), small component removal | Eliminate scan artifacts, coffee stains, pencil smudges |
| **Contrast Enhancement** | CLAHE (Contrast Limited Adaptive Histogram Equalization) | Makes faint lines detectable |

### Tools Used
- **OpenCV** for all image processing operations
- **pdf2image / Poppler** for PDF rasterization
- **ezdxf** or **ODA File Converter** for DWG/DXF handling
- **Pillow (PIL)** for format conversions

---

## 4. Stage 2 — Text & Graphics Separation (Dual Pipeline)

Floor plan recognition is inherently a **hybrid problem** requiring two parallel AI pipelines:

### Pipeline A: Intelligent OCR (I-OCR) — Text Layer

The text layer extracts room labels ("Kitchen", "Bedroom"), dimensions ("3.5m × 4.2m"), and annotations.

| Sub-step | Model/Tool | Purpose |
|----------|-----------|---------|
| **Text Region Detection** | EAST, CRAFT, YOLOv8, Faster R-CNN | Locate bounding boxes around text in the floor plan |
| **Text Recognition (OCR)** | Tesseract, PARSEq, EasyOCR, MATRN | Read the actual characters within each detected box |
| **Dimension Parsing** | Rule-based regex + NLP | Extract numeric measurements and unit conversions |
| **Orientation Handling** | Rotation classification (0°, 90°, 180°, 270°) via CNN | Floor plan text can be rotated — model classifies direction before OCR |

**Key Insight:** Text detection on floor plans is harder than regular OCR because text is often rotated, placed at angles, uses architectural shorthand, and sits directly on top of graphic elements.

### Pipeline B: Computer Vision (CV) — Graphics Layer

This pipeline analyzes the visual/structural elements (walls, doors, windows, furniture symbols). It feeds directly into Stage 3.

---

## 5. Stage 3 — Structural Element Detection & Semantic Segmentation

This is the **core AI stage** — where the neural network looks at every pixel and decides what it represents.

### The Multi-Task Approach

Modern floor plan recognition uses **multi-task neural networks** that simultaneously predict multiple things from a single image:

| Task | Output | What Gets Classified |
|------|--------|---------------------|
| **Task A: Boundary Segmentation** | Pixel mask | Walls, doors, windows (boundary elements) |
| **Task B: Room Segmentation** | Pixel mask | Room areas colored by type (kitchen, bedroom, bathroom, etc.) |
| **Task C: Object Detection** | Bounding boxes | Furniture symbols, fixtures, stairs, elevators |

### Why Multi-Task?

Walls and rooms are **spatially dependent** — a wall defines where a room ends. Training a single network on both tasks simultaneously forces the model to learn these relationships, producing better results than separate models.

### Neural Network Architectures Used

#### 1. U-Net (The Foundation)
- **Encoder:** Compresses the floor plan image into a feature representation (typically ResNet-34 or ResNet-50 backbone)
- **Decoder:** Expands the features back to full resolution, producing pixel-level predictions
- **Skip connections:** Pass fine detail from encoder to decoder so thin walls don't get lost during compression
- **Best for:** Wall segmentation (detecting thin structures)

#### 2. DeepFloorPlan (ICCV 2019 — Zeng et al.)
- Uses a **VGG-16** backbone for feature extraction
- Introduces **Room-Boundary-Guided Attention (RBGA)** — a mechanism that teaches the room prediction branch to pay attention to where the boundary prediction branch found walls
- Two output branches: one for boundaries, one for room types
- **The seminal paper** that most commercial systems build on

#### 3. MuraNet (2023 — Huang et al.)
- Unified encoder (**MURA**) with separate branches
- Segmentation branch: inspired by SegNeXt
- Detection branch: inspired by YOLOX
- Achieves 78.4% IoU on CubiCasa5k dataset
- **Best for:** Joint segmentation + detection in one pass

#### 4. MitUNet (2025 — Latest Research)
- **Hybrid architecture:** Mix-Transformer encoder (from SegFormer) + U-Net CNN decoder
- Transformer captures **global context** (understanding the whole layout)
- CNN decoder preserves **fine wall details**
- Tversky loss function balances precision vs. recall for thin walls
- Achieves >92% recall, >95% precision on wall segmentation

#### 5. FloorNet (Xu et al.)
- Five specialized modules: CNN Encoder, Room Boundary Decoder (RBD), Room Type Decoder (RTD), Multiscale Room Boundary Attention Model (MRBAM), Floor Classification (FC)
- 68.65% mean IoU on R3D dataset
- **Best for:** Multi-scale feature fusion

### What the Model Actually Outputs

After this stage, you have **two colored pixel maps**:

1. **Boundary Map:** Every pixel is labeled as wall / door / window / background
2. **Room Map:** Every pixel is labeled as kitchen / bedroom / bathroom / living room / hallway / closet / balcony / background

These look like colorful "painted" versions of the original floor plan.

---

## 6. Stage 4 — Room Contour Extraction & Semantic Labeling

### From Pixels to Room Polygons

| Step | Method | Result |
|------|--------|--------|
| **Close Openings** | Replace detected door/window pixels with temporary wall pixels | Rooms become fully enclosed regions |
| **Flood Fill** | Standard flood fill algorithm on the closed boundary map | Each enclosed area gets a unique ID |
| **Contour Tracing** | OpenCV `findContours()` or marching squares | Each room becomes a polygon (list of vertices) |
| **Room Type Assignment** | Majority-vote from the room segmentation map pixels within each polygon + cross-reference with OCR-detected text labels | Each polygon gets a semantic label ("Kitchen", "Bedroom 1", etc.) |

### Building the Topological Graph

After rooms are extracted, the system builds a **topological graph**:
- **Nodes** = rooms (with type, area, polygon coordinates)
- **Edges** = connections through doors (with door position, width, swing direction)

This graph is the "digital twin" of the building's spatial relationships. It enables:
- Navigation / wayfinding
- Compliance checking (does every bedroom have a window?)
- AI-powered layout suggestions

---

## 7. Stage 5 — Vectorization (Pixels → Geometry)

### Why Vectorize?

Pixel masks are noisy and resolution-dependent. To build a 3D model, you need clean **vector data** — precise coordinates, straight lines, exact angles.

### Vectorization Pipeline

| Step | What Happens | Algorithm / Tool |
|------|-------------|-----------------|
| **Skeletonization** | Reduce thick wall regions to single-pixel-wide centerlines | Zhang-Suen thinning, morphological skeleton |
| **Junction Detection** | Find points where wall lines meet (corners, T-junctions, X-crossings) | Keypoint detection CNN or Harris corner detection |
| **Line Fitting** | Connect junctions with straight line segments | RANSAC line fitting, Hough Transform |
| **Corner Optimization** | Snap junction points to clean 90° angles where appropriate | Iterative graph optimization (minimize angle deviation + position error) |
| **Wall Thickness** | Calculate wall width from the original segmentation mask at each segment | Perpendicular distance measurement along centerline |
| **Scale Calibration** | Match pixel distances to real-world measurements using OCR-detected dimensions | Least-squares fitting of detected dimension values to pixel distances |
| **Line Simplification** | Remove redundant vertices, smooth jagged edges | Douglas-Peucker algorithm |

### Output Data Structure

```json
{
  "walls": [
    {
      "id": "w1",
      "start": {"x": 0.0, "y": 0.0},
      "end": {"x": 5.2, "y": 0.0},
      "thickness": 0.2,
      "type": "exterior"
    }
  ],
  "openings": [
    {
      "id": "d1",
      "type": "door",
      "wall_id": "w1",
      "position": 2.1,
      "width": 0.9,
      "swing": "left"
    }
  ],
  "rooms": [
    {
      "id": "r1",
      "type": "kitchen",
      "polygon": [[0,0], [5.2,0], [5.2,3.8], [0,3.8]],
      "area": 19.76
    }
  ],
  "scale": {
    "pixels_per_meter": 42.3,
    "confidence": 0.87
  }
}
```

---

## 8. Stage 6 — 3D Reconstruction & Scene Generation

### From 2D Vectors to 3D Model

| Step | Input | Output | Method |
|------|-------|--------|--------|
| **Wall Extrusion** | Wall centerlines + thickness | 3D wall meshes | Extrude 2D wall rectangles upward to default height (2.7–3.0m). Exterior walls taller/thicker than interior. |
| **Opening Placement** | Door/window data + wall geometry | Cut-outs in wall meshes | Boolean subtraction: cut rectangular holes in wall meshes at detected positions. Apply door frame / window frame 3D models. |
| **Floor Generation** | Room polygons | Floor planes | Create flat polygonal meshes at y=0 for each room. Apply material based on room type (tile for bathroom, hardwood for living room). |
| **Ceiling Generation** | Room polygons | Ceiling planes | Mirror floor polygons at wall height. Apply white/light material. |
| **Auto-Furnishing** | Room type + room dimensions | Placed 3D furniture | Rule-based or AI-powered placement engine selects contextually appropriate furniture from a library (Planner5D has 8,000+ items) and positions them within room boundaries. |
| **Lighting Setup** | Room type + dimensions | Light objects | Place ambient + point lights based on room type. Kitchens get brighter; bedrooms get warmer tones. |
| **Material Assignment** | Room type + surface type | Texture maps | Default materials per room type (e.g., marble for bathroom floor, paint for walls). User can customize later. |

### 3D Rendering Technology

Planner5D uses:
- **WebGL / Three.js** (or proprietary engine) for real-time 3D viewport
- **GPU-accelerated ray tracing** for 4K photorealistic renders
- **AR integration** (Apple Vision Pro, mobile AR) for overlaying 3D model onto real space

---

## 9. The AI Architecture Stack (What's Under the Hood)

### Model Architecture Summary

```
INPUT IMAGE (512×512 or 1024×1024 px)
         │
         ▼
┌─────────────────────────────────┐
│  ENCODER (Feature Extraction)    │
│  ──────────────────────────────  │
│  Option A: ResNet-34/50/152      │
│  Option B: VGG-16                │
│  Option C: Mix-Transformer (MiT) │
│  Option D: EfficientNet          │
│                                  │
│  Produces multi-scale feature    │
│  maps at 1/4, 1/8, 1/16, 1/32   │
│  of original resolution          │
└──────────────┬──────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌──────────────┐  ┌──────────────────┐
│ BOUNDARY     │  │ ROOM TYPE        │
│ DECODER      │  │ DECODER          │
│              │  │                  │
│ U-Net style  │  │ U-Net style      │
│ with skip    │←─│ with RBGA        │
│ connections  │  │ (Room-Boundary   │
│              │  │  Guided Attention)│
│ Output:      │  │                  │
│ Wall/Door/   │  │ Output:          │
│ Window mask  │  │ Room type mask   │
└──────┬───────┘  └────────┬─────────┘
       │                   │
       ▼                   ▼
  [Boundary Map]     [Room Type Map]
       │                   │
       └─────────┬─────────┘
                 ▼
        [POST-PROCESSING]
        • Vectorization
        • Graph construction
        • 3D extrusion
```

### Loss Functions Used During Training

| Loss | Purpose | Formula Concept |
|------|---------|----------------|
| **Cross-Entropy** | Standard pixel classification loss | Penalizes wrong pixel labels |
| **Dice Loss** | Handles class imbalance (walls are thin = few pixels) | Measures overlap between predicted and ground-truth masks |
| **Tversky Loss** | Adjustable precision/recall tradeoff for thin walls | Like Dice but with tunable α/β for FP vs FN weighting |
| **Multi-Task Uncertainty Loss** | Automatically balances boundary vs. room task losses | Learns task weights during training (Kendall et al.) |

### Training Data Requirements

A production-quality model needs:
- **5,000–50,000** annotated floor plan images
- **Pixel-level segmentation masks** for walls, doors, windows, room types
- **Bounding box annotations** for furniture/fixture detection
- **Text annotations** for OCR training data
- **Diverse styles:** hand-drawn sketches, CAD outputs, real estate marketing plans, blueprint scans

---

## 10. Key Datasets & Benchmarks

| Dataset | Size | Annotation Type | Notes |
|---------|------|----------------|-------|
| **CubiCasa5K** | 5,000 plans | 80+ categories, polygon SVG annotations | Largest public dataset. Finnish residential plans. PyTorch code available. |
| **R3D (Rent3D)** | ~215 plans | Room boundaries, types | From Toronto real estate. Used in DeepFloorPlan paper. |
| **R2V** | ~870 plans | Vectorized floor plans | Used in Raster-to-Vector paper (Liu et al., 2017). |
| **CVC-FP** | ~122 plans | Structural elements | Smaller benchmark from CVC Barcelona. |
| **MLStruct-FP** | ~954 plans | Multi-label structural | Chilean residential buildings. |
| **MURF** | Multi-unit plans | Extended structural classes (glass walls, railings, sliding doors) | Designed for multi-story/multi-unit buildings. |
| **ROBIN (Roboflow)** | ~5,000 images | COCO-format bounding boxes | CubiCasa5K converted to COCO for detection models. |

---

## 11. Open-Source Repos to Study

### Core Floor Plan Recognition

| Repository | What It Does | Tech Stack |
|-----------|-------------|-----------|
| **[zlzeng/DeepFloorplan](https://github.com/zlzeng/DeepFloorplan)** | ICCV 2019 multi-task network. THE foundational paper implementation. | TensorFlow 1.x, VGG-16 backbone |
| **[CubiCasa/CubiCasa5k](https://github.com/CubiCasa/CubiCasa5k)** | Dataset + multi-task model for floor plan analysis | PyTorch 1.0, ResNet backbone |
| **[art-programmer/FloorplanTransformation](https://github.com/art-programmer/FloorplanTransformation)** | Raster-to-Vector floor plan conversion (ICCV 2017) | PyTorch, integer programming |
| **[xmarva/floorplan-detection](https://github.com/xmarva/floorplan-detection)** | Wall/room detection using Cascade Swin Transformer + MMDetection | PyTorch, MMDetection, Swin-T |

### Supporting Tools

| Repository / Tool | Purpose |
|------------------|---------|
| **MMDetection** | Object detection framework (for door/window/furniture detection) |
| **MMSegmentation** | Semantic segmentation framework (for wall/room segmentation) |
| **Detectron2** | Facebook's detection/segmentation platform |
| **Tesseract OCR** | Open-source OCR for dimension/label reading |
| **EasyOCR** | Multi-language OCR with better accuracy on rotated text |
| **Three.js** | WebGL 3D rendering for the final visualization |
| **Open3D** | 3D data processing library |
| **Trimesh** | Python library for 3D mesh operations (extrusion, boolean ops) |

---

## 12. How to Build This Yourself — Practical Roadmap

### Phase 1: Data & Preprocessing (Week 1–2)

1. Download CubiCasa5K dataset from GitHub
2. Set up preprocessing pipeline:
   - Python + OpenCV for image normalization
   - Write resize/binarize/deskew functions
3. Convert SVG annotations to segmentation masks (scripts provided in CubiCasa5K repo)
4. Create train/val/test splits

### Phase 2: Semantic Segmentation Model (Week 3–6)

1. Start with **U-Net + ResNet-34 encoder** (proven baseline)
2. Framework: **PyTorch + segmentation_models_pytorch** library
3. Train two-head model:
   - Head 1: Wall/door/window boundary segmentation
   - Head 2: Room type segmentation
4. Use **Dice + Cross-Entropy combined loss**
5. Train for 30 epochs on GPU (NVIDIA RTX 3090+ recommended)
6. Target metrics: >85% IoU for walls, >70% IoU for room types

### Phase 3: Object Detection (Week 7–8)

1. Train **YOLOv8** or **YOLOX** on CubiCasa5K bounding box annotations
2. Detect: doors, windows, stairs, toilets, sinks, bathtubs, kitchen fixtures
3. Target: >75% mAP@50

### Phase 4: Vectorization Engine (Week 9–11)

1. Implement skeletonization (Zhang-Suen thinning)
2. Build junction detection (corner finding)
3. Implement line fitting (connect junctions with straight segments)
4. Corner optimization (snap to 90° where confidence is high)
5. Wall thickness estimation
6. Scale calibration from OCR (integrate Tesseract/EasyOCR)

### Phase 5: 3D Reconstruction (Week 12–14)

1. Wall extrusion using **Trimesh** or **Open3D**
2. Boolean subtraction for door/window openings
3. Floor/ceiling mesh generation
4. Export to **glTF** format (web-compatible 3D)
5. Build Three.js viewer for browser-based 3D visualization
6. Implement basic auto-furnishing (rule-based: if kitchen → place counter + fridge)

### Phase 6: Integration & Polish (Week 15–16)

1. Build web API (FastAPI or Flask) to accept image uploads
2. Chain all stages into an async pipeline
3. Add progress notifications (email or websocket)
4. Deploy on cloud GPU (AWS g5, GCP L4, or RunPod)
5. Build simple frontend with drag-and-drop upload + 3D viewer

---

## 13. Tech Stack Summary

### AI / Deep Learning
| Component | Recommended Tool | Alternative |
|-----------|-----------------|-------------|
| Segmentation | PyTorch + segmentation_models_pytorch | MMSegmentation |
| Detection | YOLOv8 (Ultralytics) | YOLOX, MMDetection |
| OCR | EasyOCR | Tesseract, PARSEq |
| Training | PyTorch Lightning | Raw PyTorch |
| GPU Infra | NVIDIA A100 / RTX 4090 | Cloud GPU (RunPod, Lambda) |

### Computer Vision & Geometry
| Component | Recommended Tool |
|-----------|-----------------|
| Image Processing | OpenCV |
| Morphological Ops | scikit-image |
| Vectorization | Custom (scikit-image + NetworkX) |
| Line Simplification | Shapely (Douglas-Peucker) |
| Graph Analysis | NetworkX |

### 3D Pipeline
| Component | Recommended Tool |
|-----------|-----------------|
| 3D Mesh Operations | Trimesh |
| 3D Visualization (Python) | Open3D, PyVista |
| 3D Visualization (Web) | Three.js |
| 3D Format Export | glTF (via trimesh) |
| Rendering | Three.js (realtime) / Blender (offline photorealistic) |

### Web & Deployment
| Component | Recommended Tool |
|-----------|-----------------|
| API Server | FastAPI |
| Task Queue | Celery + Redis |
| Frontend | React + Three.js / React Three Fiber |
| Cloud GPU | AWS g5 / GCP L4 / RunPod |
| Storage | S3 / GCS for uploads and 3D assets |

---

## 14. References & Further Reading

### Foundational Papers
1. **Zeng et al. (ICCV 2019)** — "Deep Floor Plan Recognition Using a Multi-Task Network with Room-Boundary-Guided Attention" — The paper that made this commercially viable.
2. **Liu et al. (ICCV 2017)** — "Raster-to-Vector: Revisiting Floorplan Transformation" — First deep learning approach to floor plan vectorization.
3. **Kalervo et al. (2019)** — "CubiCasa5K: A Dataset and an Improved Multi-Task Model for Floorplan Image Analysis" — The largest public dataset.
4. **Lv et al. (CVPR 2021)** — "Residential Floor Plan Recognition and Reconstruction" — Full pipeline from recognition to 3D with YOLOv4/v5.
5. **Kratochvíla et al. (2024)** — "Multi-Unit Floor Plan Recognition and Reconstruction Using Improved Semantic Segmentation" — Latest SOTA with MDA-Unet and MACU-Net.
6. **MitUNet (2025)** — "Enhancing Floor Plan Recognition: A Hybrid Mix-Transformer and U-Net Approach" — Cutting-edge hybrid Transformer + CNN.

### Industry Resources
- Planner5D AI Page: https://planner5d.com/ai
- Kreo FPR Analysis: https://www.kreo.net/news-2d-takeoff/floor-plan-recognition-technologies
- CubiCasa5K GitHub: https://github.com/CubiCasa/CubiCasa5k
- DeepFloorPlan GitHub: https://github.com/zlzeng/DeepFloorplan

---

> **Bottom Line:** Planner5D's magic is a carefully orchestrated pipeline of 6+ deep learning models working together — not one single AI. The hardest part isn't any single stage; it's making them all work reliably across wildly different floor plan styles (hand-drawn sketches, professional CAD, blurry phone photos of blueprints). That generalization is where the real engineering investment lives.

---

*Document created for Raemer — Multimedia Artist & UI/UX Designer*
*Last updated: March 2026*