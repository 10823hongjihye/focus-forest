import type { ReactNode } from 'react';
import { cx } from '../lib/cx';

/** 나중에 직접 만든 이미지로 바꿀 자리. `data-slot` 이름이 교체 위치입니다. */
export function ArtSlot({ name, children, className }: { name: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cx('art-slot', className)} data-slot={name}>
      {children}
    </div>
  );
}
