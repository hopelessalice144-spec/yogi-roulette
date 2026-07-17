import { useEffect, useState } from 'react';

export const PORTRAIT_MOBILE_MQ = '(max-width: 900px) and (orientation: portrait)';

/** True when the viewport is a narrow portrait phone layout. */
export function usePortraitMobile() {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(PORTRAIT_MOBILE_MQ).matches
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia(PORTRAIT_MOBILE_MQ);
    const onChange = (event) => setMatches(event.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return matches;
}
