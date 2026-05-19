# Backend models — summary for frontend

## 1. Main product flow (`POST /api/v1/analyze`)

**Endpoints:** `POST /api/v1/analyze` and `POST /pipeline/analyze` (same handler on the backend).

| Slot | Architecture | JSON field | Default classes (confirm via `GET /health`) |
|------|----------------|------------|-----------------------------------------------|
| **Model 1** | PyTorch **ResNet-50** | `model1` | Normal / Pneumonia-Bacteria / Pneumonia-Virus |
| **Model 2** | Keras H5 **ResNet-152V2** | `model2` | Normal / Lung Opacity / Viral Pneumonia (API uses spaces) |
| **Model 3** | PyTorch **DenseNet-121** | `model3` | COVID-19 / Normal / Pneumonia; **`gradcam`** + **`input_preview_base64`** (224×224 center crop matching model input) |
| **Model 4 (Swin-T)** | **Swin Transformer** | `model4_swint` | 6-class probabilities + `prediction` / `confidence` / `status` |
| **Model 5 (DenseNet)** | **DenseNet-121** expansion | `model5_densenet` | Same block shape as `model4_swint`; up to ~14 classes at inference |
| **COPD screen** | Tabular Keras | `copd_screening` | When `patient_data` is present on analyze |
| **Gemini educator** | BYOK optional | `llm_evaluation` | `{ status, text }` — English markdown in `text` |

- **`clinical_risk`**: questionnaire-derived severity (not the DenseNet block).
- **`model4`**: questionnaire / rules educational report (not Swin-T; do not confuse with `model4_swint`).

Canonical successful analyze example: [`sample_response.json`](../sample_response.json) at repo root (copy from backend when updating contract).
- Mock **14-class** `predictions` + pipeline **heatmap** may still be educational scaffolding; they are not the same as the three classifier outputs above.

## 2. DenseNet-121 standalone (`POST /predict/densenet`)

The backend **also** exposes DenseNet on its own for debugging or thin clients. Same trained weights as **`model3`** in analyze when both run (`GET /debug` notes this alignment).

**Multipart:** field name `image` (same idea as analyze).

**Auth:** `X-API-Key` when `REQUIRE_API_KEY=true`.

**Success JSON (200):** `success`, `prediction`, `confidence`, `probabilities`, `gradcam` (base64 PNG), and **`input_preview_base64`** (same 224×224 center crop as model input, for side-by-side UI alignment with Grad-CAM).

**Errors:** `{"success": false, "error": "..."}`.

**Discovery:**

- `GET /health` → `models.densenet121_pt`
- `GET /debug` → `densenet121_pt`, `predict_endpoint: "/predict/densenet"`

## 3. What frontend should verify

| Check | Detail |
|--------|--------|
| Analyze payload | Expect **`model1`**, **`model2`**, **`model3`** (DenseNet), **`clinical_risk`**, **`model4`** when enabled on the backend. |
| UI naming | Use **Model 1 — ResNet-50**, **Model 2 — ResNet-152V2**, **Model 3 — DenseNet-121** (i18n keys `results.model1`, `results.model2`, `results.model3DenseNet`). |
| Supplemental DenseNet call | This Next app may still call `POST /api/predict/densenet` to refresh Grad-CAM if analyze did not return overlay; merge logic lives in `dense-net-from-analysis.ts`. |
| Base URL | Server-side proxy uses `BACKEND_API_BASE_URL`. |

## 4. Input geometry (backend only — QA mental model)

ResNet-50 and DenseNet **do not** apply a stretched `Resize((224, 224))` on arbitrary aspect ratios. They use **`Resize(256)` + `CenterCrop(224)`** so class logits and Grad-CAM stay aligned with the **same** spatial crop.

The Next.js app **does not** reimplement this; it only displays whatever the backend sends. For DenseNet, **`input_preview_base64`** is a PNG of that **224×224 center crop** so the “original vs Grad-CAM” columns match framing.

## 5. One-line for PM/design

Three neural stages in analyze: **ResNet-50**, **ResNet-152V2 (H5)**, **DenseNet-121**, plus rule-based **clinical risk** (questionnaire) and **report** text.
