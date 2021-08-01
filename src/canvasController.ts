import { ICanvasData, StrokeBuilder } from './canvasData';
import { IRenderer } from './renderer';
import { Tool, ToolBox, ToolType } from './tools';
import { Point, StyledPoint } from './types';

/**
 * Handles canvas events like drawing and erasing
 */
export class CanvasController {
  // states
  private strokeConstructor: StrokeBuilder;
  // To prevent switching tool in the middle of a stroke
  private currentTool: Tool | null = null;

  /**
   * @param canvas - canvas that is visible to the end user
   * @param renderer - renderer that handles draw and clear calls
   * @param boardData - container that stores all the strokes data
   * @param toolBox - specifics tools to use
   */
  constructor(
    private canvas: HTMLCanvasElement,
    private renderer: IRenderer,
    private boardData: ICanvasData,
    private toolBox: ToolBox,
  ) {
    this.strokeConstructor = new StrokeBuilder();
    // add event listeners
    this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.addEventListener('pointerup', this.handlePointerUpAndLeave.bind(this));
    this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.canvas.addEventListener('pointerleave', this.handlePointerUpAndLeave.bind(this));
  }

  public dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.removeEventListener('pointerup', this.handlePointerUpAndLeave.bind(this));
    this.canvas.removeEventListener('pointermove', this.handlePointerMove.bind(this));
    this.canvas.removeEventListener('pointerleave', this.handlePointerUpAndLeave.bind(this));
  }

  private handlePointerDown(e: PointerEvent) {
    this.currentTool = { ...this.toolBox.selectedTool };

    if (this.currentTool.type === ToolType.Eraser)
      return this.erase(this.createPoint(e));

    const point = this.createStyledPoint(e);
    this.strokeConstructor.strokeStart(point);
    this.renderer.strokeStart(point);
  }

  private handlePointerMove(e: PointerEvent) {
    // console.log({ x: e.offsetX, y: e.offsetY });
    if (this.currentTool === null) return;
    const point = this.createPoint(e);

    if (this.currentTool.type === ToolType.Eraser)
      return this.erase(point);

    const [lastPoint, { color, hitColor }] = this.strokeConstructor.strokeContinue(point);
    this.renderer.strokeContinue({ from: lastPoint, to: point, color, hitColor });
  }

  private handlePointerUpAndLeave(e: PointerEvent) {
    if (this.currentTool === null) return;
    if (this.currentTool.type !== ToolType.Eraser) {
      this.handlePointerMove(e);
      this.boardData.add(this.strokeConstructor.strokeComplete());
    }
    this.currentTool = null;
  }

  private erase(point: Point): void {
    const color = this.renderer.getHitCvsColor(point);
    if (!this.boardData.get(color)) return;
    const strokeToErase = this.boardData.get(color);
    if (!strokeToErase?.aabb)
      throw new Error('Cannot find stroke to erase or its bounding box is null');
    const aabb = strokeToErase.aabb;
    this.renderer.clearRect(aabb);
    this.boardData.delete(color);
    const strokesNeedRepainting = this.boardData.getOverlap(aabb);
    strokesNeedRepainting.forEach(s => this.renderer.strokeRender(s));
  }

  private createPoint(e: PointerEvent): Point {
    return {
      x: e.offsetX,
      y: e.offsetY,
      radius: this.calculatePressure(e.pressure),
    };
  }

  private createStyledPoint(e: PointerEvent): StyledPoint {
    if (!this.currentTool?.color)
      throw new Error('current tool does not have a color property');
    return {
      ...this.createPoint(e),
      color: this.currentTool.color,
      hitColor: this.boardData.genHitColor(),
    };
  }

  private calculatePressure(rawPressure: number): number {
    return rawPressure * (this.currentTool?.pressureSensitivity ?? 1)
      + (this.currentTool?.size ?? 1);
  }
}