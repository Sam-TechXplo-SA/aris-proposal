#!/usr/bin/env node
// One-off conversion script — NOT part of the app build. Reads each insurer claim
// form's schema.js from the ClaimFormFiller reference project (window.FORM_SCHEMA)
// and:
//   1. writes src/data/claim-forms/<slug>.json (sections/fields, plus inferred
//      repeatingGroups derived from numbered field ids like passenger1Name/passenger2Name)
//   2. writes src/data/claim-forms/index.ts (the registry, mirroring forms/registry.js)
//   3. copies each template.pdf to public/claim-forms/<slug>/template.pdf
//   4. copies shared/vendor/pdf-lib.min.js to public/vendor/pdf-lib.min.js
//
// Run with: node scripts/convert-claim-forms.mjs

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SOURCE_ROOT = path.resolve(REPO_ROOT, "../../Documents/Business/Side-Projects/ClaimFormFiller");
const FORMS_DIR = path.join(SOURCE_ROOT, "forms");
const OUT_DATA_DIR = path.join(REPO_ROOT, "src/data/claim-forms");
const OUT_PUBLIC_DIR = path.join(REPO_ROOT, "public/claim-forms");
const OUT_VENDOR_DIR = path.join(REPO_ROOT, "public/vendor");

function loadSchema(schemaPath) {
  const code = readFileSync(schemaPath, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: schemaPath });
  return sandbox.window.FORM_SCHEMA;
}

// "Passenger 1 — Name" -> "Name" (falls back to the full label when there's no em-dash).
function splitRepeatingLabel(label) {
  const parts = label.split(/—|–/).map((s) => s?.trim());
  return parts.length > 1 ? parts.slice(1).join(" — ") : label;
}

// "propertyItem" -> "Property Item" — used for the group's itemLabel, since field-id
// prefixes are consistent identifiers while printed labels vary too much to rely on.
function humanizeCamelCase(id) {
  const spaced = id.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
  return spaced.trim();
}

// Detect numbered repeating fields (id like passenger1Name, otherVehicle2RegNo) — only
// when the digit is followed by a non-empty capitalised suffix (excludes coincidental
// numbering like postalAddressLine1/2, which has no suffix after the digit).
const REPEAT_RE = /^([a-zA-Z]+?)(\d+)([A-Z][a-zA-Z0-9]*)$/;

function extractRepeatingGroups(fields) {
  const groups = new Map(); // key: section::prefix -> { slots: Map<number, field[]> }

  for (const field of fields) {
    if (field.type === "note") continue; // static declaration text, never a repeating data item
    const m = REPEAT_RE.exec(field.id);
    if (!m) continue;
    const [, prefix, digits, suffix] = m;
    const key = `${field.section}::${prefix}`;
    if (!groups.has(key)) groups.set(key, { section: field.section, prefix, slots: new Map() });
    const group = groups.get(key);
    const slot = Number(digits);
    if (!group.slots.has(slot)) group.slots.set(slot, []);
    group.slots.get(slot).push({ ...field, __suffix: suffix });
  }

  const repeatingGroups = [];
  const usedFieldIds = new Set();

  for (const [, group] of groups) {
    const slotNumbers = [...group.slots.keys()].sort((a, b) => a - b);
    if (slotNumbers.length < 2) continue; // require at least 2 real slots to call it a "group"

    // Template sub-fields from the slot with the most fields (usually slot 1).
    const templateSlot = [...group.slots.values()].reduce((a, b) => (b.length > a.length ? b : a));
    const subFields = templateSlot.map((f) => ({
      key: f.__suffix,
      label: splitRepeatingLabel(f.label),
      afLabel: f.afLabel ? splitRepeatingLabel(f.afLabel) : undefined,
      type: f.type ?? "text",
      multiline: f.multiline,
      options: f.options,
    }));
    const itemLabel = humanizeCamelCase(group.prefix);

    // Fixed slots, in order, each an array of {suffix -> original field} for PDF stamping.
    const fixedSlots = slotNumbers.map((n) => group.slots.get(n));
    fixedSlots.flat().forEach((f) => usedFieldIds.add(f.id));

    repeatingGroups.push({
      groupKey: `${group.section}__${group.prefix}`,
      section: group.section,
      itemLabel,
      subFields,
      fixedSlotCount: fixedSlots.length,
      fixedSlots: fixedSlots.map((slot) =>
        slot.map((f) => {
          const { __suffix, ...rest } = f;
          return rest;
        }),
      ),
    });
  }

  const remainingFields = fields.filter((f) => !usedFieldIds.has(f.id));
  return { repeatingGroups, remainingFields };
}

