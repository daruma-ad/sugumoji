/**
 * Text Settings Module
 * テキスト設定の管理とUI連携
 */

export class TextSettings {
    constructor() {
        this.settings = {
            text: '',
            direction: 'horizontal', // 'horizontal' | 'vertical'
            fontFamily: "'Noto Sans JP', sans-serif",
            fontSize: 48,
            fontWeight: 700,
            textColor: '#ffffff',
            outlineEnabled: true,
            outlineColor: '#000000',
            outlineWidth: 3,
            bgBandEnabled: false,
            bgBandColor: '#000000',
            bgBandOpacity: 50,
            textOpacity: 100,
        };

        this.onChange = null;
    }

    /**
     * UIイベントを初期化
     */
    init() {
        // Text input
        const textInput = document.getElementById('textInput');
        textInput.addEventListener('input', () => {
            this.settings.text = textInput.value;
            this._notify();
        });

        // Writing direction
        const dirBtns = document.querySelectorAll('#writingDirection .toggle-btn');
        dirBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                dirBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.direction = btn.dataset.value;
                this._notify();
            });
        });

        // Font
        const fontSelect = document.getElementById('fontSelect');
        fontSelect.addEventListener('change', () => {
            this.settings.fontFamily = fontSelect.value;
            this._notify();
        });

        // Font size
        const fontSize = document.getElementById('fontSize');
        const fontSizeValue = document.getElementById('fontSizeValue');
        fontSize.addEventListener('input', () => {
            this.settings.fontSize = parseInt(fontSize.value);
            fontSizeValue.textContent = `${fontSize.value}px`;
            this._notify();
        });

        // Font weight
        const fontWeight = document.getElementById('fontWeight');
        fontWeight.addEventListener('change', () => {
            this.settings.fontWeight = parseInt(fontWeight.value);
            this._notify();
        });

        // Text color
        const textColor = document.getElementById('textColor');
        const textColorHex = document.getElementById('textColorHex');
        textColor.addEventListener('input', () => {
            this.settings.textColor = textColor.value;
            textColorHex.textContent = textColor.value;
            this._notify();
        });

        // Outline toggle
        const outlineEnabled = document.getElementById('outlineEnabled');
        const outlineSettings = document.getElementById('outlineSettings');
        outlineEnabled.addEventListener('change', () => {
            this.settings.outlineEnabled = outlineEnabled.checked;
            outlineSettings.style.display = outlineEnabled.checked ? '' : 'none';
            this._notify();
        });

        // Outline color
        const outlineColor = document.getElementById('outlineColor');
        const outlineColorHex = document.getElementById('outlineColorHex');
        outlineColor.addEventListener('input', () => {
            this.settings.outlineColor = outlineColor.value;
            outlineColorHex.textContent = outlineColor.value;
            this._notify();
        });

        // Outline width
        const outlineWidth = document.getElementById('outlineWidth');
        const outlineWidthValue = document.getElementById('outlineWidthValue');
        outlineWidth.addEventListener('input', () => {
            this.settings.outlineWidth = parseInt(outlineWidth.value);
            outlineWidthValue.textContent = `${outlineWidth.value}px`;
            this._notify();
        });

        // Background band toggle
        const bgBandEnabled = document.getElementById('bgBandEnabled');
        const bgBandSettings = document.getElementById('bgBandSettings');
        bgBandEnabled.addEventListener('change', () => {
            this.settings.bgBandEnabled = bgBandEnabled.checked;
            bgBandSettings.style.display = bgBandEnabled.checked ? '' : 'none';
            this._notify();
        });

        // Background band color
        const bgBandColor = document.getElementById('bgBandColor');
        const bgBandColorHex = document.getElementById('bgBandColorHex');
        bgBandColor.addEventListener('input', () => {
            this.settings.bgBandColor = bgBandColor.value;
            bgBandColorHex.textContent = bgBandColor.value;
            this._notify();
        });

        // Background band opacity
        const bgBandOpacity = document.getElementById('bgBandOpacity');
        const bgBandOpacityValue = document.getElementById('bgBandOpacityValue');
        bgBandOpacity.addEventListener('input', () => {
            this.settings.bgBandOpacity = parseInt(bgBandOpacity.value);
            bgBandOpacityValue.textContent = `${bgBandOpacity.value}%`;
            this._notify();
        });

        // Text opacity
        const textOpacity = document.getElementById('textOpacity');
        const opacityValue = document.getElementById('opacityValue');
        textOpacity.addEventListener('input', () => {
            this.settings.textOpacity = parseInt(textOpacity.value);
            opacityValue.textContent = `${textOpacity.value}%`;
            this._notify();
        });
    }

    /**
     * 現在の設定を取得
     */
    getSettings() {
        return { ...this.settings };
    }

    _notify() {
        this.onChange?.(this.getSettings());
    }
}
