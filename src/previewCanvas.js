/**
 * Preview Canvas Module (v2.0)
 * 複数レイヤーの統合描画、ヒットテスト、ドラッグ移動を管理
 */

// 縦書き用の設定定数
const VERTICAL_PUNCTUATION_MAP = {
    '。': { rotate: false, dx: 0.35, dy: -0.35 },
    '、': { rotate: false, dx: 0.35, dy: -0.35 },
    '．': { rotate: false, dx: 0.35, dy: -0.35 },
    '，': { rotate: false, dx: 0.35, dy: -0.35 },
    'ー': { rotate: true, dx: 0, dy: 0 },
    '～': { rotate: true, dx: 0, dy: 0 },
    '…': { rotate: true, dx: 0, dy: 0 },
    '─': { rotate: true, dx: 0, dy: 0 },
    '（': { rotate: true, dx: 0, dy: 0 },
    '）': { rotate: true, dx: 0, dy: 0 },
    '「': { rotate: true, dx: 0, dy: 0 },
    '」': { rotate: true, dx: 0, dy: 0 },
    '『': { rotate: true, dx: 0, dy: 0 },
    '』': { rotate: true, dx: 0, dy: 0 },
    '【': { rotate: true, dx: 0, dy: 0 },
    '】': { rotate: true, dx: 0, dy: 0 },
    '〔': { rotate: true, dx: 0, dy: 0 },
    '〕': { rotate: true, dx: 0, dy: 0 },
    '(': { rotate: true, dx: 0, dy: 0 },
    ')': { rotate: true, dx: 0, dy: 0 },
    '-': { rotate: true, dx: 0, dy: 0 },
};
const SMALL_KANA = new Set(['ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'っ', 'ゃ', 'ゅ', 'ょ', 'ゎ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ', 'ッ', 'ャ', 'ュ', 'ョ', 'ヮ', 'ヵ', 'ヶ']);

export class PreviewCanvas {
    constructor() {
        this.canvas = document.getElementById('previewCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.currentImage = null;
        this.layers = [];
        this.displayScale = 1;
        this.canvasRect = null;

        // Drag/Select state
        this._isDragging = false;
        this._dragOffset = { x: 0, y: 0 };
        this._selectedLayerId = null;

        // Callbacks
        this.onLayerSelect = null;
        this.onLayerMove = null;

        this._initEvents();
    }

    setLayers(layers, selectedId) {
        this.layers = layers;
        this._selectedLayerId = selectedId;
        this.render();
    }

    setImage(imageData) {
        this.currentImage = imageData;
        this._fitCanvas();
        this.render();
    }

    _fitCanvas() {
        if (!this.currentImage) return;
        const wrapper = document.getElementById('canvasWrapper');
        const wrapperRect = wrapper.getBoundingClientRect();
        const padding = 40;
        const maxW = wrapperRect.width - padding * 2;
        const maxH = wrapperRect.height - padding * 2;

        this.displayScale = Math.min(maxW / this.currentImage.width, maxH / this.currentImage.height, 1);
        this.canvas.width = this.currentImage.width * this.displayScale;
        this.canvas.height = this.currentImage.height * this.displayScale;
    }

    render() {
        if (!this.currentImage) return;
        const ctx = this.ctx;
        const s = this.displayScale;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Background Image
        ctx.drawImage(this.currentImage.img, 0, 0, this.canvas.width, this.canvas.height);

        // 2. Layers
        this.layers.forEach(layer => {
            this._drawLayer(ctx, layer, s);
        });

        this.canvasRect = this.canvas.getBoundingClientRect();
    }

    /**
     * 書き出し用の静止画生成
     */
    renderToCanvas(imageData, layers) {
        const off = document.createElement('canvas');
        off.width = imageData.width;
        off.height = imageData.height;
        const oCtx = off.getContext('2d');

        oCtx.drawImage(imageData.img, 0, 0);
        layers.forEach(layer => {
            this._drawLayer(oCtx, layer, 1);
        });
        return off;
    }

    _drawLayer(ctx, layer, scale) {
        ctx.save();
        ctx.globalAlpha = layer.opacity / 100;

        if (layer.type === 'text') {
            this._drawTextLayer(ctx, layer, scale);
        } else if (layer.type === 'image') {
            this._drawImageLayer(ctx, layer, scale);
        }

        // Selected highlight
        if (layer.id === this._selectedLayerId) {
            this._drawSelectionBorder(ctx, layer, scale);
        }

        ctx.restore();
    }

    _drawTextLayer(ctx, layer, scale) {
        const fontSize = layer.fontSize * scale;
        ctx.font = `${layer.fontWeight} ${fontSize}px ${layer.fontFamily}`;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';

        if (layer.writingDirection === 'vertical') {
            this._drawVerticalText(ctx, layer, scale);
        } else {
            this._drawHorizontalText(ctx, layer, scale);
        }
    }

    _drawHorizontalText(ctx, layer, scale) {
        const fontSize = layer.fontSize * scale;
        const lines = layer.text.split('\n');
        const lineHeight = fontSize * 1.4;

        let maxWidth = 0;
        lines.forEach(line => maxWidth = Math.max(maxWidth, ctx.measureText(line || ' ').width));
        const totalHeight = lineHeight * lines.length;

        const baseX = layer.x * ctx.canvas.width - maxWidth / 2;
        const baseY = layer.y * ctx.canvas.height - totalHeight / 2;

        // Cache bounds for hit testing in normalized coords
        layer._bounds = {
            x: (baseX / ctx.canvas.width),
            y: (baseY / ctx.canvas.height),
            w: maxWidth / ctx.canvas.width,
            h: totalHeight / ctx.canvas.height
        };

        if (layer.bgBand.enabled) {
            ctx.save();
            ctx.globalAlpha *= (layer.bgBand.opacity / 100);
            ctx.fillStyle = layer.bgBand.color;
            ctx.fillRect(baseX - fontSize * 0.2, baseY - fontSize * 0.1, maxWidth + fontSize * 0.4, totalHeight + fontSize * 0.2);
            ctx.restore();
        }

        lines.forEach((line, i) => {
            const y = baseY + i * lineHeight;
            if (layer.outline.enabled) {
                ctx.strokeStyle = layer.outline.color;
                ctx.lineWidth = layer.outline.width * scale;
                ctx.lineJoin = 'round';
                ctx.strokeText(line, baseX, y);
            }
            ctx.fillStyle = layer.color;
            ctx.fillText(line, baseX, y);
        });
    }

    _drawVerticalText(ctx, layer, scale) {
        const fontSize = layer.fontSize * scale;
        const lines = layer.text.split('\n');
        const lineSpacing = fontSize * 1.5;
        const charSpacing = fontSize * 1.2;

        const totalWidth = lineSpacing * lines.length;
        let maxChars = 0;
        lines.forEach(l => maxChars = Math.max(maxChars, [...l].length));
        const totalHeight = charSpacing * maxChars;

        const startX = layer.x * ctx.canvas.width + totalWidth / 2;
        const startY = layer.y * ctx.canvas.height - totalHeight / 2;

        layer._bounds = {
            x: (startX - totalWidth) / ctx.canvas.width,
            y: startY / ctx.canvas.height,
            w: totalWidth / ctx.canvas.width,
            h: totalHeight / ctx.canvas.height
        };

        if (layer.bgBand.enabled) {
            ctx.save();
            ctx.globalAlpha *= (layer.bgBand.opacity / 100);
            ctx.fillStyle = layer.bgBand.color;
            ctx.fillRect(startX - totalWidth - fontSize * 0.2, startY - fontSize * 0.1, totalWidth + fontSize * 0.4, totalHeight + fontSize * 0.2);
            ctx.restore();
        }

        lines.forEach((line, lIdx) => {
            const chars = [...line];
            const colX = startX - (lIdx + 1) * lineSpacing + lineSpacing / 2;
            chars.forEach((ch, cIdx) => {
                const charY = startY + cIdx * charSpacing;
                const punc = VERTICAL_PUNCTUATION_MAP[ch];
                ctx.save();
                if (punc?.rotate) {
                    ctx.translate(colX, charY + fontSize / 2);
                    ctx.rotate(Math.PI / 2);
                    ctx.translate(-colX, -(charY + fontSize / 2));
                }
                let dx = (punc && !punc.rotate) ? punc.dx * fontSize : 0;
                let dy = (punc && !punc.rotate) ? punc.dy * fontSize : 0;
                if (SMALL_KANA.has(ch)) { dx += fontSize * 0.1; dy -= fontSize * 0.1; }

                const x = colX - fontSize / 2 + dx;
                if (layer.outline.enabled) {
                    ctx.strokeStyle = layer.outline.color;
                    ctx.lineWidth = layer.outline.width * scale;
                    ctx.lineJoin = 'round';
                    ctx.strokeText(ch, x, charY + dy);
                }
                ctx.fillStyle = layer.color;
                ctx.fillText(ch, x, charY + dy);
                ctx.restore();
            });
        });
    }

    _drawImageLayer(ctx, layer, scale) {
        if (!layer.imageObj) return;
        const w = layer.size * scale;
        const h = (layer.origHeight / layer.origWidth) * w;
        const x = layer.x * ctx.canvas.width - w / 2;
        const y = layer.y * ctx.canvas.height - h / 2;

        layer._bounds = {
            x: x / ctx.canvas.width,
            y: y / ctx.canvas.height,
            w: w / ctx.canvas.width,
            h: h / ctx.canvas.height
        };

        ctx.drawImage(layer.imageObj, x, y, w, h);
    }

    _drawSelectionBorder(ctx, layer, scale) {
        const b = layer._bounds;
        if (!b) return;
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(b.x * ctx.canvas.width - 2, b.y * ctx.canvas.height - 2, b.w * ctx.canvas.width + 4, b.h * ctx.canvas.height + 4);
    }

    _initEvents() {
        this.canvas.addEventListener('mousedown', e => this._onDown(e));
        window.addEventListener('mousemove', e => this._onMove(e));
        window.addEventListener('mouseup', () => this._onUp());

        this.canvas.addEventListener('touchstart', e => { e.preventDefault(); this._onDown(e.touches[0]); }, { passive: false });
        window.addEventListener('touchmove', e => { if (this._isDragging) e.preventDefault(); this._onMove(e.touches[0]); }, { passive: false });
        window.addEventListener('touchend', () => this._onUp());

        window.addEventListener('resize', () => { if (this.currentImage) { this._fitCanvas(); this.render(); } });
    }

    _onDown(e) {
        if (!this.currentImage) return;
        this.canvasRect = this.canvas.getBoundingClientRect();
        const mx = (e.clientX - this.canvasRect.left) / this.canvasRect.width;
        const my = (e.clientY - this.canvasRect.top) / this.canvasRect.height;

        // Hit test from top to bottom (last rendered = top)
        let hitLayer = null;
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i];
            const b = layer._bounds;
            if (b && mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                hitLayer = layer;
                break;
            }
        }

        if (hitLayer) {
            this._isDragging = true;
            this._selectedLayerId = hitLayer.id;
            this._dragOffset = { x: mx - hitLayer.x, y: my - hitLayer.y };
            if (this.onLayerSelect) this.onLayerSelect(hitLayer.id);
            this.canvas.style.cursor = 'grabbing';
            this.render();
        } else {
            if (this.onLayerSelect) this.onLayerSelect(null);
        }
    }

    _onMove(e) {
        this.canvasRect = this.canvas.getBoundingClientRect();
        const mx = (e.clientX - this.canvasRect.left) / this.canvasRect.width;
        const my = (e.clientY - this.canvasRect.top) / this.canvasRect.height;

        if (this._isDragging && this._selectedLayerId) {
            const x = Math.max(0, Math.min(1, mx - this._dragOffset.x));
            const y = Math.max(0, Math.min(1, my - this._dragOffset.y));
            if (this.onLayerMove) this.onLayerMove(this._selectedLayerId, { x, y });
        } else {
            // Hover cursor
            let hit = false;
            for (let i = this.layers.length - 1; i >= 0; i--) {
                const b = this.layers[i]._bounds;
                if (b && mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                    hit = true; break;
                }
            }
            this.canvas.style.cursor = hit ? 'grab' : 'default';
        }
    }

    _onUp() {
        if (this._isDragging) {
            this._isDragging = false;
            this.canvas.style.cursor = 'grab';
        }
    }
}
