declare module 'dom-to-image-more' {
  interface Options {
    width?: number;
    height?: number;
    style?: Record<string, string>;
    quality?: number;
    bgcolor?: string;
    cacheBust?: boolean;
    imagePlaceholder?: string;
    filter?: (node: Node) => boolean;
  }

  function toPng(node: Node, options?: Options): Promise<string>;
  function toJpeg(node: Node, options?: Options): Promise<string>;
  function toBlob(node: Node, options?: Options): Promise<Blob>;
  function toSvg(node: Node, options?: Options): Promise<string>;
  function toPixelData(
    node: Node,
    options?: Options
  ): Promise<Uint8ClampedArray>;
  function toCanvas(node: Node, options?: Options): Promise<HTMLCanvasElement>;

  export default {
    toPng,
    toJpeg,
    toBlob,
    toSvg,
    toPixelData,
    toCanvas,
  };
}
