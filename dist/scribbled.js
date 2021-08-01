var scribbled = (function (exports) {
    'use strict';

    class Canvas {
        constructor(config) {
            this._canvas = document.createElement('canvas');
            const ctx = this._canvas.getContext('2d');
            if (!ctx)
                throw new Error('Cannot get canvas context');
            this._context = ctx;
            this._canvas.style.padding = '0';
            this._canvas.style.margin = '0';
            this._canvas.style.background = 'transparent';
            this._canvas.style.width = config.width + 'px';
            this._canvas.style.height = config.height + 'px';
            const scale = window.devicePixelRatio;
            this._canvas.width = Math.floor(config.width * scale);
            this._canvas.height = Math.floor(config.height * scale);
            this._context.scale(scale, scale);
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
            { type: ToolType.Brush, color: '#000', size: 1, pressureSensitivity: 50, triggerKey: ['KeyP', 'KeyB'] },
            { type: ToolType.Eraser, triggerKey: 'KeyE' },
        ]) {
            this.selectedIdx = 0;
            this.tools = tools;
        }
        setToolByIdx(idx) {
            this.selectedIdx = idx;
        }
        get selectedTool() {
            return this.tools[this.selectedIdx];
        }
    }

    class AABB {
        constructor(topLeft, bottomRight) {
            this.x = topLeft.x;
            this.y = topLeft.y;
            this.width = bottomRight.x - topLeft.x;
            this.height = bottomRight.y - topLeft.y;
        }
        overlap(other) {
            return (this.x <= other.x + other.width &&
                this.y <= other.y + other.height &&
                this.x + this.width >= other.x &&
                this.y + this.height >= other.y);
        }
        union(other) {
            return new AABB({
                x: Math.min(this.x, other.x),
                y: Math.min(this.y, other.y)
            }, {
                x: Math.max(this.x + this.width, other.x + this.width),
                y: Math.max(this.y + this.height, other.y + other.height)
            });
        }
        expand(px) {
            this.x -= px;
            this.y -= px;
            this.width += 2 * px;
            this.height += 2 * px;
        }
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
        get(color) {
            return this.strokes.get(color);
        }
        checkOverlap(aabb) {
            var _a;
            for (const stroke of this.strokes.values()) {
                if ((_a = stroke.aabb) === null || _a === void 0 ? void 0 : _a.overlap(aabb))
                    return true;
            }
            return false;
        }
        getOverlap(aabb) {
            return [...this.strokes.values()]
                .filter((stroke) => { var _a; return (_a = stroke.aabb) === null || _a === void 0 ? void 0 : _a.overlap(aabb); });
        }
        genHitColor() {
            let randomColor;
            do {
                randomColor = '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
            } while (this.strokes.has(randomColor));
            return randomColor;
        }
    }
    class StrokeBuilder {
        constructor() {
            this.stroke = null;
        }
        strokeContinue({ x, y, radius: pressure }) {
            if (!this.stroke)
                throw new Error('Cannot continue stroke before strokeStart is called');
            this.stroke.x.push(x);
            this.stroke.y.push(y);
            this.stroke.radius.push(pressure);
            const l = this.stroke.x.length;
            return [{
                    x: this.stroke.x[l - 2],
                    y: this.stroke.y[l - 2],
                    radius: this.stroke.radius[l - 2],
                }, {
                    color: this.stroke.color,
                    hitColor: this.stroke.hitColor,
                }];
        }
        strokeStart({ x, y, radius: pressure, color, hitColor }) {
            this.stroke = {
                x: [x],
                y: [y],
                radius: [pressure],
                color: color,
                hitColor: hitColor,
                aabb: null
            };
        }
        strokeComplete() {
            if (this.stroke === null)
                throw new Error('Cannot complete stroke before strokeStart is called');
            this.stroke.aabb = new AABB({ x: Math.min(...this.stroke.x), y: Math.min(...this.stroke.y) }, { x: Math.max(...this.stroke.x), y: Math.max(...this.stroke.y) });
            const maxPressure = Math.max(...this.stroke.radius);
            this.stroke.aabb.expand(maxPressure + 3);
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
            this.currentTool = null;
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
            this.currentTool = Object.assign({}, this.toolBox.selectedTool);
            if (this.currentTool.type === ToolType.Eraser)
                return this.erase(this.createPoint(e));
            const point = this.createStyledPoint(e);
            this.strokeConstructor.strokeStart(point);
            this.renderer.strokeStart(point);
        }
        handlePointerMove(e) {
            if (this.currentTool === null)
                return;
            const point = this.createPoint(e);
            if (this.currentTool.type === ToolType.Eraser)
                return this.erase(point);
            const [lastPoint, { color, hitColor }] = this.strokeConstructor.strokeContinue(point);
            this.renderer.strokeContinue({ from: lastPoint, to: point, color, hitColor });
        }
        handlePointerUpAndLeave(e) {
            if (this.currentTool === null)
                return;
            if (this.currentTool.type !== ToolType.Eraser) {
                this.handlePointerMove(e);
                this.boardData.add(this.strokeConstructor.strokeComplete());
            }
            this.currentTool = null;
        }
        erase(point) {
            const color = this.renderer.getHitCvsColor(point);
            if (!this.boardData.get(color))
                return;
            const strokeToErase = this.boardData.get(color);
            if (!(strokeToErase === null || strokeToErase === void 0 ? void 0 : strokeToErase.aabb))
                throw new Error('Cannot find stroke to erase or its bounding box is null');
            const aabb = strokeToErase.aabb;
            this.renderer.clearRect(aabb);
            this.boardData.delete(color);
            const strokesNeedRepainting = this.boardData.getOverlap(aabb);
            strokesNeedRepainting.forEach(s => this.renderer.strokeRender(s));
        }
        createPoint(e) {
            return {
                x: e.offsetX,
                y: e.offsetY,
                radius: this.calculatePressure(e.pressure),
            };
        }
        createStyledPoint(e) {
            var _a;
            if (!((_a = this.currentTool) === null || _a === void 0 ? void 0 : _a.color))
                throw new Error('current tool does not have a color property');
            return Object.assign(Object.assign({}, this.createPoint(e)), { color: this.currentTool.color, hitColor: this.boardData.genHitColor() });
        }
        calculatePressure(rawPressure) {
            var _a, _b, _c, _d;
            return rawPressure * ((_b = (_a = this.currentTool) === null || _a === void 0 ? void 0 : _a.pressureSensitivity) !== null && _b !== void 0 ? _b : 1)
                + ((_d = (_c = this.currentTool) === null || _c === void 0 ? void 0 : _c.size) !== null && _d !== void 0 ? _d : 1);
        }
    }

    class Renderer {
        constructor(canvasCtx, hitCanvasCtx) {
            this.canvasCtx = canvasCtx;
            this.hitCanvasCtx = hitCanvasCtx;
        }
        getHitCvsColor({ x, y }) {
            const data = this.hitCanvasCtx.getImageData(x, y, 1, 1).data;
            return '#' + ('000000' + this.rgbToHex(data[0], data[1], data[2])).slice(-6);
        }
        rgbToHex(r, g, b) {
            if (r > 255 || g > 255 || b > 255)
                throw 'Invalid color component';
            return ((r << 16) | (g << 8) | b).toString(16);
        }
        clearRect(rect) {
            this.canvasCtx.clearRect(rect.x, rect.y, rect.width, rect.height);
            this.hitCanvasCtx.clearRect(rect.x, rect.y, rect.width, rect.height);
        }
        strokeStart(point) {
            this.drawCircle(this.canvasCtx, point.color, point);
            this.drawCircle(this.hitCanvasCtx, point.hitColor, Object.assign(Object.assign({}, point), { radius: Math.max(2, point.radius) }));
        }
        drawCircle(ctx, color, point) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(point.x, point.y, point.radius, point.radius, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
        strokeContinue({ from, to, color, hitColor }) {
            this.paintLine(this.canvasCtx, to.x, to.y, to.radius, from.x, from.y, from.radius, color);
            this.paintLine(this.hitCanvasCtx, to.x, to.y, Math.max(to.radius, 2), from.x, from.y, Math.max(from.radius, 2), hitColor);
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
        strokeRender({ x, y, radius: pressure, color, hitColor }) {
            this.strokeStart({ x: x[0], y: y[0], radius: pressure[0], color, hitColor });
            for (let i = 0; i < x.length; i++) {
                this.strokeContinue({
                    from: {
                        x: x[i - 1],
                        y: y[i - 1],
                        radius: pressure[i - 1],
                    },
                    to: {
                        x: x[i],
                        y: y[i],
                        radius: pressure[i],
                    },
                    color, hitColor
                });
            }
        }
    }

    const matchKey = (e, key) => {
        if (typeof key == 'string') {
            key = [key];
        }
        return key.some((k) => {
            const ctrl = k.includes('Ctrl');
            const shift = k.includes('Shift');
            const alt = k.includes('Alt');
            const meta = k.includes('Meta');
            if (['Ctrl', 'Shift', 'Alt', 'Meta'].includes(k)) {
                return e.ctrlKey == ctrl &&
                    e.shiftKey == shift &&
                    e.altKey == alt &&
                    e.metaKey == meta;
            }
            const code = k.split('+').pop();
            return e.ctrlKey == ctrl &&
                e.shiftKey == shift &&
                e.altKey == alt &&
                e.metaKey == meta &&
                e.code == code;
        });
    };

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
            if (e.defaultPrevented)
                return;
            const handled = this.toolBox.tools.some((tool, idx) => {
                if (tool.triggerKey) {
                    if (matchKey(e, tool.triggerKey)) {
                        this.toolBox.setToolByIdx(idx);
                        return true;
                    }
                }
            });
            if (handled)
                e.preventDefault();
        }
        handleKeyUp(e) { }
    }

    class Board {
        constructor({ container, width = 640, height = 400, toolBox = new ToolBox() }) {
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
            this.canvas.attachDom(this.canvasContainer);
            this.toolBox = toolBox;
            this.canvasData = new CanvasData();
            this.canvasController = new CanvasController(this.canvas.getCanvas(), new Renderer(this.canvas.canvasCtx, this.hitCanvas.canvasCtx), this.canvasData, this.toolBox);
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
    exports['default'] = Board;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
