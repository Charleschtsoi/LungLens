# Backend models — summary for frontend

## 1. Main product flow (`POST /api/v1/analyze`)

**Endpoints:** `POST /api/v1/analyze` and `POST /pipeline/analyze` (same handler on the backend).

| Slot | Architecture | JSON field | Notes |
|------|----------------|------------|--------|
| **Model 1** | PyTorch **ResNet-50** | `model1` | Normal / Pneumonia-Bacteria / Pneumonia-Virus |
| **Model 2** | **ResNet-152V2** (Edward) | `model2` | 3 classes: Normal, Viral Pneumonia, Lung Opacity; `input_type: "vision"`; optional `gradcam` |
| **Model 3** | PyTorch **DenseNet-121** | `model3` | COVID-19 / Normal / Pneumonia; **`gradcam`** + **`input_preview_base64`** |
| **Model 4 (report)** | Rule / LLM synthesis | `model4` | Educational report text — **not** Swin-T |
| **Model 4 (vision)** | **Swin-T** | `model4_swint` | 6-class chest X-ray |
| **Model 5** | DenseNet-121 **H5** | `model5_densenet` | Expansion classifier (~2–14 classes depending on weights) |
| **Model 6** | **Tabular** COPD screen | `model6` | `input_type: "tabular"`; requires questionnaire `patient_data` |

- **`clinical_risk`**: rule-based questionnaire severity (separate from Model 6 tabular NN).
- **Legacy:** `model6_vision_h5` (pre-alignment Edward slot) and tabular-shaped `model2` are mapped by the Next.js BFF when present.
- **`copd_screening`**: alias for **`model6`** tabular output.
- Reference payload: backend repo `sample_response.json`.

## 2. DenseNet-121 standalone (`POST /predict/densenet`)

Same trained weights as **`model3`** in analyze when both run (`GET /debug`).

**Multipart:** field name `image`. **Auth:** `X-API-Key` when `REQUIRE_API_KEY=true`.

## 3. What frontend should verify

| Check | Detail |
|--------|--------|
| Analyze payload | Expect **`model1`**, vision **`model2`**, **`model3`**, **`model4_swint`**, **`model5_densenet`**, tabular **`model6`**, **`clinical_risk`**, **`model4`** report when enabled. |
| Visual pipeline UI | Show **Model 1, 2, 3, 4 (Swin), 5** — not tabular Model 6 (clinical section). |
| Model 2 probabilities | Exactly **3** keys when ResNet runs. |
| Clinical UI | Show **`model6`** when `status === "success"` && `input_type === "tabular"`. |
| `model6.confidence` | Always **P(High COPD Risk)** (display % even for Low risk rows). |

## 4. One-line for PM/design

**Five** optional X-ray models (ResNet-50, Edward ResNet-152V2 as **Model 2**, DenseNet PyTorch, Swin-T, DenseNet H5) plus **tabular COPD (Model 6)** from the questionnaire, rule-based **clinical risk**, and **report** text.
