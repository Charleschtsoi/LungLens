/** All condition keys returned by the analyze API (educational labels only). */
export const FINDING_LABELS = [
  "Atelectasis",
  "Cardiomegaly",
  "Effusion",
  "Infiltration",
  "Mass",
  "Nodule",
  "Pneumonia",
  "Pneumothorax",
  "Consolidation",
  "Edema",
  "Emphysema",
  "Fibrosis",
  "Pleural_Thickening",
  "Hernia",
] as const;

export type FindingLabel = (typeof FINDING_LABELS)[number];

/**
 * Educational descriptions (2–3 sentences each). Not diagnostic statements.
 * Shown on the results dashboard for notable model scores.
 */
export const CONDITION_DESCRIPTIONS: Record<FindingLabel, string> = {
  Atelectasis:
    "Atelectasis means part of the lung may look more collapsed or under-inflated on an X-ray. It can appear after surgery, with mucus plugging, or with shallow breathing during the image. Your radiology report and symptoms determine whether anything needs treatment—this app cannot sort that out for you.",
  Cardiomegaly:
    "Cardiomegaly refers to the heart shadow appearing larger than expected on the film. That appearance can reflect true enlargement, body habitus, or how the picture was taken. Only your clinician can decide if it is meaningful for you and whether you need an echo, labs, or follow-up imaging.",
  Effusion:
    "Pleural effusion is fluid in the space around the lung; on an X-ray it may look like layering whiteness or blunting of the lung angles. Causes range from infection and inflammation to heart failure and many other conditions. Ask your doctor how your symptoms, exam, and report fit together—do not assume a single cause from an educational overlay.",
  Infiltration:
    "Infiltrate is a broad word radiologists use for extra density in the lung tissue. It might be discussed with infection, inflammation, or fluid, but the same pattern can mean different things in different patients. Use your official report as the source of truth and ask what terms on it refer to in your case.",
  Mass:
    "A mass is a localized area that looks denser than the surrounding lung and may prompt a CT or specialist follow-up depending on size and risk factors. Many findings turn out benign, but sorting that out requires clinical context. If your report mentions a nodule or mass, ask what follow-up interval is recommended for you specifically.",
  Nodule:
    "A nodule is a small rounded spot that may be watched over time, biopsied, or dismissed depending on size, shape, and your history. Guidelines change with risk factors like smoking. Bring the exact wording of your report so your team can explain whether you are on a surveillance plan or need another test.",
  Pneumonia:
    "Pneumonia on X-ray often corresponds to whitish areas in the lung fields, but similar appearances can occur with other processes. You cannot confirm or rule out pneumonia from an educational tool. If you have fever, cough, or trouble breathing, follow your clinician’s advice about treatment and when to seek emergency care.",
  Pneumothorax:
    "Pneumothorax means air has collected outside the lung, which can partially collapse the lung on the image. Some cases are small and watched; others need urgent intervention. Sudden chest pain or shortness of breath warrants emergency evaluation—do not rely on this website to triage those symptoms.",
  Consolidation:
    "Consolidation describes lung tissue that looks solid instead of air-filled, and it is often discussed alongside infection—but not always. Your radiologist may pair it with other terms that narrow the picture. Ask how consolidation on your film relates to the impression section of your report.",
  Edema:
    "Pulmonary edema can make vessels and lung markings look more prominent and may relate to fluid overload or heart strain, among other possibilities. Doctors combine the X-ray with exam, vitals, and sometimes blood tests or ultrasound. Use this overview only to prepare questions, not to adjust medications yourself.",
  Emphysema:
    "Emphysema and related COPD changes may show subtle signs on X-ray, but the film alone is not enough to diagnose or stage disease. Spirometry and clinical history matter. If you smoke or have chronic cough, ask your care team about screening and evidence-based ways to reduce risk.",
  Fibrosis:
    "Fibrosis refers to scarring patterns that can stem from prior infection, environmental exposure, autoimmune disease, or idiopathic conditions. Characterizing fibrosis often needs high-resolution CT and specialist input. Ask whether your report recommends any subspecialty follow-up or baseline comparison to older scans.",
  Pleural_Thickening:
    "Pleural thickening means the lining around the lung looks thicker than usual, sometimes from old inflammation, prior infection, or asbestos exposure, among other causes. Significance depends on history and whether it is stable over time. Ask your doctor if prior films exist for comparison.",
  Hernia:
    "A hiatal or other hernia may alter the silhouette at the lung bases on a chest film. Many are incidental. If your report mentions a hernia, ask whether it explains any symptoms you have and whether any specific follow-up is advised beyond routine care.",
};

export interface AnatomyRegion {
  id: string;
  label: string;
  description: string;
  /** Approximate position on a typical PA chest X-ray (percent of container). */
  top: string;
  left: string;
}

export const ANATOMY_REGIONS: AnatomyRegion[] = [
  {
    id: "trachea",
    label: "Trachea",
    description: "Midline airway; deviation can have many causes your radiologist comments on.",
    top: "8%",
    left: "48%",
  },
  {
    id: "heart",
    label: "Heart",
    description: "Cardiac silhouette—size and shape are interpreted with your clinical context.",
    top: "38%",
    left: "42%",
  },
  {
    id: "left-lung",
    label: "Left lung",
    description: "Appears on the right side of the image in a standard PA view.",
    top: "28%",
    left: "62%",
  },
  {
    id: "right-lung",
    label: "Right lung",
    description: "Appears on the left side of the image in a standard PA view.",
    top: "28%",
    left: "18%",
  },
  {
    id: "diaphragm",
    label: "Diaphragm",
    description: "Domed muscle below the lungs; position helps assess lung volume.",
    top: "72%",
    left: "50%",
  },
];
