# SuguMoji - 開発ウォークスルー

## 概要
複数の画像に一括でテキストを挿入するWebアプリ「**SuguMoji**」を構築しました。

---

## 実装内容

### 技術構成
| 項目 | 詳細 |
|------|------|
| ビルドツール | Vite (vanilla JS) |
| 画像処理 | Canvas API |
| ZIP生成 | JSZip |
| フォント | Google Fonts (Noto Sans JP, Noto Serif JP, Zen Maru Gothic) |
| デザイン | ダークテーマ・グラスモーフィズム |

### ファイル構成

| ファイル | 役割 |
|---------|------|
| [index.html](file:///Users/takeshi/Desktop/antigravity/20260304/index.html) | 3カラムレイアウトHTML |
| [style.css](file:///Users/takeshi/Desktop/antigravity/20260304/src/style.css) | ダークテーマCSS・アニメーション |
| [main.js](file:///Users/takeshi/Desktop/antigravity/20260304/src/main.js) | 全モジュール統合・イベントハンドリング |
| [imageManager.js](file:///Users/takeshi/Desktop/antigravity/20260304/src/imageManager.js) | 画像の読み込み・管理 |
| [textSettings.js](file:///Users/takeshi/Desktop/antigravity/20260304/src/textSettings.js) | テキスト設定UI連携 |
| [previewCanvas.js](file:///Users/takeshi/Desktop/antigravity/20260304/src/previewCanvas.js) | Canvas描画・ドラッグ配置・縦書き/横書き |
| [batchExport.js](file:///Users/takeshi/Desktop/antigravity/20260304/src/batchExport.js) | 一括ZIP書き出し |

---

## 機能一覧

- ✅ **複数画像の選択**（ファイル選択 & ドラッグ＆ドロップ）
- ✅ **テキスト入力**（複数行対応）
- ✅ **横書き/縦書き切替**（句読点・小書き文字の位置補正付き）
- ✅ **フォント選択**（ゴシック・明朝・丸ゴシック）
- ✅ **文字色・フォントサイズ・太さの調整**
- ✅ **縁取り**（色・太さ設定）
- ✅ **背景帯**（色・透明度設定）
- ✅ **全体透明度**（ウォーターマーク用途にも対応）
- ✅ **ドラッグ＆ドロップでテキスト配置**
- ✅ **高度な書き出し設定**: PNG/JPEG/WebP 形式の選択（v3.0）
- ✅ **インテリジェント・サイズ制限**: 指定したKB以下に画質を自動調整（v3.0）
- ✅ **一括リサイズ**: 幅(px)や比率(%)による一括解像度変更（v3.0）
- ✅ **レイヤー管理**: 複数のテキスト・画像を個別に移動・編集（v2.0）
- ✅ **ロゴ画像挿入**: カスタム画像をアップロードして配置（v2.0）
- ✅ **一括ZIP書き出し**: 合成・最適化された全画像を出力

---

## 本番環境

アプリは GitHub Pages にデプロイされており、以下のURLから利用可能です。
**URL: [https://daruma-ad.github.io/sugumoji/](https://daruma-ad.github.io/sugumoji/)**

### CI/CD構成
- GitHub Actions を使用して、`main` brance へのプッシュ時に自動的にビルドとデプロイが行われるように設定しました。

### 本番環境公開確認
![SuguMoji Live Site Verification](/Users/takeshi/.gemini/antigravity/brain/40904e70-a68c-489d-a7f8-4111fca95966/sugumoji_live_site_1772763491813.png)

---

## テスト結果

### v3.0 書き出し詳細設定（本番）
````carousel
![書き出し設定UIとKB制限テスト](/Users/takeshi/.gemini/antigravity/brain/40904e70-a68c-489d-a7f8-4111fca95966/export_in_progress_1772692678146.png)
<!-- slide -->
![WebP/JPEG形式と画質・サイズ指定UI](/Users/takeshi/.gemini/antigravity/brain/40904e70-a68c-489d-a7f8-4111fca95966/v2_final_verification_1772688768025.png)
````

### v2.0 複数レイヤー管理（本番）
![レイヤー管理パネルUI](/Users/takeshi/.gemini/antigravity/brain/40904e70-a68c-489d-a7f8-4111fca95966/v2_deployment_check_1772688655841.png)

### ローカルでの機能検証
````carousel
![初期表示](/Users/takeshi/.gemini/antigravity/brain/40904e70-a68c-489d-a7f8-4111fca95966/initial_load_1772636515368.png)
<!-- slide -->
![縦書きテキストのテスト](/Users/takeshi/.gemini/antigravity/brain/40904e70-a68c-489d-a7f8-4111fca95966/test2_vertical_text_1772637527036.png)
````

---

## 起動方法

```bash
cd /Users/takeshi/Desktop/antigravity/20260304
npm run dev
```

ブラウザで http://localhost:5173/ を開いてご利用ください。
