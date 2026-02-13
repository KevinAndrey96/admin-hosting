'use client';

import { useEffect } from 'react';

export default function MasonryInit() {
  useEffect(() => {
    import('masonry-layout').then(({ default: Masonry }) => {
      const el = document.querySelector('.masonry');
      if (el) {
        new Masonry(el, {
          itemSelector: '.masonry-item',
          columnWidth: '.masonry-sizer',
          percentPosition: true,
        });
      }
    });
  }, []);

  return null;
}
