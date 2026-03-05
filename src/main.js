/**
 * BatchTextOverlay (v2.0) - Main Entry Point
 */

import './style.css';
import { ImageManager } from './imageManager.js';
import { LayerManager } from './layerManager.js';
import { LayerSettings } from './layerSettings.js';
import { PreviewCanvas } from './previewCanvas.js';
import { BatchExport } from './batchExport.js';

// === Module Instances ===
const imageManager = new ImageManager();
const layerManager = new LayerManager();
const layerSettings = new LayerSettings();
let previewCanvas = null;

// === DOM Elements ===
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const thumbnailList = document.getElementById('thumbnailList');
const imageCount = document.getElementById('imageCount');
const btnExport = document.getElementById('btnExport');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const navInfo = document.getElementById('navInfo');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const canvasWrapper = document.getElementById('canvasWrapper');
const previewNav = document.getElementById('previewNav');

const btnAddText = document.getElementById('btnAddText');
const btnAddLogo = document.getElementById('btnAddLogo');
const logoInput = document.getElementById('logoInput');
const layerList = document.getElementById('layerList');

// === Initialize ===
function init() {
  layerSettings.init();
  previewCanvas = new PreviewCanvas();

  setupFileInput();
  setupDragDrop();
  setupNavigation();
  setupExport();
  setupLayerControls();
  setupCallbacks();

  // 初期レイヤーを追加（利便性のため）
  layerManager.addTextLayer();
}

// === File Inputs ===
function setupFileInput() {
  fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      await imageManager.addFiles(e.target.files);
      fileInput.value = '';
    }
  });
}

function setupLayerControls() {
  btnAddText.addEventListener('click', () => {
    layerManager.addTextLayer();
  });

  btnAddLogo.addEventListener('click', () => {
    logoInput.click();
  });

  logoInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        layerManager.addImageLayer(file, img, url);
      };
      img.src = url;
    }
    logoInput.value = '';
  });
}

// === Drag & Drop ===
function setupDragDrop() {
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      await imageManager.addFiles(e.dataTransfer.files);
    }
  });
}

// === Navigation ===
function setupNavigation() {
  btnPrev.addEventListener('click', () => imageManager.prevImage());
  btnNext.addEventListener('click', () => imageManager.nextImage());

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft') imageManager.prevImage();
    else if (e.key === 'ArrowRight') imageManager.nextImage();
  });
}

// === Export ===
function setupExport() {
  const exportFormat = document.getElementById('exportFormat');
  const exportMode = document.getElementById('exportMode');
  const qualitySettings = document.getElementById('qualitySettings');
  const resizeMode = document.getElementById('resizeMode');
  const resizeValueGroup = document.getElementById('resizeValueGroup');

  // 形式切り替え
  exportFormat.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      exportFormat.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const format = btn.dataset.value;
      qualitySettings.style.display = format === 'image/png' ? 'none' : 'block';
    });
  });

  // 書き出しモード切り替え (画質 vs KB)
  exportMode.addEventListener('change', () => {
    const isQuality = exportMode.value === 'quality';
    document.getElementById('exportModeLabel').textContent = isQuality ? '画質' : '上限サイズ';
    document.getElementById('exportModeUnit').textContent = isQuality ? '%' : 'KB';
    document.getElementById('exportModeTip').textContent = isQuality
      ? '※数値が高いほど高画質ですが容量が増えます。'
      : '※指定したサイズに収まるよう画質を自動調整します。';
    document.getElementById('exportModeValue').value = isQuality ? 85 : 500;
  });

  // リサイズモード切り替え
  resizeMode.addEventListener('change', () => {
    const mode = resizeMode.value;
    resizeValueGroup.style.display = mode === 'none' ? 'none' : 'block';
    document.getElementById('resizeUnit').textContent = mode === 'width' ? 'px' : '%';
    document.getElementById('resizeLabel').textContent = mode === 'width' ? '最大幅' : '縮小率';
    document.getElementById('resizeValue').value = mode === 'width' ? 1200 : 75;
  });

  btnExport.addEventListener('click', async () => {
    // 書き出し設定の収集
    const settings = {
      format: exportFormat.querySelector('.toggle-btn.active').dataset.value,
      mode: exportMode.value,
      value: parseInt(document.getElementById('exportModeValue').value),
      resizeMode: resizeMode.value,
      resizeValue: parseInt(document.getElementById('resizeValue').value)
    };

    await BatchExport.exportAll(
      imageManager.images,
      layerManager.layers,
      previewCanvas,
      settings
    );
  });
}

