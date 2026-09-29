// Shape of a converted ClaimFormFiller schema (see scripts/convert-claim-forms.mjs and
// the original SCHEMA.md in the ClaimFormFiller project for the field-coordinate contract).

export type ClaimFieldType = "text" | "checkbox" | "choice" | "note" | "signature";

export interface ClaimFieldOption {
  value: string;
  label: string;
  afLabel?: string;
  x?: number;
  y?: number;
  acroValue?: string;
}

export interface ClaimField {
  id: string;
  section: string;
  label: string;
  afLabel?: string;
  type: ClaimFieldType;
  required?: boolean;
  page?: number;
  // text
  x0?: number;
  x1?: number;
  rows?: number[];
  multiline?: boolean;
  startSize?: number;
  floorSize?: number;
  placeholder?: string;
  maxLength?: number;
  inputMode?: string;
  pattern?: string;
  align?: string;
  lineGap?: number;
  acroField?: string;
  // checkbox
  x?: number;
  y?: number;
  markSize?: number;
  // choice
  options?: ClaimFieldOption[];
  multi?: boolean;
  // signature
  bottom?: number;
  height?: number;
}

export interface ClaimFormSection {
  id: string;
  title: string;
  afTitle?: string;
}

export interface RepeatingSubField {
  key: string;
  label: string;
  afLabel?: string;
  type: ClaimFieldType;
  multiline?: boolean;
  options?: ClaimFieldOption[];
}

export interface RepeatingGroup {
  groupKey: string;
  section: string;
  itemLabel: string;
  subFields: RepeatingSubField[];
  fixedSlotCount: number;
  /** Original fields for each printed slot, in order — used to stamp the PDF (see fillPdf.ts). */
  fixedSlots: ClaimField[][];
}

export interface ClaimFormSchema {
  id: string;
  insurer: string;
  title: string;
  afTitle?: string;
  description?: string;
  filenameField?: string;
  defaultLineGap?: number;
  sections: ClaimFormSection[];
  fields: ClaimField[];
  repeatingGroups: RepeatingGroup[];
}
