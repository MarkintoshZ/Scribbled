import { ICanvasData, StrokeBuilder } from './canvasData';
import { IRenderer } from './renderer';
import { Tool, ToolBox, ToolType } from './tools';
import { Point, StyledPoint } from './types';

export class CanvasController {
  // states
  private toolDown = false;
  private strokeConstructor: StrokeBuilder;
  // To prevent switching tool in the middle of a stroke
  private currentTool: Tool;

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
    this.toolDown = true;
    this.currentTool = this.toolBox.selectedTool;
    const point = this.createStyledPoint(e);

    if (this.currentTool.type === ToolType.Eraser)
      return this.erase(point);

    this.strokeConstructor.strokeStart(point);
    this.renderer.strokeStart(point);
  }

  private handlePointerMove(e: PointerEvent) {
    // console.log({ x: e.offsetX, y: e.offsetY });
    if (!this.toolDown) return;
    const point = this.createPoint(e);

    if (this.currentTool.type === ToolType.Eraser)
      return this.erase(point);

    const [lastPoint, { color, hitColor }] = this.strokeConstructor.strokeContinue(point);
    this.renderer.strokeContinue({ from: lastPoint, to: point, color, hitColor });
  }

  private handlePointerUpAndLeave(e: PointerEvent) {
    if (!this.toolDown) return;
    if (this.currentTool.type !== ToolType.Eraser) {
      this.handlePointerMove(e);
      this.boardData.add(this.strokeConstructor.strokeComplete());
    }
    this.toolDown = false;
    this.currentTool = null;
  }

  private erase(point: Point): void {
    const color = this.renderer.getHitCvsColor(point);
    if (!this.boardData.get(color)) return;
    const aabb = this.boardData.get(color).aabb;
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
    return {
      ...this.createPoint(e),
      color: this.currentTool.color,
      hitColor: this.boardData.genHitColor(),
    };
  }

  private calculatePressure(rawPressure: number): number {
    return rawPressure * this.currentTool.pressureSensitivity + this.currentTool.size;
  }
}