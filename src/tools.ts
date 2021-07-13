export enum ToolType {
  Brush = 'BRUSH',
  Eraser = 'ERASER',
}

export interface Tool {
  type: ToolType,
  color?: string,
  size?: number,
}

export class ToolBox {
  public tools: Tool[];
  public selectedIdx = 0;

  constructor(tools: Tool[] = [
    { type: ToolType.Brush, color: '#000', size: 1 },
    { type: ToolType.Eraser, size: 1 },
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