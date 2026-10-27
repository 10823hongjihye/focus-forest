import { BookOpen, Calculator, Landmark, Languages } from 'lucide-react';
import type { SubjectId } from '../types';

const ICONS = {
  math: Calculator,
  english: Languages,
  korean: BookOpen,
  history: Landmark,
} as const;

export function SubjectIcon({ id, size = 18 }: { id: SubjectId; size?: number }) {
  const Icon = ICONS[id];
  return <Icon size={size} strokeWidth={1.8} />;
}
