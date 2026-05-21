# Backend models — summary for frontend

## 1. Main product flow (`POST /api/v1/analyze`)

**Endpoints:** `POST /api/v1/analyze` and `POST /pipeline/analyze` (same handler on the backend).

| Slot | Architecture | JSON field | Notes |
|------|----------------|------------|--------|
| **Model 1** | PyTorch **ResNet-50** | `model1` | Normal / Pneumonia-Bacteria / Pneumonia-Virus |
| **Model 2** | **Tabular** COPD screen | `model2` | `input_type: "tabular"`; requires questionnaire `patient_data` |
| **Model 3** | PyTorch **DenseNet-121** | `model3` | COVID-19 / Normal / Pneumonia; **`gradcam`** + **`input_preview_base64`** |
| **Model 4 (report)** | Rule / LLM synthesis | `model4` | Educational report text — **not** Swin-T |
| **Model 4 (vision)** | **Swin-T** | `model4_swint` | 6-class chest X-ray |
| **Model 5** | DenseNet-121 **H5** | `model5_densenet` | Expansion classifier (~2–14 classes depending on weights) |
| **Model 6** | **ResNet-152V2** (Edward) | `model6_vision_h5` | 3 classes: Normal, Viral Pneumonia, Lung Opacity; optional `gradcam` |

- **`clinical_risk`**: rule-based questionnaire severity (separate from Model 2 tabular NN).
- **Edward H5** uses legacy env `H5_MODEL2_*` → **`model6_vision_h5`** (not tabular `model2`).
- **`copd_screening`**: **removed** — use **`model2`** with `input_type: "tabular"`.
- Reference payload: backend repo `sample_response.json`.

## 2. DenseNet-121 standalone (`POST /predict/densenet`)

Same trained weights as **`model3`** in analyze when both run (`GET /debug`).

**Multipart:** field name `image`. **Auth:** `X-API-Key` when `REQUIRE_API_KEY=true`.

**Success JSON (200):** `success`, `prediction`, `confidence`, `probabilities`, `gradcam`, `input_preview_base64`.

## 3. What frontend should verify

| Check | Detail |
|--------|--------|
| Analyze payload | Expect **`model1`**, tabular **`model2`**, **`model3`**, **`model4_swint`**, **`model5_densenet`**, **`model6_vision_h5`** (when enabled), **`clinical_risk`**, **`model4`** report when enabled. |
| Visual pipeline UI | Show **Model 1, 2 (Edward ResNet), 3, 4 (Swin), 5** — user-facing numbers; API field `model6_vision_h5`. |
| Model 2 (UI) / `model6_vision_h5` | Exactly **3** probability keys when ResNet runs; `ClassProbabilitiesList` handles any count. |
| Clinical UI (Model 6 in UI) | Show **`model2`** tabular when `status === "success"` && `input_type === "tabular"`. |
| `model2.confidence` | Always **P(High COPD Risk)** (display % even for Low risk rows). |
| Base URL | Server proxy: `BACKEND_API_BASE_URL`. |

## 4. Input geometry (backend only)

ResNet-50 and DenseNet use **`Resize(256)` + `CenterCrop(224)`**. The Next.js app displays backend-provided overlays and `input_preview_base64`.

## 5. One-line for PM/design

**Five** optional X-ray models (ResNet-50, Edward ResNet-152V2 as **UI Model 2**, DenseNet PyTorch, Swin-T, DenseNet H5) plus **tabular COPD (UI Model 6; API `model2`)** from the questionnaire, rule-based **clinical risk**, and **report** text.
