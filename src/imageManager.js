/**
 * Image Manager Module
 * 画像の読み込み、一覧管理、サムネイル表示を担当
 */

export class ImageManager {
  constructor() {
    this.images = []; // { id, file, name, url, width, height, img }
    this.currentIndex = 0;
    this.onImagesChange = null;
    this.onImageSelect = null;
    this._idCounter = 0;
  }

  /**
   * ファイルリストから画像を追加
   */
  async addFiles(fileList) {
    const newImages = [];
    for (const file of fileList) {
      if (!file.type.startsWith('image/')) continue;
      
      const id = ++this._idCounter;
      const url = URL.createObjectURL(file);
      const img = await this._loadImage(url);
      
      newImages.push({
        id,
        file,
        name: file.name,
        url,
        width: img.naturalWidth,
        height: img.naturalHeight,
        img,
      });
    }

    this.images.push(...newImages);
    
    if (this.images.length === newImages.length) {
      this.currentIndex = 0;
    }

    this.onImagesChange?.(this.images);
    
    if (this.images.length > 0) {
      this.onImageSelect?.(this.currentIndex);
    }
  }

  /**
   * 画像を削除
   */
  removeImage(id) {
    const idx = this.images.findIndex(img => img.id === id);
    if (idx === -1) return;

    URL.revokeObjectURL(this.images[idx].url);
    this.images.splice(idx, 1);

    if (this.currentIndex >= this.images.length) {
      this.currentIndex = Math.max(0, this.images.length - 1);
    }

    this.onImagesChange?.(this.images);
    
    if (this.images.length > 0) {
      this.onImageSelect?.(this.currentIndex);
    } else {
      this.onImageSelect?.(null);
    }
  }

  /**
   * 表示画像を切り替え
   */
  selectImage(index) {
    if (index < 0 || index >= this.images.length) return;
    this.currentIndex = index;
    this.onImageSelect?.(index);
  }

  /**
   * 前の画像
   */
  prevImage() {
    if (this.images.length === 0) return;
    this.selectImage((this.currentIndex - 1 + this.images.length) % this.images.length);
  }

  /**
   * 次の画像
   */
  nextImage() {
    if (this.images.length === 0) return;
    this.selectImage((this.currentIndex + 1) % this.images.length);
  }

  /**
   * 現在の画像
   */
  getCurrentImage() {
    return this.images[this.currentIndex] || null;
  }

  /**
   * 画像のロード
   */
  _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
}
