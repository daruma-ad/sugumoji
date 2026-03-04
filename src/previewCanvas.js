/**
 * Preview Canvas Module
 * テキストオーバーレイのプレビュー描画とドラッグ＆ドロップ配置
 */

// 縦書き時の句読点・小書き文字の位置補正マップ
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

// 小書き文字（縦書きで右上に寄せる）
const SMALL_KANA = new Set([
    'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'っ', 'ゃ', 'ゅ', 'ょ', 'ゎ',
    'ァ', 'ィ', 'ゥ', 'ェ', 'ォ', 'ッ', 'ャ', 'ュ', 'ョ', 'ヮ', 'ヵ', 'ヶ',
]);

export class PreviewCanvas {
    constructor() {
        this.canvas = document.getElementById('previewCanvas');
        this.ctx = this.canvas.getContext('2d');

        // テキスト配置の正規化座標（0～1）
        this.textPosition = { x: 0.5, y: 0.5 };

        // 現在の表示画像とスケール
        this.currentImage = null;
        this.displayScale = 1;
        this.canvasRect = null;

        // ドラッグ状態
        this._isDragging = false;
        this._dragOffset = { x: 0, y: 0 };

        // テキスト設定
        this._textSettings = null;

        // テキストの描画サイズ（キャッシュ）
        this._textBounds = { width: 0, height: 0 };

        this._initDrag();
    }

    /**
     * 画像を設定してプレビューを描画
     */
    setImage(imageData) {
        if (!imageData) {
            this.currentImage = null;
            return;
        }
        this.currentImage = imageData;
        this._fitCanvas();
        this.render();
    }

    /**
     * テキスト設定を更新して再描画
     */
    updateTextSettings(settings) {
        this._textSettings = settings;
        this.render();
    }

    /**
     * キャンバスをコンテナにフィットさせる
     */
    _fitCanvas() {
        if (!this.currentImage) return;

        const wrapper = document.getElementById('canvasWrapper');
        const wrapperRect = wrapper.getBoundingClientRect();
        const padding = 40;
        const maxW = wrapperRect.width - padding * 2;
        const maxH = wrapperRect.height - padding * 2;

        const imgW = this.currentImage.width;
        const imgH = this.currentImage.height;

        this.displayScale = Math.min(maxW / imgW, maxH / imgH, 1);

        this.canvas.width = imgW * this.displayScale;
        this.canvas.height = imgH * this.displayScale;
        this.canvas.style.width = `${this.canvas.width}px`;
        this.canvas.style.height = `${this.canvas.height}px`;
    }

    /**
     * メインレンダリング
     */
    render() {
        if (!this.currentImage) return;

        const ctx = this.ctx;
        const s = this.displayScale;
        const imgW = this.currentImage.width;
        const imgH = this.currentImage.height;

        // キャンバスクリア
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 画像描画
        ctx.drawImage(this.currentImage.img, 0, 0, imgW * s, imgH * s);

        // テキスト描画
        if (this._textSettings?.text) {
            this._drawText(ctx, s);
        }

        this.canvasRect = this.canvas.getBoundingClientRect();
    }

    /**
     * 実サイズのキャンバスにテキストを描画（書き出し用）
     */
    renderToCanvas(imageData, textSettings, textPosition) {
        const offscreen = document.createElement('canvas');
        offscreen.width = imageData.width;
        offscreen.height = imageData.height;
        const ctx = offscreen.getContext('2d');

        ctx.drawImage(imageData.img, 0, 0);

        if (textSettings?.text) {
            const prevSettings = this._textSettings;
            const prevPos = { ...this.textPosition };
            this._textSettings = textSettings;
            this.textPosition = textPosition;
            this._drawText(ctx, 1);
            this._textSettings = prevSettings;
            this.textPosition = prevPos;
        }

        return offscreen;
    }

    /**
     * テキスト描画ロジック
     */
    _drawText(ctx, scale) {
        const s = this._textSettings;
        if (!s || !s.text.trim()) return;

        const fontSize = s.fontSize * scale;
        const font = `${s.fontWeight} ${fontSize}px ${s.fontFamily}`;

        ctx.save();
        ctx.globalAlpha = s.textOpacity / 100;
        ctx.font = font;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';

        const canvasW = ctx.canvas.width;
        const canvasH = ctx.canvas.height;

        if (s.direction === 'vertical') {
            this._drawVerticalText(ctx, scale, canvasW, canvasH);
        } else {
            this._drawHorizontalText(ctx, scale, canvasW, canvasH);
        }

        ctx.restore();
    }

