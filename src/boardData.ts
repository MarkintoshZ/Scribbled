import { AABB, Point, Stroke } from './types';

export interface IBoardData {
  add(stroke: Stroke): void;
  delete(color: string): void;
  set(stroke: Stroke): void;
  checkOverlap(aabb: AABB): boolean;
  getOverlap(aabb: AABB): Stroke[];
  genHitColor(): string;
}

/** 
 * Stores all Strokes
 * - Implementation of IBoardData with HashMap 
 */
export class BoardData implements IBoardData {
  private strokes: Map<string, Stroke> = new Map();

  add(stroke: Stroke): void {
    if (this.strokes.has(stroke.hitColor))
      throw new Error(`Stroke with hitColor ${stroke.hitColor} already exists`);
    this.set(stroke);
  }

  delete(hitColor: string): void {
    this.strokes.delete(hitColor);
  }

  set(stroke: Stroke): void {
    this.strokes.set(stroke.hitColor, stroke);
  }

  checkOverlap(aabb: AABB): boolean {
    for (const stroke of this.strokes.values()) {
      if (stroke.aabb.overlap(aabb)) return true;
    }
  }

  getOverlap(aabb: AABB): Stroke[] {
    // ! need testing
    return [...this.strokes.values()]
      .filter((stroke) => stroke.aabb.overlap(aabb));
  }

  /** generate random color that other strokes are not using for hitCanvas */
  genHitColor(): string {
    let randomColor;
    do {
      randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
    } while (this.strokes.has(randomColor));
    return randomColor;
  }
}

export class StrokeBuilder {
  private stroke: Stroke;

  public strokeContinue(x: number, y: number, pressure: number): Point {
    if (!this.stroke) return;
    this.stroke.x.push(x);
    this.stroke.y.push(y);
    this.stroke.pressure.push(pressure);

    const l = this.stroke.x.length;
    return {
      x: this.stroke.x[l - 2],
      y: this.stroke.y[l - 2],
      pressure: this.stroke.pressure[l - 2],
      color: this.stroke.color,
      hitColor: this.stroke.hitColor,
    };
  }

  public strokeStart({ x, y, pressure, color, hitColor }: Point): void {
    this.stroke = {
      x: [x],
      y: [y],
      pressure: [pressure],
      color: color,
      hitColor: hitColor,
      aabb: null
    };
  }

  public strokeComplete(): Stroke {
    if (!this.stroke)
      throw new Error('Cannot complete stroke before stroke start is called');
    // TODO: calculate AABB
    const stroke = this.stroke;
    this.stroke = null;
    return stroke;
  }
}
