import { jsPDF } from "jspdf";

export interface PdfSectionFinding {
  label: string;
  scorePct: number;
}

/** Pipeline row: bold primary line + muted “Powered by …” subline (matches web UI). */
export interface PdfPipelineRow {
  primary: string;
  poweredBy: string;
}

export interface PdfPipelineSection {
  heading: string;
  rows: PdfPipelineRow[];
}

export interface BuildEducationReportPdfInput {
  filename: string;
  /** Shown in the repeating page header (e.g. “LungLens Educational Report”). */
  reportHeaderTitle: string;
  generatedAtLabel: string;
  generatedAtValue: string;
  /** One-time intro under the first header (e.g. results subtitle). */
  documentSubtitle: string;
  /** Section title for the Gemini / LLM block. */
  llmSectionTitle: string;
  /** Raw markdown from `llm_evaluation.text`; omitted if absent or not success. */
  llmMarkdown: string | null;
  pipelineTitle: string;
  pipelineSections: PdfPipelineSection[];
  /** Optional single line, e.g. “Gate decision: …” */
  gateLine: string | null;
  /** Optional single line for questionnaire clinical risk. */
  clinicalRiskLine: string | null;
  reportSummaryLabel: string;
  reportSummaryValue: string;
  findingsTitle: string;
  findings: PdfSectionFinding[];
  noFindingsText: string;
  doctorQuestionsTitle: string;
  doctorQuestions: string[];
  warningsTitle: string;
  warnings: string[];
  /** Full-width footer on the last page (medical disclaimer). */
  footerDisclaimer: string;
  xrayTitle: string;
  attentionMapTitle: string;
  xrayUrl: string | null;
  heatmapBase64: string | null;
}

const HEADER_TOP = 36;
const HEADER_RULE_GAP = 10;
const CONTENT_TOP = HEADER_TOP + HEADER_RULE_GAP + 8;
const FOOTER_GAP_ABOVE_RULE = 8;

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

/** Symbols / emoji Helvetica cannot render in jsPDF (shows as mojibake e.g. Ø>Þz). */
function isUnsupportedSymbolForHelveticaPdf(codePoint: number): boolean {
  if (codePoint === 0xfe0f || codePoint === 0x200d || codePoint === 0x200b || codePoint === 0xfeff)
    return true;
  if (codePoint >= 0x2600 && codePoint <= 0x27bf) return true;
  if (codePoint >= 0x1f300 && codePoint <= 0x1faf9) return true;
  if (codePoint >= 0x1f600 && codePoint <= 0x1f64f) return true;
  if (codePoint >= 0x1f680 && codePoint <= 0x1f6ff) return true;
  if (codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff) return true;
  if (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) return true;
  return false;
}

/**
 * jsPDF's built-in Helvetica font has no glyphs for emoji and many Unicode symbols.
 * Those code points render as mojibake (e.g. "Ø>Þz", "Ø=ÜË"). Strip them so the PDF
 * stays readable; the web UI still shows full Unicode from the backend.
 */
