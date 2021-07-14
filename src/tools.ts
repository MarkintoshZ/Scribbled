export enum ToolType {
  Brush = 'BRUSH',
  Eraser = 'ERASER',
}

export interface Tool {
  type: ToolType,
  color?: string,
  size?: number,
  pressureSensitivity?: number,
  triggerKey?: string,
}

export class ToolBox {
  public tools: Tool[];
  public selectedIdx = 0;

  constructor(tools: Tool[] = [
    { type: ToolType.Brush, color: '#000', size: 1, pressureSensitivity: 50, triggerKey: 'Shift+KeyP' },
    { type: ToolType.Eraser, triggerKey: 'Shift+KeyE' },
  ]) {
    this.tools = tools;
  }

  public setToolByIdx(idx: number): void {
    this.selectedIdx = idx;
  }

  public setToolByType(name: string): void {
    this.selectedIdx = this.tools.findIndex((v) => v.type.valueOf() == name);
  }

  public get selectedTool(): Tool {
    return this.tools[this.selectedIdx];
  }
}