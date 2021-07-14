export type Vec2 = { x: number, y: number };

export interface Point extends Vec2 {
  pressure: number;
  color: string;
  hitColor: string;
}

export class AABB {
  constructor(
    private topLeft: Vec2,
    private bottomRight: Vec2,
  ) { }

  /** Check 2D collision with another AABB */
  public overlap(other: AABB): boolean {
    return (
      this.topLeft.x <= other.bottomRight.x &&
      this.bottomRight.x >= other.topLeft.x &&
      this.topLeft.y <= other.bottomRight.y &&
      this.bottomRight.y >= other.topLeft.y
    );
  }

  public get width(): number { return this.bottomRight.x - this.topLeft.x; }

  public get height(): number { return this.topLeft.y - this.bottomRight.y; }
}

export interface Stroke {
  x: number[];
  y: number[];
  pressure: number[];
  color: string;
  hitColor: string;
  aabb: AABB | null;
}