function sanitizeTextForHelveticaPdf(text: string): string {
  const s = text.normalize("NFKC");
  let out = "";
  let i = 0;
  while (i < s.length) {
    const cp = s.codePointAt(i)!;
    const len = cp > 0xffff ? 2 : 1;
    if (!isUnsupportedSymbolForHelveticaPdf(cp)) {
      out += String.fromCodePoint(cp);
    }
    i += len;
  }
  return out
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type InlineSeg = { bold: boolean; text: string };

/** Split a line on `**bold**` markers into segments. */
function parseInlineSegments(line: string): InlineSeg[] {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter((p) => p.length > 0);
  const out: InlineSeg[] = [];
  for (const p of parts) {
    const m = /^\*\*([^*]+)\*\*$/.exec(p);
    if (m) out.push({ bold: true, text: m[1] });
    else out.push({ bold: false, text: p });
  }
  return out;
}

function tokenizeForWrap(segments: InlineSeg[]): { bold: boolean; word: string }[] {
  const tokens: { bold: boolean; word: string }[] = [];
  for (const seg of segments) {
    const words = seg.text.split(/\s+/).filter(Boolean);
    for (const w of words) tokens.push({ bold: seg.bold, word: w });
  }
  return tokens;
}

/** Lay out markdown-ish content: headings (#), bullets, paragraphs; supports inline **bold**. */
function drawMarkdownContent(
  doc: jsPDF,
  markdown: string,
  margin: number,
  usableW: number,
  pageH: number,
  startY: number,
  contentTop: number,
  drawHeader: () => void,
): number {
  let y = startY;
  const normalSize = 10;
  const headingSize = 11;
  const smallHeadingSize = 10.5;
  const lineGap = 4;
  const paraGap = 6;

  const lineHeight = (fs: number) => fs + lineGap;

  const ensureMdSpace = (need: number) => {
    if (y + need <= pageH - margin) return;
    doc.addPage();
    drawHeader();
    y = contentTop;
  };

  const drawParagraph = (text: string, fs: number, bullet: string | null) => {
    const segments = parseInlineSegments(text.trim());
    const words = tokenizeForWrap(segments);
    if (words.length === 0) return;

    doc.setFontSize(fs);
    const bulletW = bullet ? doc.getTextWidth(bullet) : 0;

    let line: typeof words = [];
    let lineW = 0;
    let isFirstBulletLine = Boolean(bullet);

    const tryFlush = () => {
      if (line.length === 0) return;
      ensureMdSpace(lineHeight(fs) + 2);
      let x = margin;
      if (bullet) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(fs);
        if (isFirstBulletLine) {
          doc.text(bullet, x, y);
          x += bulletW;
        } else {
          x = margin + bulletW;
        }
      }
      for (const tw of line) {
        doc.setFont("helvetica", tw.bold ? "bold" : "normal");
        doc.setFontSize(fs);
        const piece = tw.word + " ";
        doc.text(piece, x, y);
        x += doc.getTextWidth(piece);
      }
      y += lineHeight(fs);
      line = [];
      lineW = 0;
      if (bullet) isFirstBulletLine = false;
    };

    for (const tw of words) {
      doc.setFont("helvetica", tw.bold ? "bold" : "normal");
      doc.setFontSize(fs);
      const w = doc.getTextWidth(tw.word + " ");
      const hang = bullet ? bulletW : 0;
      const maxTextW = usableW - hang;
      if (line.length > 0 && lineW + w > maxTextW + 0.5) {
        tryFlush();
      }
      line.push(tw);
      lineW += w;
    }
    tryFlush();
  };

  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      y += paraGap;
      i++;
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const fs = level === 1 ? headingSize + 1 : level === 2 ? headingSize : smallHeadingSize;
      ensureMdSpace(lineHeight(fs) + paraGap);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(fs);
      const wrapped = doc.splitTextToSize(content, usableW);
      doc.text(wrapped, margin, y);
      y += wrapped.length * lineHeight(fs);
      doc.setFont("helvetica", "normal");
      i++;
      continue;
    }

    const bulletMatch = /^[-*]\s+(.+)$/.exec(trimmed);
    if (bulletMatch) {
      drawParagraph(bulletMatch[1], normalSize, "• ");
      i++;
      continue;
    }

    // Gather continuation lines for paragraph
    let para = trimmed;
    let j = i + 1;
    while (j < lines.length && lines[j].trim() !== "" && !/^(#{1,3})\s/.test(lines[j].trim()) && !/^[-*]\s/.test(lines[j].trim())) {
      para += " " + lines[j].trim();
      j++;
    }
    drawParagraph(para, normalSize, null);
    i = j;
  }

  return y;
}

