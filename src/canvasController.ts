import { ICanvasData, StrokeBuilder } from './canvasData';
import { IRenderer } from './renderer';
import { Tool, ToolBox, ToolType } from './tools';
import { Point } from './types';

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
    if (this.currentTool.type === ToolType.Eraser)
      return this.erase(e.offsetX, e.offsetY);
    const point: Point = this.createPoint(e);
    this.strokeConstructor.strokeStart(point);
    this.renderer.strokeStart(point);
  }

  private handlePointerMove(e: PointerEvent) {
    if (!this.toolDown) return;
    if (this.currentTool.type === ToolType.Eraser)
      return this.erase(e.offsetX, e.offsetY);
    const lastPoint = this.strokeConstructor.strokeContinue(
      e.offsetX,
      e.offsetY,
      this.calculatePressure(e.pressure),
    );
    const point = this.createPoint(e, lastPoint.hitColor);
    this.renderer.strokeContinue(point, lastPoint);
  }

  private handlePointerUpAndLeave(e: PointerEvent) {
    if (!this.toolDown) return;
    this.handlePointerMove(e);
    this.toolDown = false;
    this.currentTool = null;
    this.boardData.add(this.strokeConstructor.strokeComplete());
  }

  private erase(x: number, y: number): void {

  }

  private createPoint(e: PointerEvent, hitColor?: string): Point {
    return {
      x: e.offsetX,
      y: e.offsetY,
      pressure: this.calculatePressure(e.pressure),
      color: this.currentTool.color,
      hitColor: hitColor || this.boardData.genHitColor(),
    };
  }

  private calculatePressure(rawPressure: number): number {
    return rawPressure * this.currentTool.pressureSensitivity + this.currentTool.size;
  }
}