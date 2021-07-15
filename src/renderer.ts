import { AABB, Point, Segment, Stroke, StyledPoint, Vec2 } from './types';

export interface IRenderer {
  getHitCvsColor(position: Vec2): string;
  clearRect(rect: AABB): void;
  strokeStart(point: Point): void;
  strokeContinue(segment: Segment): void;
  strokeRender(stroke: Stroke): void;
}

export class Renderer implements IRenderer {
  constructor(
    private canvasCtx: CanvasRenderingContext2D,
    private hitCanvasCtx: CanvasRenderingContext2D,
  ) { }

  public getHitCvsColor({ x, y }: Vec2): string {
    const data = this.hitCanvasCtx.getImageData(x, y, 1, 1).data;
    return '#' + ('000000' + this.rgbToHex(data[0], data[1], data[2])).slice(-6);
  }

  private rgbToHex(r: number, g: number, b: number) {
    if (r > 255 || g > 255 || b > 255)
      throw 'Invalid color component';
    return ((r << 16) | (g << 8) | b).toString(16);
  }

  public clearRect(rect: AABB): void {
    this.canvasCtx.clearRect(rect.x, rect.y, rect.width, rect.height);
    this.hitCanvasCtx.clearRect(rect.x, rect.y, rect.width, rect.height);
  }

  public strokeStart(point: StyledPoint): void {
    // draw dot
    this.drawCircle(this.canvasCtx, point.color, point);
    this.drawCircle(this.hitCanvasCtx, point.hitColor,
      { ...point, radius: Math.max(2, point.radius) });
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
      point.radius,
      point.radius,
      0,
      0,
      Math.PI * 2,
    );
    ctx.closePath();
    ctx.fill();
  }

  public strokeContinue({ from, to, color, hitColor }: Segment): void {
    // continue from last point
    this.paintLine(
      this.canvasCtx,
      to.x,
      to.y,
      to.radius,
      from.x,
      from.y,
      from.radius,
      color,
    );
    this.paintLine(
      this.hitCanvasCtx,
      to.x,
      to.y,
      Math.max(to.radius, 2),
      from.x,
      from.y,
      Math.max(from.radius, 2),
      hitColor,
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

  public strokeRender({ x, y, radius: pressure, color, hitColor }: Stroke): void {
    // TODO: render whole Stroke
    console.log('render stroke!!');
    this.strokeStart({ x: x[0], y: y[0], radius: pressure[0], color, hitColor });
    for (let i = 0; i < x.length; i++) {
      this.strokeContinue({
        from: {
          x: x[i - 1],
          y: y[i - 1],
          radius: pressure[i - 1],
        },
        to: {
          x: x[i],
          y: y[i],
          radius: pressure[i],
        },
        color, hitColor
      });
    }
  }
}