    /**
     * 横書きテキスト描画
     */
    _drawHorizontalText(ctx, scale, canvasW, canvasH) {
        const s = this._textSettings;
        const fontSize = s.fontSize * scale;
        const lines = s.text.split('\n');
        const lineHeight = fontSize * 1.4;

        // テキスト全体のサイズを計算
        let maxWidth = 0;
        for (const line of lines) {
            const metrics = ctx.measureText(line || ' ');
            maxWidth = Math.max(maxWidth, metrics.width);
        }
        const totalHeight = lineHeight * lines.length;

        this._textBounds = { width: maxWidth / canvasW, height: totalHeight / canvasH };

        const baseX = this.textPosition.x * canvasW - maxWidth / 2;
        const baseY = this.textPosition.y * canvasH - totalHeight / 2;

        // 背景帯
        if (s.bgBandEnabled) {
            const padding = fontSize * 0.3;
            ctx.save();
            ctx.globalAlpha = (s.textOpacity / 100) * (s.bgBandOpacity / 100);
            ctx.fillStyle = s.bgBandColor;
            ctx.fillRect(
                baseX - padding,
                baseY - padding,
                maxWidth + padding * 2,
                totalHeight + padding * 2
            );
            ctx.restore();
            ctx.globalAlpha = s.textOpacity / 100;
        }

        // テキスト描画
        for (let i = 0; i < lines.length; i++) {
            const x = baseX;
            const y = baseY + i * lineHeight;

            if (s.outlineEnabled && s.outlineWidth > 0) {
                ctx.strokeStyle = s.outlineColor;
                ctx.lineWidth = s.outlineWidth * scale;
                ctx.lineJoin = 'round';
                ctx.strokeText(lines[i], x, y);
            }

            ctx.fillStyle = s.textColor;
            ctx.fillText(lines[i], x, y);
        }
    }

