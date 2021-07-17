export type Vec2 = { x: number, y: number };

/**
 * The smallest unit of a {@link Stroke} with x, y coordinates and * a pressure 
 * value
 */
export interface Point extends Vec2 {
  radius: number;
}

/**
 * Describes the stroke color and the stroke hitColor, which is the color used 
 * for hit testing when erasing strokes
 */
export interface StrokeStyle {
  color: string;
  hitColor: string;
}

/**
 * Segment from one {@link Point} to another. It also includes the stroke style
 */
export interface Segment extends StrokeStyle {
  from: Point;
  to: Point;
}

/**
 * {@link Point} with additional {@link StrokeStyle} properties 
 */
export interface StyledPoint extends Point, StrokeStyle { }

/**
 * Axis-Aligned Bounding Box
 */
export class AABB {
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  /**
   * @param topLeft - coordinates of the top left point of the bounding box
   * @param bottomRight - coordinates of the bottom right point of the bounding box
   */
  constructor(
    topLeft: Vec2,
    bottomRight: Vec2,
  ) {
    this.x = topLeft.x;
    this.y = topLeft.y;
    this.width = bottomRight.x - topLeft.x;
    this.height = bottomRight.y - topLeft.y;
  }

  /** 
   * @returns true if the bounding box overlap with another {@link AABB} 
   */
  public overlap(other: AABB): boolean {
    return (
      this.x <= other.x + other.width &&
      this.y <= other.y + other.height &&
      this.x + this.width >= other.x &&
      this.y + this.height >= other.y
    );
  }

  /**
   * @param other - another {@link AABB}
   * @returns a new AABB that is the union of the two
   */
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

  /**
   * @param px - the number of pixels to expand the size of the box (negative 
   * to shrink box)
   */
  public expand(px: number): void {
    this.x -= px;
    this.y -= px;
    this.width += 2 * px;
    this.height += 2 * px;
  }
}

/** Describes a stroke */
export interface Stroke extends StrokeStyle {
  // Note: x, y, and radius data are stored as arrays of numbers instead of 
  // array of objects for performance 
  x: number[];
  y: number[];
  radius: number[];
  aabb: AABB | null;
}