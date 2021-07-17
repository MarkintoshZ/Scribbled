export enum ToolType {
  Brush = 'BRUSH',
  Eraser = 'ERASER',
}

/**
 * Specifies the tool
 */
export interface Tool {
  type: ToolType,
  /** Color of the stroke. Can be left empty for erasers */
  color?: string,
  /** Base radius of the stroke (in px) */
  size?: number,
  /** How much the pressure of the pen changes the radius of the stroke (in px) */
  pressureSensitivity?: number,
  /** Keyboard shortcut to switch to this tool */
  triggerKey?: string,
}

/**
 * Stores all the tools the are available to the user
 */
export class ToolBox {
  public tools: Tool[];
  public selectedIdx = 0;

  /**
   * @param tools - list of tools
   */
  constructor(tools: Tool[] = [
    { type: ToolType.Brush, color: '#000', size: 1, pressureSensitivity: 50, triggerKey: 'KeyP' },
    { type: ToolType.Eraser, triggerKey: 'KeyE' },
  ]) {
    this.tools = tools;
  }

  public setToolByIdx(idx: number): void {
    this.selectedIdx = idx;
  }

  public get selectedTool(): Tool {
    return this.tools[this.selectedIdx];
  }
}