    /**
     * 縦書きテキスト描画
     */
    _drawVerticalText(ctx, scale, canvasW, canvasH) {
        const s = this._textSettings;
        const fontSize = s.fontSize * scale;
        const charSize = fontSize;
        const lineSpacing = fontSize * 1.5;
        const charSpacing = fontSize * 1.2;

        // 行分割（縦書きでは各行は右から左へ）
        const lines = s.text.split('\n');

        const totalWidth = lineSpacing * lines.length;
        let maxChars = 0;
        for (const line of lines) {
            maxChars = Math.max(maxChars, [...line].length);
        }
        const totalHeight = charSpacing * maxChars;

        this._textBounds = { width: totalWidth / canvasW, height: totalHeight / canvasH };

        const centerX = this.textPosition.x * canvasW;
        const centerY = this.textPosition.y * canvasH;
        const startX = centerX + totalWidth / 2;
        const startY = centerY - totalHeight / 2;

        // 背景帯
        if (s.bgBandEnabled) {
            const padding = fontSize * 0.3;
            ctx.save();
            ctx.globalAlpha = (s.textOpacity / 100) * (s.bgBandOpacity / 100);
            ctx.fillStyle = s.bgBandColor;
            ctx.fillRect(
                startX - totalWidth - padding,
                startY - padding,
                totalWidth + padding * 2,
                totalHeight + padding * 2
            );
            ctx.restore();
            ctx.globalAlpha = s.textOpacity / 100;
        }

        // 各行描画（右から左）
        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            const chars = [...lines[lineIdx]]; // Unicodeサロゲートペア対応
            const colX = startX - (lineIdx + 1) * lineSpacing + lineSpacing / 2;

            for (let charIdx = 0; charIdx < chars.length; charIdx++) {
                const ch = chars[charIdx];
                const charY = startY + charIdx * charSpacing;

                const punc = VERTICAL_PUNCTUATION_MAP[ch];
                const isSmall = SMALL_KANA.has(ch);

                ctx.save();

                if (punc?.rotate) {
                    // 90度回転する文字（ー、カッコなど）
                    ctx.translate(colX, charY + charSize / 2);
                    ctx.rotate(Math.PI / 2);
                    ctx.translate(-colX, -(charY + charSize / 2));
                }

                let dx = 0, dy = 0;
                if (punc && !punc.rotate) {
                    dx = punc.dx * charSize;
                    dy = punc.dy * charSize;
                }
                if (isSmall) {
                    dx += charSize * 0.1;
                    dy += -charSize * 0.1;
                }

                const drawX = colX - charSize / 2 + dx;
                const drawY = charY + dy;

                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';

                if (s.outlineEnabled && s.outlineWidth > 0) {
                    ctx.strokeStyle = s.outlineColor;
                    ctx.lineWidth = s.outlineWidth * scale;
                    ctx.lineJoin = 'round';
                    ctx.strokeText(ch, drawX, drawY);
                }

                ctx.fillStyle = s.textColor;
                ctx.fillText(ch, drawX, drawY);

                ctx.restore();
            }
        }
    }

    /**
     * テキスト位置を取得
     */
    getTextPosition() {
        return { ...this.textPosition };
    }

    /**
     * ドラッグ＆ドロップの初期化
     */
    _initDrag() {
        this.canvas.addEventListener('mousedown', (e) => this._onPointerDown(e));
        this.canvas.addEventListener('mousemove', (e) => this._onPointerMove(e));
        window.addEventListener('mouseup', () => this._onPointerUp());

        // タッチサポート
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this._onPointerDown(touch);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this._onPointerMove(touch);
        }, { passive: false });

        window.addEventListener('touchend', () => this._onPointerUp());

        // ウィンドウリサイズ対応
        window.addEventListener('resize', () => {
            if (this.currentImage) {
                this._fitCanvas();
                this.render();
            }
        });
    }

    _onPointerDown(e) {
        if (!this.currentImage || !this._textSettings?.text) return;

        this.canvasRect = this.canvas.getBoundingClientRect();
        const mx = (e.clientX - this.canvasRect.left) / this.canvasRect.width;
        const my = (e.clientY - this.canvasRect.top) / this.canvasRect.height;

        // テキスト範囲内かチェック
        const tb = this._textBounds;
        const tx = this.textPosition.x;
        const ty = this.textPosition.y;

        if (
            mx >= tx - tb.width / 2 - 0.02 &&
            mx <= tx + tb.width / 2 + 0.02 &&
            my >= ty - tb.height / 2 - 0.02 &&
            my <= ty + tb.height / 2 + 0.02
        ) {
            this._isDragging = true;
            this._dragOffset.x = mx - tx;
            this._dragOffset.y = my - ty;
            this.canvas.style.cursor = 'grabbing';
        }
    }

    _onPointerMove(e) {
        if (!this._isDragging) {
            // ホバー時のカーソル変更
            if (this.canvasRect && this._textSettings?.text) {
                const mx = (e.clientX - this.canvasRect.left) / this.canvasRect.width;
                const my = (e.clientY - this.canvasRect.top) / this.canvasRect.height;
                const tb = this._textBounds;
                const tx = this.textPosition.x;
                const ty = this.textPosition.y;

                if (
                    mx >= tx - tb.width / 2 - 0.02 &&
                    mx <= tx + tb.width / 2 + 0.02 &&
                    my >= ty - tb.height / 2 - 0.02 &&
                    my <= ty + tb.height / 2 + 0.02
                ) {
                    this.canvas.style.cursor = 'grab';
                } else {
                    this.canvas.style.cursor = 'default';
                }
            }
            return;
        }

        this.canvasRect = this.canvas.getBoundingClientRect();
        const mx = (e.clientX - this.canvasRect.left) / this.canvasRect.width;
        const my = (e.clientY - this.canvasRect.top) / this.canvasRect.height;

        this.textPosition.x = Math.max(0, Math.min(1, mx - this._dragOffset.x));
        this.textPosition.y = Math.max(0, Math.min(1, my - this._dragOffset.y));

        this.render();
    }

    _onPointerUp() {
        if (this._isDragging) {
            this._isDragging = false;
            this.canvas.style.cursor = 'grab';
        }
    }
}
