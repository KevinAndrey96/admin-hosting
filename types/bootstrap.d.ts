declare module 'bootstrap' {
  export class Tooltip {
    constructor(element: Element, options?: object);
    dispose(): void;
  }

  export class Popover {
    constructor(element: Element, options?: object);
    dispose(): void;
  }
}
