/**
 * LayerManager - レイヤー（テキスト/画像）の状態を管理するクラス
 */

export class LayerManager {
    constructor() {
        this.layers = [];
        this.selectedIndex = null;

        // Callbacks
        this.onLayersChange = null;
        this.onSelectionChange = null;
    }

    /**
     * 新しいテキストレイヤーを追加
     */
    addTextLayer(defaultSettings) {
        const id = 'layer-' + Date.now();
        const newLayer = {
            id,
            type: 'text',
            name: '新規テキスト',
            x: 0.5, // 中央位置 (0.0 - 1.0)
            y: 0.5,
            scale: 1,
            opacity: 100,
            text: 'テキストを入力',
            fontFamily: "'Noto Sans JP', sans-serif",
            fontSize: 48,
            fontWeight: '700',
            color: '#ffffff',
            writingDirection: 'horizontal',
            outline: { enabled: true, color: '#000000', width: 3 },
            bgBand: { enabled: false, color: '#000000', opacity: 50 },
            ...defaultSettings
        };

        this.layers.push(newLayer);
        this.selectLayer(this.layers.length - 1);
        this._notifyChange();
    }

    /**
     * 新しい画像（ロゴ）レイヤーを追加
     */
    addImageLayer(file, imgObj, url) {
        const id = 'layer-' + Date.now();
        const newLayer = {
            id,
            type: 'image',
            name: file.name,
            x: 0.5,
            y: 0.5,
            scale: 1,
            opacity: 100,
            imageUrl: url,
            imageObj: imgObj,
            origWidth: imgObj.width,
            origHeight: imgObj.height,
            size: 200 // デフォルトの表示サイズ（幅）
        };

        this.layers.push(newLayer);
        this.selectLayer(this.layers.length - 1);
        this._notifyChange();
    }

    /**
     * レイヤーを削除
     */
    removeLayer(id) {
        const index = this.layers.findIndex(l => l.id === id);
        if (index !== -1) {
            this.layers.splice(index, 1);

            if (this.selectedIndex === index) {
                this.selectedIndex = null;
            } else if (this.selectedIndex > index) {
                this.selectedIndex--;
            }

            this._notifyChange();
            if (this.onSelectionChange) this.onSelectionChange(this.getSelectedLayer());
        }
    }

    /**
     * レイヤーを選択
     */
    selectLayer(index) {
        this.selectedIndex = index;
        if (this.onSelectionChange) {
            this.onSelectionChange(this.getSelectedLayer());
        }
        this._notifyChange();
    }

    /**
     * 現在選択されているレイヤーを取得
     */
    getSelectedLayer() {
        if (this.selectedIndex === null) return null;
        return this.layers[this.selectedIndex];
    }

    /**
     * レイヤーのプロパティを更新
     */
    updateLayer(id, updates) {
        const layer = this.layers.find(l => l.id === id);
        if (layer) {
            Object.assign(layer, updates);
            this._notifyChange();
        }
    }

    /**
     * レイヤーの順序を入れ替え
     */
    reorderLayers(fromIndex, toIndex) {
        const [moved] = this.layers.splice(fromIndex, 1);
        this.layers.splice(toIndex, 0, moved);

        // 選択インデックスを追従
        if (this.selectedIndex === fromIndex) {
            this.selectedIndex = toIndex;
        } else if (fromIndex < this.selectedIndex && toIndex >= this.selectedIndex) {
            this.selectedIndex--;
        } else if (fromIndex > this.selectedIndex && toIndex <= this.selectedIndex) {
            this.selectedIndex++;
        }

        this._notifyChange();
    }

    _notifyChange() {
        if (this.onLayersChange) {
            this.onLayersChange(this.layers);
        }
    }
}
