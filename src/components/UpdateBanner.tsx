import { useEffect, useRef, useState } from 'react';

export function UpdateBanner() {
  const [ready, setReady] = useState(false);
  const dismissed = useRef(false);

  useEffect(() => {
    if (import.meta.env.DEV) return;
    let stop = false;

    const check = async () => {
      if (dismissed.current || stop) return;
      try {
        const url = new URL('version.json', new URL(import.meta.env.BASE_URL, window.location.href));
        url.searchParams.set('t', String(Date.now()));
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) return;
        const body = (await response.json()) as { id?: string };
        if (!stop && body.id && body.id !== __APP_BUILD_ID__) setReady(true);
      } catch {
        // 오프라인이거나 아직 배포 파일이 없으면 그대로 둡니다.
      }
    };

    void check();
    const timer = window.setInterval(() => void check(), 5 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stop = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (!ready) return null;

  return (
    <div className="update-banner" role="status">
      <p>새로운 버전이 준비되었어요. 업데이트할까요?</p>
      <div className="update-actions">
        <button
          type="button"
          onClick={() => {
            dismissed.current = true;
            setReady(false);
          }}
        >
          나중에
        </button>
        <button type="button" className="is-on" onClick={() => window.location.reload()}>
          업데이트
        </button>
      </div>
    </div>
  );
}
