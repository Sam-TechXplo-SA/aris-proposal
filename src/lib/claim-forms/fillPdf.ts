// Client-side PDF stamping, ported from ClaimFormFiller's shared/fill-engine.js onto
// this app's data shapes (converted schema + repeating-group entries instead of raw
// form elements). Runs entirely in the browser against the vendored pdf-lib UMD build
// (public/vendor/pdf-lib.min.js, loaded via next/script) — no npm dependency, no server.
import type { ClaimField, ClaimFormSchema } from "@/data/claim-forms/types";

declare global {
  interface Window {
    PDFLib?: {
      PDFDocument: { load(bytes: ArrayBuffer): Promise<PdfLibDocument> };
      StandardFonts: { Helvetica: string };
      rgb(r: number, g: number, b: number): unknown;
    };
  }
}

interface PdfLibFont {
  widthOfTextAtSize(text: string, size: number): number;
}
interface PdfLibPage {
  getHeight(): number;
  drawText(text: string, opts: { x: number; y: number; size: number; font: PdfLibFont; color: unknown }): void;
}
interface PdfLibDocument {
  embedFont(font: string): Promise<PdfLibFont>;
  getPage(index: number): PdfLibPage;
  addPage(): PdfLibPage;
  save(): Promise<Uint8Array>;
}

export type GroupEntries = Record<string, Record<string, string>[]>;
export type FieldValues = Record<string, string | boolean | string[] | undefined>;

const DEFAULT_START_SIZE = 8.5;
const DEFAULT_FLOOR_SIZE = 5.5;
const LINE_GAP = 5.5;

function wrapToWidth(font: PdfLibFont, size: number, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function linesFitWidth(font: PdfLibFont, lines: string[], size: number, maxWidth: number): boolean {
  return lines.every((line) => font.widthOfTextAtSize(line, size) <= maxWidth);
}

function fitTextBlock(font: PdfLibFont, text: string, maxWidth: number, maxLines: number, startSize: number, floorSize: number) {
  const trimmed = (text || "").trim();
  if (!trimmed) return { size: startSize, lines: [] as string[] };
  for (let size = startSize; size >= floorSize; size -= 0.25) {
    const lines = wrapToWidth(font, size, trimmed, maxWidth);
    if (lines.length <= maxLines && linesFitWidth(font, lines, size, maxWidth)) return { size, lines };
  }
  const lines = wrapToWidth(font, floorSize, trimmed, maxWidth);
  if (lines.length > maxLines) {
    const head = lines.slice(0, maxLines - 1);
    const tail = lines.slice(maxLines - 1).join(" ");
    head.push(tail);
    return { size: floorSize, lines: head };
  }
  return { size: floorSize, lines };
}

function stampField(page: PdfLibPage, font: PdfLibFont, ink: unknown, schema: ClaimFormSchema, field: ClaimField, raw: string | boolean | string[] | undefined) {
  const pageHeight = page.getHeight();

  if (field.type === "checkbox") {
    if (!raw) return;
    const size = field.markSize || 9;
    page.drawText("X", { x: (field.x ?? 0) - size * 0.35, y: pageHeight - (field.y ?? 0) - size * 0.36, size, font, color: ink });
    return;
  }

  if (field.type === "choice") {
    const selected = Array.isArray(raw) ? raw : [raw].filter(Boolean) as string[];
    (field.options || []).forEach((opt) => {
      if (!selected.includes(opt.value)) return;
      const size = field.markSize || 9;
      page.drawText("X", { x: (opt.x ?? 0) - size * 0.35, y: pageHeight - (opt.y ?? 0) - size * 0.36, size, font, color: ink });
    });
    return;
  }

  if (field.type === "signature") {
    const name = typeof raw === "string" ? raw : "";
    if (!name.trim() || field.x0 == null || field.bottom == null) return;
    const size = Math.min((field.height ?? 16) * 0.7, 16);
    page.drawText(name, { x: field.x0, y: pageHeight - field.bottom, size, font, color: ink });
    return;
  }

  // default: 'text'
  if (!raw || field.x0 == null || field.x1 == null || !field.rows) return;
  const maxWidth = field.x1 - field.x0 - 2;
  const maxLines = field.rows.length;
  const { size, lines } = fitTextBlock(font, String(raw), maxWidth, maxLines, field.startSize || DEFAULT_START_SIZE, field.floorSize || DEFAULT_FLOOR_SIZE);
  const lineGap = field.lineGap ?? schema.defaultLineGap ?? LINE_GAP;
  lines.forEach((line, i) => {
    const rowBottomTopDown = field.rows![Math.min(i, field.rows!.length - 1)];
    const baselineTopDown = rowBottomTopDown - lineGap;
    const y = pageHeight - baselineTopDown;
    let x = field.x0!;
    if (field.align === "center") {
      const lineWidth = font.widthOfTextAtSize(line, size);
      x = field.x0! + Math.max(0, (field.x1! - field.x0! - lineWidth) / 2);
    }
    page.drawText(line, { x, y, size, font, color: ink });
  });
}

export async function buildFilledPdf(
  schema: ClaimFormSchema,
  slug: string,
  values: FieldValues,
  groupEntries: GroupEntries,
): Promise<Uint8Array> {
  const PDFLib = window.PDFLib;
  if (!PDFLib) throw new Error("pdf-lib failed to load");

  const templateUrl = `/claim-forms/${slug}/template.pdf`;
  const templateBytes = await fetch(templateUrl).then((r) => {
    if (!r.ok) throw new Error(`Could not load ${templateUrl} (${r.status})`);
    return r.arrayBuffer();
  });

  const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
  const ink = PDFLib.rgb(0.05, 0.09, 0.35);

  const pageCache = new Map<number, PdfLibPage>();
  const pageFor = (index?: number) => {
    const i = index || 0;
    if (!pageCache.has(i)) pageCache.set(i, pdfDoc.getPage(i));
    return pageCache.get(i)!;
  };

  for (const field of schema.fields) {
    if (field.type === "note") continue;
    stampField(pageFor(field.page), font, ink, schema, field, values[field.id]);
  }

  const overflow: { itemLabel: string; index: number; entry: Record<string, string> }[] = [];

  for (const group of schema.repeatingGroups) {
    const entries = groupEntries[group.groupKey] || [];
    entries.forEach((entry, i) => {
      if (i < group.fixedSlotCount) {
        const slotFields = group.fixedSlots[i];
        for (const subField of group.subFields) {
          const originalField = slotFields.find((f) => f.id.endsWith(subField.key) || f.label === subField.label);
          if (originalField) stampField(pageFor(originalField.page), font, ink, schema, originalField, entry[subField.key]);
        }
      } else {
        overflow.push({ itemLabel: group.itemLabel, index: i + 1, entry });
      }
    });
  }

  if (overflow.length > 0) {
    const page = pdfDoc.addPage();
    const height = page.getHeight();
    let y = height - 50;
    page.drawText(`${schema.title} — Additional Entries`, { x: 50, y, size: 13, font, color: ink });
    y -= 24;
    for (const item of overflow) {
      const summary = Object.entries(item.entry)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join("   ");
      page.drawText(`${item.itemLabel} ${item.index} — ${summary}`, { x: 50, y, size: 9, font, color: ink });
      y -= 16;
    }
  }

  return pdfDoc.save();
}

export function sanitizeFilenamePart(s: string): string {
  return (s || "").trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "form";
}

export function triggerDownload(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
