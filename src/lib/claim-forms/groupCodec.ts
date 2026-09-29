// Encodes/decodes repeating-group entries into the flat string map the mock store
// persists on Claim.claimFormValues, using a `__group__<groupKey>__<index>__<subKey>`
// key convention — keeps the store's data shape unchanged while round-tripping an
// arbitrary number of "add another" entries (FR-17).
export type GroupEntries = Record<string, Record<string, string>[]>;
export type FieldValueMap = Record<string, string | boolean | string[]>;

const GROUP_KEY_RE = /^__group__(.+?)__(\d+)__(.+)$/;

export function decodeSavedValues(saved: Record<string, string> | undefined): { values: Record<string, string>; groupEntries: GroupEntries } {
  const values: Record<string, string> = {};
  const groupEntries: GroupEntries = {};

  for (const [key, value] of Object.entries(saved ?? {})) {
    const match = GROUP_KEY_RE.exec(key);
    if (match) {
      const [, groupKey, indexStr, subKey] = match;
      const index = Number(indexStr);
      groupEntries[groupKey] = groupEntries[groupKey] || [];
      groupEntries[groupKey][index] = groupEntries[groupKey][index] || {};
      groupEntries[groupKey][index][subKey] = value;
    } else {
      values[key] = value;
    }
  }

  for (const key of Object.keys(groupEntries)) {
    groupEntries[key] = groupEntries[key].filter(Boolean);
  }
  return { values, groupEntries };
}

export function encodeForSave(values: FieldValueMap, groupEntries: GroupEntries): Record<string, string> {
  const out: Record<string, string> = {};

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = Array.isArray(value) ? value.join(", ") : String(value);
  }

  for (const [groupKey, entries] of Object.entries(groupEntries)) {
    entries.forEach((entry, index) => {
      for (const [subKey, value] of Object.entries(entry)) {
        if (!value) continue;
        out[`__group__${groupKey}__${index}__${subKey}`] = value;
      }
    });
  }

  return out;
}
