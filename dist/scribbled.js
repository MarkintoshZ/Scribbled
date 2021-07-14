var scribbled = (function (exports) {
    'use strict';

    class Canvas {
        constructor(config) {
            this._canvas = document.createElement('canvas');
            this._context = this._canvas.getContext('2d');
            this._canvas.style.padding = '0';
            this._canvas.style.margin = '0';
            this._canvas.style.background = 'transparent';
            this._canvas.style.width = config.width + 'px';
            this._canvas.style.height = config.height + 'px';
            const scale = window.devicePixelRatio;
            this._canvas.width = Math.floor(config.width * scale);
            this._canvas.height = Math.floor(config.height * scale);
            this._context.scale(scale, scale);
            this.canvasCtx['imageSmoothingEnabled'] = config.antialiased;
            this._pixelRatio = window.devicePixelRatio;
            this._width = config.width;
            this._height = config.height;
        }
        getCanvas() {
            return this._canvas;
        }
        get canvasCtx() {
            return this._context;
        }
        getPixelRatio() {
            return this._pixelRatio;
        }
        get width() {
            return this._width;
        }
        set width(width) {
            this._width = this._canvas.width = width * this._pixelRatio;
            this._canvas.style.width = width + 'px';
            const pixelRatio = this._pixelRatio, _context = this.canvasCtx;
            _context.scale(pixelRatio, pixelRatio);
        }
        get height() {
            return this._height;
        }
        set height(height) {
            this._height = this._canvas.height = height * this._pixelRatio;
            this._canvas.style.height = height + 'px';
            const pixelRatio = this._pixelRatio, _context = this.canvasCtx;
            _context.scale(pixelRatio, pixelRatio);
        }
        setSize(width, height) {
            this.width = width || this.width;
            this.height = height || this.height;
        }
        toDataURL(mimeType, quality) {
            try {
                return this._canvas.toDataURL(mimeType, quality);
            }
            catch (e) {
                try {
                    return this._canvas.toDataURL();
                }
                catch (err) {
                    return '';
                }
            }
        }
        attachDom(container) {
            container.appendChild(this.getCanvas());
        }
    }

    var ToolType;
    (function (ToolType) {
        ToolType["Brush"] = "BRUSH";
        ToolType["Eraser"] = "ERASER";
    })(ToolType || (ToolType = {}));
    class ToolBox {
        constructor(tools = [
            { type: ToolType.Brush, color: '#000', size: 1, pressureSensitivity: 50, triggerKey: 'Shift+KeyP' },
            { type: ToolType.Eraser, triggerKey: 'Shift+KeyE' },
        ]) {
            this.selectedIdx = 0;
            this.tools = tools;
        }
        setToolByIdx(idx) {
            this.selectedIdx = idx;
        }
        setToolByType(name) {
            this.selectedIdx = this.tools.findIndex((v) => v.type.valueOf() == name);
        }
        get selectedTool() {
            return this.tools[this.selectedIdx];
        }
    }

    class AABB {
        constructor(topLeft, bottomRight) {
            this.topLeft = topLeft;
            this.bottomRight = bottomRight;
        }
        overlap(other) {
            return (this.topLeft.x <= other.bottomRight.x &&
                this.bottomRight.x >= other.topLeft.x &&
                this.topLeft.y <= other.bottomRight.y &&
                this.bottomRight.y >= other.topLeft.y);
        }
        get width() { return this.bottomRight.x - this.topLeft.x; }
        get height() { return this.topLeft.y - this.bottomRight.y; }
    }

    class CanvasData {
        constructor() {
            this.strokes = new Map();
        }
        add(stroke) {
            if (this.strokes.has(stroke.hitColor))
                throw new Error(`Stroke with hitColor ${stroke.hitColor} already exists`);
            this.set(stroke);
        }
        delete(hitColor) {
            this.strokes.delete(hitColor);
        }
        set(stroke) {
            this.strokes.set(stroke.hitColor, stroke);
        }
        checkOverlap(aabb) {
            for (const stroke of this.strokes.values()) {
                if (stroke.aabb.overlap(aabb))
                    return true;
            }
        }
        getOverlap(aabb) {
            return [...this.strokes.values()]
                .filter((stroke) => stroke.aabb.overlap(aabb));
        }
        genHitColor() {
            let randomColor;
            do {
                randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
            } while (this.strokes.has(randomColor));
            return randomColor;
        }
    }
    class StrokeBuilder {
        strokeContinue(x, y, pressure) {
            if (!this.stroke)
                return;
            this.stroke.x.push(x);
            this.stroke.y.push(y);
            this.stroke.pressure.push(pressure);
            const l = this.stroke.x.length;
            return {
                x: this.stroke.x[l - 2],
                y: this.stroke.y[l - 2],
                pressure: this.stroke.pressure[l - 2],
                color: this.stroke.color,
                hitColor: this.stroke.hitColor,
            };
        }
        strokeStart({ x, y, pressure, color, hitColor }) {
            this.stroke = {
                x: [x],
                y: [y],
                pressure: [pressure],
                color: color,
                hitColor: hitColor,
                aabb: null
            };
        }
        strokeComplete() {
            if (this.stroke === null)
                throw new Error('Cannot complete stroke before stroke start is called');
            this.stroke.aabb = new AABB({ x: Math.min(...this.stroke.x), y: Math.min(...this.stroke.y) }, { x: Math.max(...this.stroke.x), y: Math.max(...this.stroke.y) });
            const stroke = this.stroke;
            this.stroke = null;
            return stroke;
        }
    }

    class CanvasController {
        constructor(canvas, renderer, boardData, toolBox) {
            this.canvas = canvas;
            this.renderer = renderer;
            this.boardData = boardData;
            this.toolBox = toolBox;
            this.toolDown = false;
            this.strokeConstructor = new StrokeBuilder();
            this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
            this.canvas.addEventListener('pointerup', this.handlePointerUpAndLeave.bind(this));
            this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
            this.canvas.addEventListener('pointerleave', this.handlePointerUpAndLeave.bind(this));
        }
        dispose() {
            this.canvas.removeEventListener('pointerdown', this.handlePointerDown.bind(this));
            this.canvas.removeEventListener('pointerup', this.handlePointerUpAndLeave.bind(this));
            this.canvas.removeEventListener('pointermove', this.handlePointerMove.bind(this));
            this.canvas.removeEventListener('pointerleave', this.handlePointerUpAndLeave.bind(this));
        }
        handlePointerDown(e) {
            this.toolDown = true;
            this.currentTool = this.toolBox.selectedTool;
            if (this.currentTool.type === ToolType.Eraser)
                return this.erase(e.offsetX, e.offsetY);
            const point = this.createPoint(e);
            this.strokeConstructor.strokeStart(point);
            this.renderer.strokeStart(point);
        }
        handlePointerMove(e) {
            if (!this.toolDown)
                return;
            if (this.currentTool.type === ToolType.Eraser)
                return this.erase(e.offsetX, e.offsetY);
            const lastPoint = this.strokeConstructor.strokeContinue(e.offsetX, e.offsetY, this.calculatePressure(e.pressure));
            const point = this.createPoint(e, lastPoint.hitColor);
            this.renderer.strokeContinue(point, lastPoint);
        }
        handlePointerUpAndLeave(e) {
            if (!this.toolDown)
                return;
            this.handlePointerMove(e);
            this.toolDown = false;
            this.currentTool = null;
            this.boardData.add(this.strokeConstructor.strokeComplete());
        }
        erase(x, y) {
        }
        createPoint(e, hitColor) {
            return {
                x: e.offsetX,
                y: e.offsetY,
                pressure: this.calculatePressure(e.pressure),
                color: this.currentTool.color,
                hitColor: hitColor || this.boardData.genHitColor(),
            };
        }
        calculatePressure(rawPressure) {
            return rawPressure * this.currentTool.pressureSensitivity + this.currentTool.size;
        }
    }

    class Renderer {
        constructor(canvasCtx, hitCanvasCtx) {
            this.canvasCtx = canvasCtx;
            this.hitCanvasCtx = hitCanvasCtx;
        }
        strokeStart(point) {
            this.drawCircle(this.canvasCtx, point.color, point);
            this.drawCircle(this.hitCanvasCtx, point.hitColor, point);
        }
        drawCircle(ctx, color, point) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(point.x, point.y, point.pressure, point.pressure, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
        strokeContinue(point, lastPoint) {
            this.paintLine(this.canvasCtx, point.x, point.y, point.pressure, lastPoint.x, lastPoint.y, lastPoint.pressure, point.color);
            this.paintLine(this.hitCanvasCtx, point.x, point.y, point.pressure, lastPoint.x, lastPoint.y, lastPoint.pressure, point.hitColor);
        }
        paintLine(ctx, tx, ty, tr, fx, fy, fr, color) {
            ctx.fillStyle = color;
            const angle = Math.atan((ty - fy) / (tx - fx));
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle + Math.PI / 2) * fr + fx, Math.sin(angle + Math.PI / 2) * fr + fy);
            ctx.lineTo(Math.cos(angle - Math.PI / 2) * fr + fx, Math.sin(angle - Math.PI / 2) * fr + fy);
            ctx.lineTo(Math.cos(angle - Math.PI / 2) * tr + tx, Math.sin(angle - Math.PI / 2) * tr + ty);
            ctx.lineTo(Math.cos(angle + Math.PI / 2) * tr + tx, Math.sin(angle + Math.PI / 2) * tr + ty);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tx, ty, tr - 0.1, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
        }
        strokeRender(stroke) {
        }
    }

    class ToolBoxController {
        constructor(toolBox) {
            this.toolBox = toolBox;
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
            document.addEventListener('keyup', this.handleKeyUp.bind(this));
        }
        dispose() {
            document.removeEventListener('keydown', this.handleKeyDown.bind(this));
            document.removeEventListener('keyup', this.handleKeyUp.bind(this));
        }
        handleKeyDown(e) {
        }
        handleKeyUp(e) {
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

    class Board {
        constructor({ container, width = 640, height = 400 }) {
            const containerElement = (typeof container === 'string') ?
                document.getElementById(container) : container;
            if (!containerElement) {
                throw Error(`Invalid argument: container = ${container}`);
            }
            this.width = width;
            this.height = height;
            this.canvasContainer = document.createElement('div');
            this.canvasContainer.style.cursor = 'crosshair';
            containerElement.appendChild(this.canvasContainer);
            this.canvas = new Canvas({ width, height });
            this.hitCanvas = new Canvas({ width, height, antialiased: false });
            this.canvas.attachDom(this.canvasContainer);
            this.hitCanvas.attachDom(this.canvasContainer);
            this.toolBox = new ToolBox();
            this.boardData = new CanvasData();
            this.canvasController = new CanvasController(this.canvas.getCanvas(), new Renderer(this.canvas.canvasCtx, this.hitCanvas.canvasCtx), this.boardData, this.toolBox);
            this.toolBoxController = new ToolBoxController(this.toolBox);
        }
        dispose() {
            this.canvasController.dispose();
            this.toolBoxController.dispose();
        }
        getHeight() { return this.height; }
        getWidth() { return this.width; }
    }

    exports.Board = Board;
    exports.default = Board;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
