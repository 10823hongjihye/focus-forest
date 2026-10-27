import { createContext, useContext } from 'react';

export const ShellContext = createContext<HTMLElement | null>(null);

export function useShellEl(): HTMLElement | null {
  return useContext(ShellContext);
}
