import { useCallback } from 'react';

export default function useNumberInputChangeHandler(
  setState: (s: number | null) => void,
): (s: string) => void {
  return useCallback(
    (text: string) => {
      const number = parseInt(text, 10);
      setState(Number.isNaN(number) ? null : number);
    },
    [setState],
  );
}
