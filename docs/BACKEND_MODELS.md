# Backend models — summary for frontend

## 1. Main product flow (`POST /api/v1/analyze`)

**Endpoints:** `POST /api/v1/analyze` and `POST /pipeline/analyze` (same handler on the backend).

| Slot | Architecture | JSON field | Notes |
|------|----------------|------------|--------|
| **Model 1** | PyTorch **ResNet-50** | `model1` | Normal / Pneumonia-Bacteria / Pneumonia-Virus — **Visual X-Ray** |
| **Model 2** | Tabular **Chronic Lung Risk (COPD)** | `model2` or `copd_screening` | Questionnaire inputs; `input_type: "tabular"` — **Clinical Patient Assessment** (not an X-ray classifier) |
| **Model 3** | PyTorch **DenseNet-121** | `model3` | COVID-19 / Normal / Pneumonia; **`gradcam`** + **`input_preview_base64`** — **Visual X-Ray** |
| **Model 4 (report)** | Rule / LLM synthesis | `model4` | Educational report text — **not** Swin-T |
| **Model 4 (vision)** | **Swin-T** | `model4_swint` | 6-class chest X-ray — **Visual X-Ray** |
| **Model 5** | DenseNet-121 **H5** | `model5_densenet` | Expansion classifier (~2–14 classes depending on weights) — **Visual X-Ray** |

- **`clinical_risk`**: rule-based questionnaire severity (separate from Model 2 COPD score).
- **Legacy:** backends may send tabular COPD on `model2` with `input_type: "tabular"` or on `copd_screening`. The Next proxy normalizes both to `model2` + `copd_screening` for the client.
- **Do not** show Model 2 in the Visual X-Ray pipeline card list (Models 1, 3, 4, 5 only).
- Reference payload: backend repo `sample_response.json`.

## 2. DenseNet-121 standalone (`POST /predict/densenet`)

Same trained weights as **`model3`** in analyze when both run (`GET /debug`).

**Multipart:** field name `image`. **Auth:** `X-API-Key` when `REQUIRE_API_KEY=true`.

**Success JSON (200):** `success`, `prediction`, `confidence`, `probabilities`, `gradcam`, `input_preview_base64`.

## 3. What frontend should verify

| Check | Detail |
|--------|--------|
| Analyze payload | Expect **`model1`**, tabular **`model2`** (or **`copd_screening`**), **`model3`**, **`model4_swint`**, **`model5_densenet`**, **`clinical_risk`**, **`model4`** report when enabled. |
| Visual pipeline UI | Show **Model 1, 3, 4 (Swin), 5** only — **not** Model 2. |
| Clinical UI (Model 2) | Show when `status === "success"` and tabular COPD data is present (`input_type: "tabular"` or legacy `copd_screening` shape). Badge: **Model 2 ✓**. |
| `model2.confidence` | Always **P(High COPD Risk)** (display % even when the label is Low risk). Copy: “probability of high COPD risk”, not multi-class “highest probability”. |
| Base URL | Server proxy: `BACKEND_API_BASE_URL`. |

## 4. Input geometry (backend only)

ResNet-50 and DenseNet use **`Resize(256)` + `CenterCrop(224)`**. The Next.js app displays backend-provided overlays and `input_preview_base64`.

## 5. One-line for PM/design

**Four** X-ray models (ResNet-50, DenseNet PyTorch, Swin-T, DenseNet H5) plus **Model 2 tabular COPD** from the questionnaire, rule-based **clinical_risk**, and **report** text.
