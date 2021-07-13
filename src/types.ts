export type Vec2 = { x: number, y: number };

export interface Point extends Vec2 {
  pressure: number;
  color: string;
  hitColor: string;
}

export class AABB {
  private topLeft: Vec2;
  private bottomRight: Vec2;

  public overlap(other: AABB): boolean {
    return (
      this.topLeft.x > other.topLeft.x &&
      this.topLeft.y > other.topLeft.y &&
      this.bottomRight.x > other.bottomRight.x &&
      this.bottomRight.y > other.bottomRight.y
    );
  }
}

export interface Stroke {
  x: number[];
  y: number[];
  pressure: number[];
  color: string;
  hitColor: string;
  aabb: AABB | null;
}