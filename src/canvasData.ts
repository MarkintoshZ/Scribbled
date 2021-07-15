import { AABB, Point, Stroke, StrokeStyle, StyledPoint } from './types';

export interface ICanvasData {
  add(stroke: Stroke): void;
  delete(color: string): void;
  set(stroke: Stroke): void;
  get(color: string): Stroke;
  checkOverlap(aabb: AABB): boolean;
  getOverlap(aabb: AABB): Stroke[];
  genHitColor(): string;
}

/** 
 * Stores all Strokes
 * - Implementation of IBoardData with HashMap 
 */
export class CanvasData implements ICanvasData {
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

  get(color: string): Stroke {
    return this.strokes.get(color);
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
      randomColor = '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
    } while (this.strokes.has(randomColor));
    return randomColor;
  }
}

export class StrokeBuilder {
  private stroke: Stroke;

  public strokeContinue({ x, y, radius: pressure }: Point): [Point, StrokeStyle] {
    if (!this.stroke) return;
    this.stroke.x.push(x);
    this.stroke.y.push(y);
    this.stroke.radius.push(pressure);

    const l = this.stroke.x.length;
    return [{
      x: this.stroke.x[l - 2],
      y: this.stroke.y[l - 2],
      radius: this.stroke.radius[l - 2],
    }, {
      color: this.stroke.color,
      hitColor: this.stroke.hitColor,
    }];
  }

  public strokeStart({ x, y, radius: pressure, color, hitColor }: StyledPoint): void {
    this.stroke = {
      x: [x],
      y: [y],
      radius: [pressure],
      color: color,
      hitColor: hitColor,
      aabb: null
    };
  }

  public strokeComplete(): Stroke {
    if (this.stroke === null)
      throw new Error('Cannot complete stroke before stroke start is called');
    // TODO: calculate AABB
    // calculate max and min x
    this.stroke.aabb = new AABB(
      { x: Math.min(...this.stroke.x), y: Math.min(...this.stroke.y) },
      { x: Math.max(...this.stroke.x), y: Math.max(...this.stroke.y) },
    );
    // expand AABB to compensate for the stroke width
    const maxPressure = Math.max(...this.stroke.radius);
    this.stroke.aabb.expand(maxPressure + 3);
    const stroke = this.stroke;
    this.stroke = null;
    return stroke;
  }
}
