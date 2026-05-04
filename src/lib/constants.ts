/** Keys returned by the analyze API `predictions` object (primary ML classifications). */
export const FINDING_LABELS = ["Pneumonia", "Lung Opacity", "COVID-19"] as const;

export const PIPELINE = {
  gateThreshold: 0.3,
  questionnaireRequiredOnContinue: true,
  reportDisclaimer:
    "LungLens is an educational tool only. This output is not a medical diagnosis. Always consult a qualified healthcare professional.",
} as const;

export type FindingLabel = (typeof FINDING_LABELS)[number];

/**
 * Educational descriptions (not diagnostic). Shown on the results dashboard for notable model scores.
 */
export const CONDITION_DESCRIPTIONS: Record<FindingLabel, string> = {
  Pneumonia:
    "Pneumonia indicates an infection that inflames the air sacs in one or both lungs, which may fill with fluid or pus. The AI flagged patterns consistent with this. Your doctor will correlate this with symptoms like fever or cough.",
  "Lung Opacity":
    "Lung opacity is a broad finding indicating areas of the lung that appear more solid or cloudy than normal on an X-ray. This can be caused by fluid, infection, or tissue changes, and requires clinical correlation.",
  "COVID-19":
    "The model identified patterns that are frequently associated with COVID-19 viral pneumonia, such as bilateral opacities. This is an educational flag and requires a PCR or antigen test to confirm.",
};

export interface AnatomyRegion {
  id: string;
  label: string;
  description: string;
  /** Approximate landmark position on the displayed PA chest X-ray frame. */
  top: string;
  left: string;
  labelSide?: "left" | "right";
}

export const ANATOMY_REGIONS: AnatomyRegion[] = [
  {
    id: "trachea",
    label: "Trachea",
    description: "Midline airway; deviation can have many causes your radiologist comments on.",
    top: "14%",
    left: "50%",
  },
  {
    id: "heart",
    label: "Heart",
    description: "Cardiac silhouette size and shape are interpreted with your clinical context.",
    top: "48%",
    left: "52%",
    labelSide: "left",
  },
  {
    id: "right-lung",
    label: "Right lung",
    description: "On a standard PA view, the patient's right lung appears on the left side of the image.",
    top: "42%",
    left: "32%",
    labelSide: "left",
  },
  {
    id: "left-lung",
    label: "Left lung",
    description: "On a standard PA view, the patient's left lung appears on the right side of the image.",
    top: "42%",
    left: "68%",
    labelSide: "right",
  },
  {
    id: "diaphragm",
    label: "Diaphragm",
    description: "The muscle below the lungs; its position hints at lung volume and adjacent structures.",
    top: "78%",
    left: "50%",
  },
];
