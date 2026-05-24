import { useEffect, useState } from 'react';

export type ViewportSize = 'mobile' | 'tablet' | 'desktop';

function getViewportSize(width: number): ViewportSize {
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function useViewport() {
  const [size, setSize] = useState<ViewportSize>(() =>
    typeof window !== 'undefined' ? getViewportSize(window.innerWidth) : 'desktop'
  );
  const [width, setWidth] = useState(
    () => (typeof window !== 'undefined' ? window.innerWidth : 1024)
  );

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setWidth(w);
      const next = getViewportSize(w);
      setSize(next);
      document.documentElement.dataset.viewport = next;
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return {
    size,
    width,
    isMobile: size === 'mobile',
    isTablet: size === 'tablet',
    isDesktop: size === 'desktop',
  };
}
