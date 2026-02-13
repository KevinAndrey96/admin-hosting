declare module 'masonry-layout' {
  interface MasonryOptions {
    itemSelector?: string;
    columnWidth?: string | number | Element;
    percentPosition?: boolean;
  }

  class Masonry {
    constructor(element: Element, options?: MasonryOptions);
  }

  export default Masonry;
}
