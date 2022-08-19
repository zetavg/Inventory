import { useEffect } from 'react';

function useScrollViewContentInsetFix(
  scrollviewRef: React.MutableRefObject<{
    scrollTo: (o: { x?: number; y?: number; animated?: boolean }) => void;
  } | null>,
) {
  useEffect(() => {
    if (scrollviewRef.current)
      scrollviewRef.current.scrollTo({ x: -80, y: -80, animated: false });
  }, [scrollviewRef]);
}

export default useScrollViewContentInsetFix;
