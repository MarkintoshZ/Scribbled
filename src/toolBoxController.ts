import { ToolBox } from './tools';

export class ToolBoxController {
  constructor(
    private toolBox: ToolBox,
  ) {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  public dispose(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  private handleKeyDown(e: KeyboardEvent): void {

  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.toolBox.tools.forEach((tool, idx) => {
      if (tool.triggerKey) {
        const keys = tool.triggerKey.split('+').map(key => key.trim());
        const key = keys[keys.length - 1];
        const ctrl = keys.includes('Ctrl');
        const shift = keys.includes('Shift');
        const option = keys.includes('Option') || keys.includes('Alt');
        console.log({ e, key, ctrl, shift, option });
        if (e.code === key &&
          e.ctrlKey === ctrl &&
          e.shiftKey === shift &&
          e.altKey === option) {
          this.toolBox.setToolByIdx(idx);
          console.log(`set tool to ${this.toolBox.selectedTool}`);
        }
      }
    });
  }
}