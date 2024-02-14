import { useEffect } from 'react';

function useScrollViewFirstInputAutoFocusFix(
  scrollViewRef: React.MutableRefObject<{
    scrollTo: (o: { x?: number; y?: number; animated?: boolean }) => void;
  } | null>,
) {
  useEffect(() => {
    if (!scrollViewRef.current) return;

    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: -80, animated: false });
      }, i * 2);
    }
    for (let i = 1; i < 120; i++) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: -80, animated: true });
      }, i * 10);
    }
  }, [scrollViewRef]);
}

export default useScrollViewFirstInputAutoFocusFix;
