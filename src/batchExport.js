/**
 * Batch Export Module (v3.0)
 * リサイズ機能とインテリジェント品質調整（KB制限）を追加
 */

import JSZip from 'jszip';

export class BatchExport {
    /**
     * 全画像に全レイヤーを合成してZIPでダウンロード
     */
    static async exportAll(images, layers, previewCanvas, settings) {
        if (images.length === 0) return;

        const modal = document.getElementById('exportModal');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        modal.style.display = '';

        const zip = new JSZip();
        const folder = zip.folder('batch_overlay_output');

        for (let i = 0; i < images.length; i++) {
            const progress = ((i + 1) / images.length) * 100;
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${i + 1} / ${images.length}`;

            await new Promise(r => setTimeout(r, 20));

            const imageData = images[i];

            // 1. リサイズ計算
            let targetW = imageData.width;
            let targetH = imageData.height;

            if (settings.resizeMode === 'width') {
                const ratio = settings.resizeValue / imageData.width;
                targetW = settings.resizeValue;
                targetH = imageData.height * ratio;
            } else if (settings.resizeMode === 'scale') {
                const ratio = settings.resizeValue / 100;
                targetW = imageData.width * ratio;
                targetH = imageData.height * ratio;
            }

            // 2. 合成描画
            // PreviewCanvasのrenderToCanvasを拡張してリサイズ対応させたいが、
            // 既存のメソッドはimageData.width/height固定なので、ここで調整
            const resultCanvas = this._renderResized(previewCanvas, imageData, layers, targetW, targetH);

            // 3. 形式と品質の調整
            let blob = null;
            const mime = settings.format;

            if (settings.mode === 'size' && mime !== 'image/png') {
                // インテリジェント品質調整
                blob = await this._getBlobUnderLimit(resultCanvas, mime, settings.value);
            } else {
                // 標準書き出し
                const quality = mime === 'image/png' ? undefined : (settings.value / 100);
                blob = await new Promise(resolve => resultCanvas.toBlob(resolve, mime, quality));
            }

            const baseName = imageData.name.replace(/\.[^/.]+$/, '');
            const ext = mime.split('/')[1];
            const fileName = `${baseName}_overlay.${ext === 'jpeg' ? 'jpg' : ext}`;

            folder.file(fileName, blob);
        }

        progressText.textContent = 'ZIPファイルを生成中...';
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch_export_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setTimeout(() => {
            modal.style.display = 'none';
            progressFill.style.width = '0%';
        }, 500);
    }

    /**
     * 指定サイズで描画
     */
    static _renderResized(previewCanvas, imageData, layers, tw, th) {
        const off = document.createElement('canvas');
        off.width = tw;
        off.height = th;
        const ctx = off.getContext('2d');

        // 背景画像を描画（リサイズ）
        ctx.drawImage(imageData.img, 0, 0, tw, th);

        // レイヤーを描画
        // PreviewCanvas._drawLayer は内部的なものなので、リサイズ済みのctxを渡して描画させる
        // スケールは1（targetW/Hがベースサイズになるため）
        layers.forEach(layer => {
            previewCanvas._drawLayer(ctx, layer, 1);
        });

        return off;
    }

    /**
     * 指定されたKB制限に収まる画質を自動探索
     */
    static async _getBlobUnderLimit(canvas, mime, maxKB) {
        const maxBytes = maxKB * 1024;
        let quality = 0.95;
        let blob = null;

        // 最大5回試行して品質を下げる
        for (let attempt = 0; attempt < 10; attempt++) {
            blob = await new Promise(resolve => canvas.toBlob(resolve, mime, quality));

            if (blob.size <= maxBytes || quality <= 0.1) {
                break;
            }

            // サイズ超過なら品質を下げる
            // 超過具合に応じて下げ幅を調整（簡易版）
            const ratio = blob.size / maxBytes;
            if (ratio > 2) quality -= 0.2;
            else if (ratio > 1.2) quality -= 0.1;
            else quality -= 0.05;

            if (quality < 0.05) quality = 0.05;
        }

        return blob;
    }
}
