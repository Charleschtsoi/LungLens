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

/** Short educational blurbs — not diagnostic statements. */
export const CONDITION_DESCRIPTIONS: Record<FindingLabel, string> = {
  Atelectasis: "May relate to lung collapse or poor inspiration on the image — your report explains the clinical context.",
  Cardiomegaly: "Refers to how large the heart shadow appears — only your clinician can say if this is significant for you.",
  Effusion: "Fluid near the lungs can appear as layering whiteness — many causes exist; ask your doctor how this applies to you.",
  Infiltration: "A general term for increased density in lung tissue — your radiologist specifies what they see.",
  Mass: "A focal area that may warrant follow-up — interpretation requires clinical correlation.",
  Nodule: "A small spot that may or may not need tracking over time — follow your care team's plan.",
  Pneumonia: "Infection can create whitish areas — similar patterns can have other causes; do not self-diagnose.",
  Pneumothorax: "Air outside the lung can collapse part of the lung — urgent symptoms need emergency care.",
  Consolidation: "Dense lung tissue on X-ray — often discussed with infection but not exclusively.",
  Edema: "Fluid overload or heart-related changes can alter lung appearance — your doctor integrates symptoms and labs.",
  Emphysema: "Chronic lung changes may look a certain way on X-ray — COPD diagnosis is more than one film.",
  Fibrosis: "Scarring patterns have many causes — specialty review is common.",
  Pleural_Thickening: "Lining of the lung can thicken from old inflammation or other processes.",
  Hernia: "Some abdominal structures may affect the chest view — incidental findings are clarified in the report.",
};

export interface AnatomyRegion {
  id: string;
  label: string;
  description: string;
}

export const ANATOMY_REGIONS: AnatomyRegion[] = [
  { id: "trachea", label: "Trachea", description: "Midline airway — position is noted on formal reads." },
  { id: "heart", label: "Heart shadow", description: "Cardiac silhouette size and shape." },
  { id: "lungs", label: "Lung fields", description: "Air-filled spaces; increased whiteness has many differential considerations." },
  { id: "diaphragm", label: "Diaphragm", description: "Curved muscle below the lungs; helps assess lung volumes." },
];
