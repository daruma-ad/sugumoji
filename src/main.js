/**
 * BatchTextOverlay - Main Entry Point
 * 全モジュールの統合・初期化・イベントハンドリング
 */

import './style.css';
import { ImageManager } from './imageManager.js';
import { TextSettings } from './textSettings.js';
import { PreviewCanvas } from './previewCanvas.js';
import { BatchExport } from './batchExport.js';

// === Module Instances ===
const imageManager = new ImageManager();
const textSettings = new TextSettings();
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

// === Initialize ===
function init() {
  textSettings.init();
  previewCanvas = new PreviewCanvas();

  setupFileInput();
  setupDragDrop();
  setupNavigation();
  setupExport();
  setupCallbacks();
}

// === File Input ===
function setupFileInput() {
  fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      await imageManager.addFiles(e.target.files);
      fileInput.value = '';
    }
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

  // キーボードナビゲーション
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

    if (e.key === 'ArrowLeft') {
      imageManager.prevImage();
    } else if (e.key === 'ArrowRight') {
      imageManager.nextImage();
    }
  });
}

// === Export ===
function setupExport() {
  btnExport.addEventListener('click', async () => {
    const settings = textSettings.getSettings();
    const position = previewCanvas.getTextPosition();
    await BatchExport.exportAll(
      imageManager.images,
      settings,
      position,
      previewCanvas
    );
  });
}

// === Callbacks ===
function setupCallbacks() {
  // 画像リスト変更時
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

  // 画像選択時
  imageManager.onImageSelect = (index) => {
    if (index === null) {
      previewPlaceholder.style.display = '';
      canvasWrapper.style.display = 'none';
      previewNav.style.display = 'none';
      return;
    }

    previewPlaceholder.style.display = 'none';
    canvasWrapper.style.display = '';
    previewNav.style.display = '';

    const img = imageManager.images[index];
    previewCanvas.setImage(img);
    previewCanvas.updateTextSettings(textSettings.getSettings());

    updateNavInfo(index, imageManager.images.length);
    highlightThumbnail(index);
  };

  // テキスト設定変更時
  textSettings.onChange = (settings) => {
    previewCanvas.updateTextSettings(settings);
  };
}

// === UI Update Functions ===
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
    if (idx === 0) item.classList.add('master');

    item.innerHTML = `
      <img class="thumb-img" src="${img.url}" alt="${img.name}" />
      <div class="thumb-info">
        <div class="thumb-name">${img.name}</div>
        <div class="thumb-size">${img.width}×${img.height}</div>
      </div>
      <button class="thumb-remove" data-id="${img.id}" title="削除">✕</button>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('thumb-remove')) return;
      imageManager.selectImage(idx);
    });

    const removeBtn = item.querySelector('.thumb-remove');
    removeBtn.addEventListener('click', (e) => {
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

// === Start ===
init();
