interface ICanvas {
  width?: number;
  height?: number;
  pixelRatio?: number;
  antialiased?: boolean;
}

export class Canvas {
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D
  private _pixelRatio: number;
  private _width: number;
  private _height: number;

  constructor(config: ICanvas) {
    this._canvas = document.createElement('canvas');
    this._context = this._canvas.getContext('2d');

    // set inline styles
    this._canvas.style.padding = '0';
    this._canvas.style.margin = '0';
    this._canvas.style.background = 'transparent';

    // Set css size
    this._canvas.style.width = config.width + 'px';
    this._canvas.style.height = config.height + 'px';

    // Set canvas size
    const scale = window.devicePixelRatio;
    this._canvas.width = Math.floor(config.width * scale);
    this._canvas.height = Math.floor(config.height * scale);

    // Normalize coordinate system to use css pixels.
    this._context.scale(scale, scale);

    // set antialiased for hit canvas
    this.canvasCtx['imageSmoothingEnabled'] = config.antialiased;

    this._pixelRatio = window.devicePixelRatio;
    this._width = config.width;
    this._height = config.height;
  }

  getCanvas(): HTMLCanvasElement {
    return this._canvas;
  }

  get canvasCtx(): CanvasRenderingContext2D {
    return this._context;
  }

  getPixelRatio(): number {
    return this._pixelRatio;
  }

  get width(): number {
    return this._width;
  }

  set width(width: number) {
    // take into account pixel ratio
    this._width = this._canvas.width = width * this._pixelRatio;
    this._canvas.style.width = width + 'px';

    const pixelRatio = this._pixelRatio,
      _context = this.canvasCtx;
    _context.scale(pixelRatio, pixelRatio);
  }

  get height(): number {
    return this._height;
  }

  set height(height: number) {
    // take into account pixel ratio
    this._height = this._canvas.height = height * this._pixelRatio;
    this._canvas.style.height = height + 'px';
    const pixelRatio = this._pixelRatio,
      _context = this.canvasCtx;
    _context.scale(pixelRatio, pixelRatio);
  }

  setSize(width?: number, height?: number): void {
    this.width = width || this.width;
    this.height = height || this.height;
  }

  toDataURL(mimeType: string, quality?: unknown): string {
    try {
      // If this call fails (due to browser bug, like in Firefox 3.6),
      // then revert to previous no-parameter image/png behavior
      return this._canvas.toDataURL(mimeType, quality);
    } catch (e) {
      try {
        return this._canvas.toDataURL();
      } catch (err) {
        return '';
      }
    }
  }

  public attachDom(container: HTMLElement): void {
    container.appendChild(this.getCanvas());
  }
}
