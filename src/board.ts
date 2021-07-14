import { Canvas } from './canvas';
import { ToolBox } from './tools';
import { CanvasData } from './canvasData';
import { CanvasController } from './canvasController';
import { Renderer } from './renderer';
import { ToolBoxController } from './toolBoxController';

interface IBoardConfig {
  container: string | HTMLElement;
  width: number;
  height: number;
}

/**
 * Scribbled Board to sketch and draw on
 */
export class Board {
  private canvasContainer: HTMLElement;
  private canvas: Canvas;
  private hitCanvas: Canvas;
  private width: number;
  private height: number;

  private canvasController: CanvasController;
  private toolBoxController: ToolBoxController;

  private boardData: CanvasData;
  private toolBox: ToolBox

  /**
   * Creates a new Board
   * @param ref either an id or a HTMLCanvasElement
   * @param width width in pixels
   * @param height height in pixels
   */
  constructor({ container, width = 640, height = 400 }: IBoardConfig) {
    // get container
    const containerElement = (typeof container === 'string') ?
      document.getElementById(container) : container;

    if (!containerElement) {
      throw Error(`Invalid argument: container = ${container}`);
    }

    this.width = width;
    this.height = height;

    // canvas container setup
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.style.cursor = 'crosshair';
    containerElement.appendChild(this.canvasContainer);

    // canvas setup
    this.canvas = new Canvas({ width, height });
    this.hitCanvas = new Canvas({ width, height, antialiased: false });
    this.canvas.attachDom(this.canvasContainer);
    this.hitCanvas.attachDom(this.canvasContainer);

    // initiate states
    this.toolBox = new ToolBox();
    this.boardData = new CanvasData();

    // add event listeners
    this.canvasController = new CanvasController(
      this.canvas.getCanvas(),
      new Renderer(this.canvas.canvasCtx, this.hitCanvas.canvasCtx),
      this.boardData,
      this.toolBox,
    );
    this.toolBoxController = new ToolBoxController(this.toolBox);
  }

  public dispose(): void {
    this.canvasController.dispose();
    this.toolBoxController.dispose();
  }

  public getHeight(): number { return this.height; }

  public getWidth(): number { return this.width; }
}
