export type Vec2 = { x: number, y: number };

export interface Point extends Vec2 {
  radius: number;
}

export interface StrokeStyle {
  color: string;
  hitColor: string;
}

export interface Segment extends StrokeStyle {
  from: Point;
  to: Point;
}

export interface StyledPoint extends Point, StrokeStyle { }

export class AABB {
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  constructor(
    topLeft: Vec2,
    bottomRight: Vec2,
  ) {
    this.x = topLeft.x;
    this.y = topLeft.y;
    this.width = bottomRight.x - topLeft.x;
    this.height = bottomRight.y - topLeft.y;
  }

  /** Check 2D collision with another AABB */
  public overlap(other: AABB): boolean {
    return (
      this.x <= other.x + other.width &&
      this.y <= other.y + other.height &&
      this.x + this.width >= other.x &&
      this.y + this.height >= other.y
    );
  }

  public union(other: AABB): AABB {
    return new AABB(
      {
        x: Math.min(this.x, other.x),
        y: Math.min(this.y, other.y)
      },
      {
        x: Math.max(this.x + this.width, other.x + this.width),
        y: Math.max(this.y + this.height, other.y + other.height)
      }
    );
  }

  public expand(px: number): void {
    this.x -= px;
    this.y -= px;
    this.width += 2 * px;
    this.height += 2 * px;
  }
}

export interface Stroke extends StrokeStyle {
  x: number[];
  y: number[];
  radius: number[];
  aabb: AABB | null;
}