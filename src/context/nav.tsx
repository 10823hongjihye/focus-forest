import { createContext, useContext } from 'react';
import type { PageId, StudyView } from '../types';

type NavValue = {
  page: PageId;
  study: StudyView;
  go: (page: PageId, study?: StudyView) => void;
};

export const NavContext = createContext<NavValue | null>(null);

export function useNav(): NavValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('탐색 정보가 없습니다.');
  return ctx;
}
