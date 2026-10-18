import { useTheme } from '@/hooks/useTheme';

/** Furniture colours for the light / dark theme. */
export function useFurnitureColors() {
  const light = useTheme() === 'light';
  return {
    top: light ? '#eef1f6' : '#2c3354',
    frame: light ? '#9aa3b2' : '#4a5272',
    body: light ? '#f7f8fb' : '#252c4a',
    shelf: light ? '#dfe4ec' : '#323a5e',
  };
}
