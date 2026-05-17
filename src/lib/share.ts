import { type Pilot, PilotSchema, type Mecha, MechaSchema } from '~/types';

// ── Export ─────────────────────────────────────────────────────────────────────

export const downloadJSON = (data: unknown, filename: string): void => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const copyJSONToClipboard = async (data: unknown): Promise<void> => {
  await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
};

// ── Import ─────────────────────────────────────────────────────────────────────

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

export const parsePilotJSON = (text: string): ParseResult<Pilot> => {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Invalid JSON — could not parse the text.' };
  }
  const result = PilotSchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, error: 'Not a valid pilot build — the data does not match the expected format.' };
  }
  return { ok: true, data: result.data };
};

export const parseMechaJSON = (text: string): ParseResult<Mecha> => {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Invalid JSON — could not parse the text.' };
  }
  const result = MechaSchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, error: 'Not a valid mecha build — the data does not match the expected format.' };
  }
  return { ok: true, data: result.data };
};

// ── Utilities ──────────────────────────────────────────────────────────────────

export const slugify = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'export';
