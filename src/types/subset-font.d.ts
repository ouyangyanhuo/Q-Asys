declare module "subset-font" {
  interface SubsetFontOptions {
    targetFormat?: "woff2" | "woff" | "sfnt" | "truetype";
    preserveNameIds?: number[];
    variationAxes?: Record<string, unknown>;
  }

  /**
   * 用 harfbuzz 把字体裁到给定文字。
   * 输出是 Buffer；可变字体的轴默认保留。
   */
  export default function subsetFont(
    font: Buffer | Uint8Array | ArrayBuffer,
    text: string,
    options?: SubsetFontOptions,
  ): Promise<Buffer>;
}
