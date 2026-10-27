const APPROVAL_URL = 'https://kvdb.io/3PdMq1neM5qdFebXyxrczu/approved';

export type ApprovalWrite = {
  ok: boolean;
  needsVerify: boolean;
};

function readIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === 'string' && id.startsWith('acct-'));
}

export async function loadApprovedIds(): Promise<string[] | null> {
  try {
    const response = await fetch(APPROVAL_URL, { cache: 'no-store' });
    if (response.status === 404) return [];
    if (!response.ok) return null;
    const parsed: unknown = JSON.parse(await response.text());
    return readIds(parsed);
  } catch {
    return null;
  }
}

async function saveApprovedIds(ids: string[]): Promise<ApprovalWrite> {
  try {
    const response = await fetch(APPROVAL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(ids),
    });
    if (response.ok) return { ok: true, needsVerify: false };
    const text = await response.text();
    return { ok: false, needsVerify: /not verified/i.test(text) };
  } catch {
    return { ok: false, needsVerify: false };
  }
}

export async function publishApprovedId(id: string): Promise<ApprovalWrite> {
  const current = await loadApprovedIds();
  if (!current) return { ok: false, needsVerify: false };
  if (current.includes(id)) return { ok: true, needsVerify: false };
  const saved = await saveApprovedIds([...current, id]);
  if (!saved.ok) return saved;
  const check = await loadApprovedIds();
  return { ok: Boolean(check?.includes(id)), needsVerify: false };
}

export async function publishApprovedIds(ids: string[]): Promise<ApprovalWrite> {
  const current = await loadApprovedIds();
  if (!current) return { ok: false, needsVerify: false };
  const merged = [...new Set([...current, ...ids])];
  if (merged.length === current.length) return { ok: true, needsVerify: false };
  return saveApprovedIds(merged);
}
