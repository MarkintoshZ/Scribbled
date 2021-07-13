import { Canvas } from './canvas';
import { ToolBox } from './tools';
import { BoardData } from './boardData';
import { CanvasController } from './canvasController';
import { Renderer } from './renderer';

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

  private boardData: BoardData;
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
    this.hitCanvas = new Canvas({ width, height });
    this.canvasContainer.appendChild(this.canvas.getCanvas());

    // initiate states
    this.toolBox = new ToolBox();
    this.boardData = new BoardData();

    // add event listeners
    this.canvasController = new CanvasController(
      this.canvas.getCanvas(),
      new Renderer(this.canvas.getContext(), this.hitCanvas.getContext()),
      this.boardData,
      this.toolBox,
    );
  }

  public dispose(): void {
    this.canvasController.dispose();
  }

  public getHeight(): number { return this.height; }

  public getWidth(): number { return this.width; }
}
