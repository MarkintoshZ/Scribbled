interface ICanvas {
  width?: number;
  height?: number;
  pixelRatio?: number;
}

export class Canvas {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D
  private pixelRatio: number;
  private width: number;
  private height: number;

  constructor(config: ICanvas) {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    // set inline styles
    this.canvas.style.padding = '0';
    this.canvas.style.margin = '0';
    this.canvas.style.background = 'transparent';

    // Set css size
    this.canvas.style.width = config.width + 'px';
    this.canvas.style.height = config.height + 'px';

    // Set canvas size
    const scale = window.devicePixelRatio;
    this.canvas.width = Math.floor(config.width * scale);
    this.canvas.height = Math.floor(config.height * scale);

    // Normalize coordinate system to use css pixels.
    this.context.scale(scale, scale);

    this.pixelRatio = window.devicePixelRatio;
    this.width = config.width;
    this.height = config.height;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2D {
    return this.context;
  }

  getPixelRatio(): number {
    return this.pixelRatio;
  }

  setWidth(width: number): void {
    // take into account pixel ratio
    this.width = this.canvas.width = width * this.pixelRatio;
    this.canvas.style.width = width + 'px';

    const pixelRatio = this.pixelRatio,
      _context = this.getContext();
    _context.scale(pixelRatio, pixelRatio);
  }

  setHeight(height: number): void {
    // take into account pixel ratio
    this.height = this.canvas.height = height * this.pixelRatio;
    this.canvas.style.height = height + 'px';
    const pixelRatio = this.pixelRatio,
      _context = this.getContext();
    _context.scale(pixelRatio, pixelRatio);
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  setSize(width: number, height: number): void {
    this.setWidth(width || 0);
    this.setHeight(height || 0);
  }

  toDataURL(mimeType: string, quality?: unknown): string {
    try {
      // If this call fails (due to browser bug, like in Firefox 3.6),
      // then revert to previous no-parameter image/png behavior
      return this.canvas.toDataURL(mimeType, quality);
    } catch (e) {
      try {
        return this.canvas.toDataURL();
      } catch (err) {
        return '';
      }
    }
  }

  public attachDom(container: HTMLElement): void {
    container.appendChild(this.getCanvas());
  }
}
