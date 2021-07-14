var scribbled = (function (exports) {
    'use strict';

    class Canvas {
        constructor(config) {
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext('2d');
            this.canvas.style.padding = '0';
            this.canvas.style.margin = '0';
            this.canvas.style.background = 'transparent';
            this.canvas.style.width = config.width + 'px';
            this.canvas.style.height = config.height + 'px';
            const scale = window.devicePixelRatio;
            this.canvas.width = Math.floor(config.width * scale);
            this.canvas.height = Math.floor(config.height * scale);
            this.context.scale(scale, scale);
            this.pixelRatio = window.devicePixelRatio;
            this.width = config.width;
            this.height = config.height;
        }
        getCanvas() {
            return this.canvas;
        }
        getContext() {
            return this.context;
        }
        getPixelRatio() {
            return this.pixelRatio;
        }
        setWidth(width) {
            this.width = this.canvas.width = width * this.pixelRatio;
            this.canvas.style.width = width + 'px';
            const pixelRatio = this.pixelRatio, _context = this.getContext();
            _context.scale(pixelRatio, pixelRatio);
        }
        setHeight(height) {
            this.height = this.canvas.height = height * this.pixelRatio;
            this.canvas.style.height = height + 'px';
            const pixelRatio = this.pixelRatio, _context = this.getContext();
            _context.scale(pixelRatio, pixelRatio);
        }
        getWidth() {
            return this.width;
        }
        getHeight() {
            return this.height;
        }
        setSize(width, height) {
            this.setWidth(width || 0);
            this.setHeight(height || 0);
        }
        toDataURL(mimeType, quality) {
            try {
                return this.canvas.toDataURL(mimeType, quality);
            }
            catch (e) {
                try {
                    return this.canvas.toDataURL();
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
            { type: ToolType.Brush, color: '#000', size: 1 },
            { type: ToolType.Eraser, size: 1 },
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

    class BoardData {
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
            const point = this.createPoint(e);
            this.strokeConstructor.strokeStart(point);
            this.renderer.strokeStart(point);
        }
        handlePointerMove(e) {
            if (!this.toolDown)
                return;
            const lastPoint = this.strokeConstructor.strokeContinue(e.offsetX, e.offsetY, this.calculatePressure(e.pressure));
            const point = this.createPoint(e);
            this.renderer.strokeContinue(point, lastPoint);
        }
        handlePointerUpAndLeave(e) {
            if (!this.toolDown)
                return;
            this.handlePointerMove(e);
            this.toolDown = false;
            this.boardData.add(this.strokeConstructor.strokeComplete());
        }
        createPoint(e) {
            return {
                x: e.offsetX,
                y: e.offsetY,
                pressure: this.calculatePressure(e.pressure),
                color: this.toolBox.selectedTool.color,
                hitColor: this.boardData.genHitColor(),
            };
        }
        calculatePressure(rawPressure) {
            return rawPressure * 50 + this.toolBox.selectedTool.size;
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
            this.hitCanvas = new Canvas({ width, height });
            this.canvasContainer.appendChild(this.canvas.getCanvas());
            this.toolBox = new ToolBox();
            this.boardData = new BoardData();
            this.canvasController = new CanvasController(this.canvas.getCanvas(), new Renderer(this.canvas.getContext(), this.hitCanvas.getContext()), this.boardData, this.toolBox);
        }
        dispose() {
            this.canvasController.dispose();
        }
        getHeight() { return this.height; }
        getWidth() { return this.width; }
    }

    exports.Board = Board;
    exports.default = Board;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