// === Callbacks ===
function setupCallbacks() {
  // 画像関連
  imageManager.onImagesChange = (images) => {
    updateImageCount(images.length);
    updateThumbnailList(images);
    btnExport.disabled = images.length === 0;
    if (images.length === 0) {
      previewPlaceholder.style.display = '';
      canvasWrapper.style.display = 'none';
      previewNav.style.display = 'none';
    }
  };

  imageManager.onImageSelect = (index) => {
    if (index === null) return;
    previewPlaceholder.style.display = 'none';
    canvasWrapper.style.display = '';
    previewNav.style.display = '';
    previewCanvas.setImage(imageManager.images[index]);
    previewCanvas.setLayers(layerManager.layers, layerManager.selectedIndex !== null ? layerManager.layers[layerManager.selectedIndex].id : null);
    updateNavInfo(index, imageManager.images.length);
    highlightThumbnail(index);
  };

  // レイヤー関連
  layerManager.onLayersChange = (layers) => {
    updateLayerListUI(layers);
    previewCanvas.setLayers(layers, layerManager.getSelectedLayer()?.id);
  };

  layerManager.onSelectionChange = (layer) => {
    layerSettings.setLayer(layer);
    previewCanvas.setLayers(layerManager.layers, layer?.id);
  };

  layerSettings.onChange = (id, updates) => {
    layerManager.updateLayer(id, updates);
  };

  // キャンバス上の操作
  previewCanvas.onLayerSelect = (id) => {
    const idx = layerManager.layers.findIndex(l => l.id === id);
    layerManager.selectLayer(id ? idx : null);
  };

  previewCanvas.onLayerMove = (id, pos) => {
    layerManager.updateLayer(id, pos);
  };
}

// === UI Update Functions ===
function updateLayerListUI(layers) {
  layerList.innerHTML = '';
  // レイヤーは描画順（0が底）だがUIは上が手前の方が直感的なので逆順に表示
  [...layers].reverse().forEach((layer, idx) => {
    const actualIdx = layers.length - 1 - idx;
    const item = document.createElement('div');
    item.className = `layer-item${layerManager.selectedIndex === actualIdx ? ' active' : ''}`;

    const icon = layer.type === 'text' ? 'T' : '🖼️';
    const name = layer.type === 'text' ? (layer.text.substring(0, 10) || 'テキスト') : layer.name;

    item.innerHTML = `
      <div class="layer-icon">${icon}</div>
      <div class="layer-info">
        <div class="layer-name">${name}</div>
        <div class="layer-type">${layer.type}</div>
      </div>
      <div class="layer-actions">
        <button class="layer-action-btn delete" title="削除">✕</button>
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete')) return;
      layerManager.selectLayer(actualIdx);
    });

    item.querySelector('.delete').addEventListener('click', (e) => {
      e.stopPropagation();
      layerManager.removeLayer(layer.id);
    });

    layerList.appendChild(item);
  });
}

function updateImageCount(count) {
  imageCount.textContent = `${count}枚選択中`;
}

function updateNavInfo(current, total) {
  navInfo.textContent = `${current + 1} / ${total}`;
}

function updateThumbnailList(images) {
  thumbnailList.innerHTML = '';
  images.forEach((img, idx) => {
    const item = document.createElement('div');
    item.className = `thumb-item${idx === imageManager.currentIndex ? ' active' : ''}`;
    item.innerHTML = `
      <img class="thumb-img" src="${img.url}" />
      <div class="thumb-info">
        <div class="thumb-name">${img.name}</div>
      </div>
      <button class="thumb-remove" data-id="${img.id}">✕</button>
    `;
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('thumb-remove')) return;
      imageManager.selectImage(idx);
    });
    item.querySelector('.thumb-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      imageManager.removeImage(img.id);
    });
    thumbnailList.appendChild(item);
  });
}

function highlightThumbnail(activeIndex) {
  const items = thumbnailList.querySelectorAll('.thumb-item');
  items.forEach((item, idx) => {
    item.classList.toggle('active', idx === activeIndex);
  });
}

init();
