import { Point, Stroke } from './types';

export interface IRenderer {
  strokeStart(point: Point): void;
  strokeContinue(point: Point, lastPoint: Point): void;
  strokeRender(stroke: Stroke): void;
}

export class Renderer implements IRenderer {
  constructor(
    private canvasCtx: CanvasRenderingContext2D,
    private hitCanvasCtx: CanvasRenderingContext2D,
  ) { }

  public strokeStart(point: Point): void {
    // draw dot
    this.drawCircle(this.canvasCtx, point.color, point);
    this.drawCircle(this.hitCanvasCtx, point.hitColor, point);
  }

  private drawCircle(
    ctx: CanvasRenderingContext2D,
    color: string,
    point: Point
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(
      point.x,
      point.y,
      point.pressure,
      point.pressure,
      0,
      0,
      Math.PI * 2,
    );
    ctx.closePath();
    ctx.fill();
  }

  public strokeContinue(point: Point, lastPoint: Point): void {
    // continue from last point
    this.paintLine(
      this.canvasCtx,
      point.x,
      point.y,
      point.pressure,
      lastPoint.x,
      lastPoint.y,
      lastPoint.pressure,
      point.color,
    );
    this.paintLine(
      this.hitCanvasCtx,
      point.x,
      point.y,
      point.pressure,
      lastPoint.x,
      lastPoint.y,
      lastPoint.pressure,
      point.hitColor,
    );
  }

  private paintLine(
    ctx: CanvasRenderingContext2D,
    tx: number,
    ty: number,
    tr: number,
    fx: number,
    fy: number,
    fr: number,
    color: string,
  ) {
    ctx.fillStyle = color;
    const angle = Math.atan((ty - fy) / (tx - fx));
    ctx.beginPath();
    ctx.moveTo(
      Math.cos(angle + Math.PI / 2) * fr + fx,
      Math.sin(angle + Math.PI / 2) * fr + fy,
    );
    ctx.lineTo(
      Math.cos(angle - Math.PI / 2) * fr + fx,
      Math.sin(angle - Math.PI / 2) * fr + fy,
    );

    ctx.lineTo(
      Math.cos(angle - Math.PI / 2) * tr + tx,
      Math.sin(angle - Math.PI / 2) * tr + ty,
    );
    ctx.lineTo(
      Math.cos(angle + Math.PI / 2) * tr + tx,
      Math.sin(angle + Math.PI / 2) * tr + ty,
    );

    ctx.closePath();
    ctx.fill();

    // circle at each point
    ctx.beginPath();
    ctx.arc(tx, ty, tr - 0.1, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
  }

  public strokeRender(stroke: Stroke): void {
    // TODO: render whole Stroke
  }
}
