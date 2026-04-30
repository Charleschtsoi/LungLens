import { jsPDF } from "jspdf";

export interface PdfSectionFinding {
  label: string;
  scorePct: number;
}

export interface BuildEducationReportPdfInput {
  filename: string;
  title: string;
  subtitle: string;
  generatedAtLabel: string;
  generatedAtValue: string;
  disclaimer: string;
  pipelineTitle: string;
  stage1Label: string;
  stage1Value: string;
  stage2Label: string;
  stage2Value: string;
  gateDecisionLabel: string;
  gateDecisionValue: string;
  stage3RiskLabel: string;
  stage3RiskValue: string;
  totalLatencyLabel: string;
  totalLatencyValue: string;
  reportSummaryLabel: string;
  reportSummaryValue: string;
  findingsTitle: string;
  findings: PdfSectionFinding[];
  noFindingsText: string;
  doctorQuestionsTitle: string;
  doctorQuestions: string[];
  xrayTitle: string;
  attentionMapTitle: string;
  xrayUrl: string | null;
  heatmapBase64: string | null;
}

function toDateStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function imageUrlToDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function fitSize(maxW: number, maxH: number, srcW: number, srcH: number): { w: number; h: number } {
  const ratio = Math.min(maxW / srcW, maxH / srcH);
  return { w: Math.max(1, srcW * ratio), h: Math.max(1, srcH * ratio) };
}

export async function buildEducationReportPdf(input: BuildEducationReportPdfInput): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const usableW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (need: number) => {
    if (y + need <= pageH - margin) return;
    doc.addPage();
    y = margin;
  };

  const writeWrapped = (text: string, fontSize = 11, lineGap = 5) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text || "-", usableW);
    const lineH = fontSize + lineGap;
    ensureSpace(lines.length * lineH + 2);
    doc.text(lines, margin, y);
    y += lines.length * lineH;
  };

  const sectionTitle = (text: string) => {
    ensureSpace(28);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(text, margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(input.title, margin, y);
  y += 24;

  doc.setFont("helvetica", "normal");
  writeWrapped(input.subtitle, 11, 4);
  y += 4;
  writeWrapped(`${input.generatedAtLabel}: ${input.generatedAtValue}`, 10, 3);
  y += 6;
  writeWrapped(input.disclaimer, 10, 3);
  y += 4;

  sectionTitle(input.pipelineTitle);
  writeWrapped(`${input.stage1Label}: ${input.stage1Value}`);
  writeWrapped(`${input.stage2Label}: ${input.stage2Value}`);
  writeWrapped(`${input.gateDecisionLabel}: ${input.gateDecisionValue}`);
  writeWrapped(`${input.stage3RiskLabel}: ${input.stage3RiskValue}`);
  writeWrapped(`${input.totalLatencyLabel}: ${input.totalLatencyValue}`);

  sectionTitle(input.reportSummaryLabel);
  writeWrapped(input.reportSummaryValue);

  sectionTitle(input.findingsTitle);
  if (input.findings.length === 0) {
    writeWrapped(input.noFindingsText);
  } else {
    input.findings.forEach((f) => {
      writeWrapped(`- ${f.label} (${f.scorePct}%)`);
    });
  }

  sectionTitle(input.doctorQuestionsTitle);
  input.doctorQuestions.forEach((q, i) => {
    writeWrapped(`${i + 1}. ${q}`);
  });

  const xrayDataUrl = input.xrayUrl ? await imageUrlToDataUrl(input.xrayUrl) : null;
  const heatmapDataUrl = input.heatmapBase64 ? `data:image/png;base64,${input.heatmapBase64}` : null;

  if (xrayDataUrl) {
    sectionTitle(input.xrayTitle);
    const img = new Image();
    img.src = xrayDataUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
    const size = fitSize(usableW, 240, img.naturalWidth || 4, img.naturalHeight || 3);
    ensureSpace(size.h + 16);
    doc.addImage(xrayDataUrl, "PNG", margin, y, size.w, size.h);
    y += size.h + 8;
  }

  if (heatmapDataUrl) {
    sectionTitle(input.attentionMapTitle);
    const img = new Image();
    img.src = heatmapDataUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
    const size = fitSize(usableW, 240, img.naturalWidth || 4, img.naturalHeight || 3);
    ensureSpace(size.h + 16);
    doc.addImage(heatmapDataUrl, "PNG", margin, y, size.w, size.h);
    y += size.h + 8;
  }

  doc.save(`${input.filename}-${toDateStamp()}.pdf`);
}
