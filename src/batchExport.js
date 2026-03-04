/**
 * Batch Export Module
 * 一括書き出し（ZIPダウンロード）
 */

import JSZip from 'jszip';

export class BatchExport {
    /**
     * 全画像にテキストを合成してZIPでダウンロード
     * @param {Array} images - 画像データの配列
     * @param {Object} textSettings - テキスト設定
     * @param {Object} textPosition - テキスト位置
     * @param {PreviewCanvas} previewCanvas - PreviewCanvasインスタンス
     */
    static async exportAll(images, textSettings, textPosition, previewCanvas) {
        if (images.length === 0) return;

        const modal = document.getElementById('exportModal');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        modal.style.display = '';

        const zip = new JSZip();
        const folder = zip.folder('batch_text_output');

        for (let i = 0; i < images.length; i++) {
            // プログレス更新
            const progress = ((i + 1) / images.length) * 100;
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${i + 1} / ${images.length}`;

            // 少し待機してUIを更新
            await new Promise(r => setTimeout(r, 50));

            // Canvas上で画像にテキストを合成
            const resultCanvas = previewCanvas.renderToCanvas(images[i], textSettings, textPosition);

            // Canvasをblobに変換
            const blob = await new Promise(resolve => {
                resultCanvas.toBlob(resolve, 'image/png');
            });

            // ファイル名を生成
            const ext = images[i].name.includes('.') ? images[i].name.split('.').pop() : 'png';
            const baseName = images[i].name.replace(/\.[^/.]+$/, '');
            const fileName = `${baseName}_text.png`;

            folder.file(fileName, blob);
        }

        // ZIPを生成してダウンロード
        progressText.textContent = 'ZIPファイルを生成中...';

        const zipBlob = await zip.generateAsync({ type: 'blob' });

        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch_text_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // モーダルを閉じる
        setTimeout(() => {
            modal.style.display = 'none';
            progressFill.style.width = '0%';
        }, 500);
    }
}
