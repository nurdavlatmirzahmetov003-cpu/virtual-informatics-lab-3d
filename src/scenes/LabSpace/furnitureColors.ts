import { useTheme } from '@/hooks/useTheme';

/** Furniture colours for the light / dark theme. */
export function useFurnitureColors() {
  const light = useTheme() === 'light';
  return {
    top: light ? '#eef1f6' : '#20242e',
    frame: light ? '#9aa3b2' : '#3a3f4b',
    body: light ? '#f7f8fb' : '#171a22',
    shelf: light ? '#dfe4ec' : '#262b36',
  };
}