export async function buildEducationReportPdf(input: BuildEducationReportPdfInput): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const usableW = pageW - margin * 2;

  const dateLine = `${input.generatedAtLabel}: ${input.generatedAtValue}`;

  const drawRepeatHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(35, 45, 62);
    doc.text(input.reportHeaderTitle, margin, HEADER_TOP);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(115, 120, 128);
    const dw = doc.getTextWidth(dateLine);
    doc.text(dateLine, pageW - margin - dw, HEADER_TOP);
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(220, 224, 232);
    doc.setLineWidth(0.5);
    doc.line(margin, HEADER_TOP + HEADER_RULE_GAP, pageW - margin, HEADER_TOP + HEADER_RULE_GAP);
  };

  let y = CONTENT_TOP;

  const onNewPage = () => {
    drawRepeatHeader();
    y = CONTENT_TOP;
  };

  const ensureSpace = (need: number) => {
    if (y + need <= pageH - margin) return;
    doc.addPage();
    onNewPage();
  };

  drawRepeatHeader();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 95, 105);
  const subLines = doc.splitTextToSize(input.documentSubtitle, usableW);
  ensureSpace(subLines.length * 14 + 12);
  doc.text(subLines, margin, y);
  y += subLines.length * 14 + 10;
  doc.setTextColor(0, 0, 0);

  if (input.llmMarkdown && input.llmMarkdown.trim()) {
    const mdSafe = sanitizeTextForHelveticaPdf(input.llmMarkdown.trim());
    if (mdSafe.length > 0) {
      ensureSpace(28);
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 58, 138);
      doc.text(input.llmSectionTitle, margin, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(40, 45, 55);
      y = drawMarkdownContent(doc, mdSafe, margin, usableW, pageH, y, CONTENT_TOP, drawRepeatHeader);
      y += 10;
      doc.setTextColor(0, 0, 0);
    }
  }

  const sectionTitle = (text: string) => {
    ensureSpace(26);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(35, 40, 48);
    doc.text(text, margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
  };

  const subsectionTitle = (text: string) => {
    ensureSpace(22);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(text, margin, y);
    y += 12;
    doc.setFont("helvetica", "normal");
  };

  const writeWrapped = (text: string, fontSize = 10, lineGap = 4) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text || "-", usableW);
    const lineH = fontSize + lineGap;
    ensureSpace(lines.length * lineH + 2);
    doc.text(lines, margin, y);
    y += lines.length * lineH;
  };

  sectionTitle(input.pipelineTitle);

  for (const section of input.pipelineSections) {
    subsectionTitle(section.heading);
    for (const row of section.rows) {
      const primaryLines = doc.splitTextToSize(row.primary, usableW);
      const subLineH = 9 + 3;
      const primaryBlockH = primaryLines.length * (11 + 4) + subLineH + 8;
      ensureSpace(primaryBlockH);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(25, 30, 38);
      doc.text(primaryLines, margin, y);
      y += primaryLines.length * (11 + 4);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(115, 120, 130);
      doc.text(row.poweredBy, margin, y);
      y += subLineH;
      doc.setTextColor(0, 0, 0);
    }
    y += 4;
  }

  if (input.gateLine) {
    writeWrapped(input.gateLine, 10, 4);
    y += 4;
  }
  if (input.clinicalRiskLine) {
    writeWrapped(input.clinicalRiskLine, 10, 4);
    y += 4;
  }

  sectionTitle(input.reportSummaryLabel);
  writeWrapped(input.reportSummaryValue, 10, 4);

  sectionTitle(input.findingsTitle);
  if (input.findings.length === 0) {
    writeWrapped(input.noFindingsText);
  } else {
    input.findings.forEach((f) => {
      writeWrapped(`• ${f.label} (${f.scorePct}% confidence)`);
    });
  }

  sectionTitle(input.doctorQuestionsTitle);
  input.doctorQuestions.forEach((q, i) => {
    writeWrapped(`${i + 1}. ${q}`);
  });

  if (input.warnings.length > 0) {
    sectionTitle(input.warningsTitle);
    input.warnings.forEach((w) => writeWrapped(`• ${w}`));
  }

  const placeImageBlock = async (title: string, dataUrl: string) => {
    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
    const titleLines = doc.splitTextToSize(title, usableW);
    const titleH = titleLines.length * 16 + 8;
    const size = fitSize(usableW, 240, img.naturalWidth || 4, img.naturalHeight || 3);
    const blockH = titleH + size.h + 20;
    ensureSpace(blockH);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(titleLines, margin, y);
    y += titleH;

    doc.addImage(dataUrl, "PNG", margin, y, size.w, size.h);
    y += size.h + 14;
  };

  const xrayDataUrl = input.xrayUrl ? await imageUrlToDataUrl(input.xrayUrl) : null;
  const heatmapDataUrl = input.heatmapBase64 ? `data:image/png;base64,${input.heatmapBase64}` : null;

  if (xrayDataUrl) {
    await placeImageBlock(input.xrayTitle, xrayDataUrl);
  }
  if (heatmapDataUrl) {
    await placeImageBlock(input.attentionMapTitle, heatmapDataUrl);
  }

  // --- Footer on last page only ---
  const footerText = input.footerDisclaimer;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const footerLineH = 10;
  const footerLines = doc.splitTextToSize(footerText, usableW);
  const footerBlockH = footerLines.length * footerLineH + FOOTER_GAP_ABOVE_RULE + 6;

  const lastPage = doc.getNumberOfPages();
  doc.setPage(lastPage);
  let footerTop = pageH - margin - footerBlockH;

  if (footerTop < y + 14) {
    doc.addPage();
    drawRepeatHeader();
    y = CONTENT_TOP;
    footerTop = pageH - margin - footerBlockH;
  }

  doc.setDrawColor(220, 224, 232);
  doc.line(margin, footerTop - FOOTER_GAP_ABOVE_RULE, pageW - margin, footerTop - FOOTER_GAP_ABOVE_RULE);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(95, 100, 110);
  doc.text(footerLines, margin, footerTop + footerLineH - 2);
  doc.setTextColor(0, 0, 0);

  doc.save(`${input.filename}-${toDateStamp()}.pdf`);
}