function convertOne(slug) {
  const dir = path.join(FORMS_DIR, slug);
  const schemaPath = path.join(dir, "schema.js");
  const templatePath = path.join(dir, "template.pdf");
  if (!existsSync(schemaPath) || !existsSync(templatePath)) {
    console.warn(`skip ${slug}: missing schema.js or template.pdf`);
    return null;
  }

  const schema = loadSchema(schemaPath);
  const { repeatingGroups, remainingFields } = extractRepeatingGroups(schema.fields);

  const out = {
    id: schema.id,
    insurer: schema.insurer,
    title: schema.title,
    afTitle: schema.afTitle,
    description: schema.description,
    filenameField: schema.filenameField,
    defaultLineGap: schema.defaultLineGap,
    sections: schema.sections,
    fields: remainingFields,
    repeatingGroups,
  };

  mkdirSync(OUT_DATA_DIR, { recursive: true });
  writeFileSync(path.join(OUT_DATA_DIR, `${slug}.json`), JSON.stringify(out, null, 2) + "\n");

  const publicDir = path.join(OUT_PUBLIC_DIR, slug);
  mkdirSync(publicDir, { recursive: true });
  copyFileSync(templatePath, path.join(publicDir, "template.pdf"));

  return { slug, insurer: schema.insurer, title: schema.title, afTitle: schema.afTitle, description: schema.description };
}

function main() {
  if (!existsSync(FORMS_DIR)) {
    console.error(`ClaimFormFiller forms directory not found at ${FORMS_DIR}`);
    process.exit(1);
  }

  const slugs = readdirSync(FORMS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const registry = [];
  for (const slug of slugs) {
    const entry = convertOne(slug);
    if (entry) registry.push(entry);
  }

  const toCamel = (slug) => slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  const imports = registry.map((r) => `import ${toCamel(r.slug)} from "./${r.slug}.json";`).join("\n");
  const schemaEntries = registry.map((r) => `  "${r.slug}": ${toCamel(r.slug)} as unknown as ClaimFormSchema,`).join("\n");

  const indexTs = `// GENERATED by scripts/convert-claim-forms.mjs — do not hand-edit.
import type { ClaimFormSchema } from "./types";
${imports}

export interface ClaimFormRegistryEntry {
  slug: string;
  insurer: string;
  title: string;
  afTitle?: string;
  description?: string;
}

export const CLAIM_FORM_REGISTRY: ClaimFormRegistryEntry[] = ${JSON.stringify(registry, null, 2)};

export const CLAIM_FORM_SCHEMAS: Record<string, ClaimFormSchema> = {
${schemaEntries}
};
`;
  writeFileSync(path.join(OUT_DATA_DIR, "index.ts"), indexTs);

  mkdirSync(OUT_VENDOR_DIR, { recursive: true });
  const vendorSrc = path.join(SOURCE_ROOT, "shared/vendor/pdf-lib.min.js");
  if (existsSync(vendorSrc)) {
    copyFileSync(vendorSrc, path.join(OUT_VENDOR_DIR, "pdf-lib.min.js"));
  } else {
    console.warn(`pdf-lib.min.js not found at ${vendorSrc}`);
  }

  console.log(`Converted ${registry.length} forms.`);
}

main();
