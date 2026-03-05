/**
 * Batch Export Module (v2.0)
 * 一括書き出し（ZIPダウンロード）
 */

import JSZip from 'jszip';

export class BatchExport {
    /**
     * 全画像に全レイヤーを合成してZIPでダウンロード
     */
    static async exportAll(images, layers, previewCanvas) {
        if (images.length === 0) return;

        const modal = document.getElementById('exportModal');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        modal.style.display = '';

        const zip = new JSZip();
        const folder = zip.folder('batch_text_output');

        for (let i = 0; i < images.length; i++) {
            const progress = ((i + 1) / images.length) * 100;
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${i + 1} / ${images.length}`;

            // UI更新のための微小待機
            await new Promise(r => setTimeout(r, 30));

            // 複数レイヤーを合成描画
            const resultCanvas = previewCanvas.renderToCanvas(images[i], layers);

            // Canvasをblobに変換
            const blob = await new Promise(resolve => {
                resultCanvas.toBlob(resolve, 'image/png');
            });

            const baseName = images[i].name.replace(/\.[^/.]+$/, '');
            const fileName = `${baseName}_overlay.png`;

            folder.file(fileName, blob);
        }

        progressText.textContent = 'ZIPファイルを生成中...';
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch_overlay_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setTimeout(() => {
            modal.style.display = 'none';
            progressFill.style.width = '0%';
        }, 500);
    }
}
