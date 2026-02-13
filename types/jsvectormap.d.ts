declare module 'jsvectormap' {
  interface JsVectorMapOptions {
    selector: string;
    map: string;
    backgroundColor?: string;
    regionStyle?: Record<string, Record<string, unknown>>;
    markerStyle?: Record<string, Record<string, unknown>>;
    markers?: Array<{ name: string; coords: [number, number] }>;
    zoomOnScroll?: boolean;
    zoomButtons?: boolean;
    onMarkerTooltipShow?: (event: unknown, tooltip: { text: (t: string) => void }, index: number) => void;
    onRegionTooltipShow?: (event: unknown, tooltip: { text: (t: string) => void }, code: string) => void;
    onLoaded?: () => void;
  }

  interface JsVectorMapInstance {
    destroy: (destroyInstance?: boolean) => void;
  }

  function jsVectorMap(options: JsVectorMapOptions): JsVectorMapInstance;

  namespace jsVectorMap {
    function addMap(name: string, map: unknown): void;
  }

  export default jsVectorMap;
}

declare module 'jsvectormap/dist/maps/world.js';
