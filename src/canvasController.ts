import { IBoardData, StrokeBuilder } from './boardData';
import { IRenderer } from './renderer';
import { ToolBox } from './tools';
import { Point } from './types';

export class CanvasController {
  // states
  private toolDown = false;
  private strokeConstructor: StrokeBuilder;

  constructor(
    private canvas: HTMLCanvasElement,
    private renderer: IRenderer,
    private boardData: IBoardData,
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
    const point: Point = this.createPoint(e);
    this.strokeConstructor.strokeStart(point);
    this.renderer.strokeStart(point);
  }

  private handlePointerMove(e: PointerEvent) {
    if (!this.toolDown) return;
    const lastPoint = this.strokeConstructor.strokeContinue(
      e.offsetX,
      e.offsetY,
      this.calculatePressure(e.pressure),
    );
    const point = this.createPoint(e);
    this.renderer.strokeContinue(point, lastPoint);
  }

  private handlePointerUpAndLeave() {
    this.toolDown = false;
    this.boardData.add(this.strokeConstructor.strokeComplete());
  }

  private createPoint(e: PointerEvent): Point {
    return {
      x: e.offsetX,
      y: e.offsetY,
      pressure: this.calculatePressure(e.pressure),
      color: this.toolBox.selectedTool.color,
      hitColor: this.boardData.genHitColor(),
    };
  }

  private calculatePressure(rawPressure: number): number {
    console.log(rawPressure);
    return rawPressure * 50 + this.toolBox.selectedTool.size;
  }
}