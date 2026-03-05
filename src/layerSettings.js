/**
 * LayerSettings - 選択されたレイヤーの設定UIを管理するクラス
 */

export class LayerSettings {
    constructor() {
        this.currentLayer = null;
        this.onChange = null; // (updates) => void

        // UI Elements
        this.els = {};
    }

    /**
     * UI要素の初期化とイベントバインド
     */
    init() {
        const ids = [
            'layerSettings', 'noSelectionMessage', 'textOnlySettings',
            'textInput', 'writingDirection', 'fontSelect', 'fontWeight',
            'textColor', 'textColorHex', 'outlineEnabled', 'outlineSettings',
            'outlineColor', 'outlineColorHex', 'outlineWidth', 'outlineWidthValue',
            'bgBandEnabled', 'bgBandSettings', 'bgBandColor', 'bgBandColorHex',
            'bgBandOpacity', 'bgBandOpacityValue', 'layerSize', 'sizeLabel', 'sizeValue',
            'layerOpacity', 'opacityValue'
        ];

        ids.forEach(id => {
            this.els[id] = document.getElementById(id);
        });

        this._setupEventListeners();
    }

    /**
     * 選択中のレイヤーをUIに反映
     */
    setLayer(layer) {
        this.currentLayer = layer;

        if (!layer) {
            this.els.layerSettings.style.display = 'none';
            this.els.noSelectionMessage.style.display = 'block';
            return;
        }

        this.els.layerSettings.style.display = 'block';
        this.els.noSelectionMessage.style.display = 'none';

        // Type specific UI
        if (layer.type === 'text') {
            this.els.textOnlySettings.style.display = 'block';
            this.els.sizeLabel.childNodes[0].textContent = 'フォントサイズ ';
            this._updateTextUI(layer);
        } else {
            this.els.textOnlySettings.style.display = 'none';
            this.els.sizeLabel.childNodes[0].textContent = '表示サイズ ';
            this._updateImageUI(layer);
        }

        // Common UI
        const size = layer.type === 'text' ? layer.fontSize : layer.size;
        this.els.layerSize.value = size;
        this.els.sizeValue.textContent = `${size}px`;
        this.els.layerOpacity.value = layer.opacity;
        this.els.opacityValue.textContent = `${layer.opacity}%`;
    }

    _updateTextUI(layer) {
        this.els.textInput.value = layer.text;

        // Direction
        const dirBtns = this.els.writingDirection.querySelectorAll('.toggle-btn');
        dirBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === layer.writingDirection);
        });

        this.els.fontSelect.value = layer.fontFamily;
        this.els.fontWeight.value = layer.fontWeight;
        this.els.textColor.value = layer.color;
        this.els.textColorHex.textContent = layer.color;

        // Outline
        this.els.outlineEnabled.checked = layer.outline.enabled;
        this.els.outlineSettings.style.display = layer.outline.enabled ? '' : 'none';
        this.els.outlineColor.value = layer.outline.color;
        this.els.outlineColorHex.textContent = layer.outline.color;
        this.els.outlineWidth.value = layer.outline.width;
        this.els.outlineWidthValue.textContent = `${layer.outline.width}px`;

        // Background Band
        this.els.bgBandEnabled.checked = layer.bgBand.enabled;
        this.els.bgBandSettings.style.display = layer.bgBand.enabled ? '' : 'none';
        this.els.bgBandColor.value = layer.bgBand.color;
        this.els.bgBandColorHex.textContent = layer.bgBand.color;
        this.els.bgBandOpacity.value = layer.bgBand.opacity;
        this.els.bgBandOpacityValue.textContent = `${layer.bgBand.opacity}%`;
    }

    _updateImageUI(layer) {
        // 画像特有のUI更新（現在は共通のサイズと透明度のみ）
    }

    _setupEventListeners() {
        // Text changes
        this.els.textInput.addEventListener('input', () => {
            this._updateLayer({ text: this.els.textInput.value });
        });

        // Direction
        const dirBtns = this.els.writingDirection.querySelectorAll('.toggle-btn');
        dirBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                dirBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._updateLayer({ writingDirection: btn.dataset.value });
            });
        });

        // Font family, weight
        this.els.fontSelect.addEventListener('change', () => this._updateLayer({ fontFamily: this.els.fontSelect.value }));
        this.els.fontWeight.addEventListener('change', () => this._updateLayer({ fontWeight: this.els.fontWeight.value }));

        // Colors
        this._bindColorInput('textColor', 'textColorHex', (val) => ({ color: val }));
        this._bindColorInput('outlineColor', 'outlineColorHex', (val) => ({ outline: { ...this.currentLayer.outline, color: val } }));
        this._bindColorInput('bgBandColor', 'bgBandColorHex', (val) => ({ bgBand: { ...this.currentLayer.bgBand, color: val } }));

        // Toggles
        this.els.outlineEnabled.addEventListener('change', () => {
            const enabled = this.els.outlineEnabled.checked;
            this.els.outlineSettings.style.display = enabled ? '' : 'none';
            this._updateLayer({ outline: { ...this.currentLayer.outline, enabled } });
        });

        this.els.bgBandEnabled.addEventListener('change', () => {
            const enabled = this.els.bgBandEnabled.checked;
            this.els.bgBandSettings.style.display = enabled ? '' : 'none';
            this._updateLayer({ bgBand: { ...this.currentLayer.bgBand, enabled } });
        });

        // Range Inputs
        this.els.outlineWidth.addEventListener('input', () => {
            const val = parseInt(this.els.outlineWidth.value);
            this.els.outlineWidthValue.textContent = `${val}px`;
            this._updateLayer({ outline: { ...this.currentLayer.outline, width: val } });
        });

        this.els.bgBandOpacity.addEventListener('input', () => {
            const val = parseInt(this.els.bgBandOpacity.value);
            this.els.bgBandOpacityValue.textContent = `${val}%`;
            this._updateLayer({ bgBand: { ...this.currentLayer.bgBand, opacity: val } });
        });

        this.els.layerSize.addEventListener('input', () => {
            const val = parseInt(this.els.layerSize.value);
            this.els.sizeValue.textContent = `${val}px`;
            if (this.currentLayer.type === 'text') {
                this._updateLayer({ fontSize: val });
            } else {
                this._updateLayer({ size: val });
            }
        });

        this.els.layerOpacity.addEventListener('input', () => {
            const val = parseInt(this.els.layerOpacity.value);
            this.els.opacityValue.textContent = `${val}%`;
            this._updateLayer({ opacity: val });
        });
    }

    _bindColorInput(inputId, hexId, updateFn) {
        this.els[inputId].addEventListener('input', () => {
            const val = this.els[inputId].value;
            this.els[hexId].textContent = val;
            this._updateLayer(updateFn(val));
        });
    }

    _updateLayer(updates) {
        if (this.currentLayer && this.onChange) {
            this.onChange(this.currentLayer.id, updates);
        }
    }
}
