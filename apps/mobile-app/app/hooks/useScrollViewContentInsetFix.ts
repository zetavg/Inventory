import { useEffect } from 'react';

function useScrollViewContentInsetFix(
  scrollViewRef: React.MutableRefObject<{
    scrollTo: (o: { x?: number; y?: number; animated?: boolean }) => void;
  } | null>,
) {
  useEffect(() => {
    if (scrollViewRef.current)
      scrollViewRef.current.scrollTo({ x: -80, y: -80, animated: false });
  }, [scrollViewRef]);
}

export default useScrollViewContentInsetFix;
