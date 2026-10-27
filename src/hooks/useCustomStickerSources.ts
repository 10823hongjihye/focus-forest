import { useEffect, useState } from 'react';
import { isCustomStickerId, loadStickerBlob } from '../lib/customStickers';

export function useCustomStickerSources(ids: string[]): Record<string, string> {
  const key = [...new Set(ids.filter(isCustomStickerId))].sort().join('|');
  const [sources, setSources] = useState<Record<string, string>>({});

  useEffect(() => {
    const list = key ? key.split('|') : [];
    let cancelled = false;
    const urls: string[] = [];
    void (async () => {
      const next: Record<string, string> = {};
      for (const id of list) {
        const blob = await loadStickerBlob(id);
        if (cancelled) {
          urls.forEach((url) => URL.revokeObjectURL(url));
          return;
        }
        if (!blob) continue;
        const url = URL.createObjectURL(blob);
        urls.push(url);
        next[id] = url;
      }
      if (!cancelled) setSources(next);
    })();
    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
      setSources({});
    };
  }, [key]);

  return sources;
}
