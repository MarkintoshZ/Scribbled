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

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.defaultPrevented) return;

    const handled = this.toolBox.tools.some((tool, idx) => {
      if (tool.triggerKey) {
        const keys = tool.triggerKey.split('+').map(key => key.trim());
        const key = keys[keys.length - 1];
        const ctrl = keys.includes('Ctrl');
        const shift = keys.includes('Shift');
        const option = keys.includes('Option') || keys.includes('Alt');
        if (e.code === key &&
          e.ctrlKey === ctrl &&
          e.shiftKey === shift &&
          e.altKey === option) {
          this.toolBox.setToolByIdx(idx);
          return true;
        }
      }
    });

    if (handled) e.preventDefault();

  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  private handleKeyUp(e: KeyboardEvent): void { }
}