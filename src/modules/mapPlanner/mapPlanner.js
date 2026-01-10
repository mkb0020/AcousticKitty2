// mapPlanner

import { levelData, updateLevelData } from '../shared/levelData.js';
import { GROUND_Y, GROUND_HEIGHT, COW_WIDTH, COW_HEIGHT, COW_FRAME_COUNT, ABDUCTION_SPEED } from '../shared/constants.js';
import { UFO } from './ufo.js';
import { MapRenderer } from './mapRenderer.js';

export class MapPlanner {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.renderer = new MapRenderer(this.ctx, this.canvas);
    
    this.ufo = new UFO();
    this.camera = { x: 0 };
    this.keys = {};
    this.spaceJustPressed = false;
    this.platformColor = "#dc4ce8";
    
    this.mouseX = 0;
    this.mouseY = 0;
    
    this.cows = [];
    this.cowSpriteSheet = new Image();
    this.cowSpriteSheet.src = "/sprites/cow.png";
    this.cowFrameWidth = 0;
    this.cowFrameHeight = 0;
    this.cowSpriteLoaded = false;
    
    this.cowSpriteSheet.onload = () => {
      this.cowFrameWidth = this.cowSpriteSheet.width / COW_FRAME_COUNT;
      this.cowFrameHeight = this.cowSpriteSheet.height;
      this.cowSpriteLoaded = true;
    };
    
    this.initInputs();
    this.initEventListeners();
  }

  initInputs() {
    this.levelLengthInput = document.getElementById('levelLength');
    this.numPlatformsInput = document.getElementById('numPlatforms');
    this.numGroundSegmentsInput = document.getElementById('numGroundSegments');
    this.numZonesInput = document.getElementById('numZones');
    this.platformColorInput = document.getElementById('platformColor');
    this.dynamicInputsDiv = document.getElementById('dynamicInputs');
    this.dynamicZonesDiv = document.getElementById('dynamicZones');
    this.generateBtn = document.getElementById('generateLevel');
    this.exportBtn = document.getElementById('exportJson');
    this.jsonUploadInput = document.getElementById('jsonUpload');
    this.previewLevelBtn = document.getElementById('previewLevel');
    this.resetBtn = document.getElementById('resetLevel');
  }

  initEventListeners() {
    this.numPlatformsInput.addEventListener('input', () => this.createDynamicInputs());
    this.numGroundSegmentsInput.addEventListener('input', () => this.createDynamicInputs());
    this.numZonesInput.addEventListener('input', () => this.createZoneInputs());
    this.generateBtn.onclick = () => this.generateLevel();
    this.exportBtn.onclick = () => this.exportJson();
    this.previewLevelBtn.onclick = () => this.generateFullLevelPreview();
    this.jsonUploadInput.addEventListener('change', (e) => this.handleJsonUpload(e));
    this.resetBtn.onclick = () => this.resetLevel();

    
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left + this.camera.x;
      this.mouseY = e.clientY - rect.top;
    });
    
    window.addEventListener("keydown", e => {
      if (e.key === " " || e.key === "Space" || 
          e.key === "ArrowUp" || e.key === "ArrowDown" || 
          e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
      }
      
      if (e.key === " " || e.key === "Space") {
        if (!this.keys[" "]) this.spaceJustPressed = true;
      }
      this.keys[e.key] = true;
    });
    
    window.addEventListener("keyup", e => this.keys[e.key] = false);
    
    this.createDynamicInputs();
    this.createZoneInputs();
  }

  createDynamicInputs() {
    let html = '';
    const numP = parseInt(this.numPlatformsInput.value) || 0;
    const numG = parseInt(this.numGroundSegmentsInput.value) || 0;

    if (numP > 0) {
      html += '<div style="margin-bottom: 20px;"><h3 style="color: #67FEBD; margin-bottom: 10px;">Platforms</h3>';
      html += '<div class="row" style="grid-template-columns: 0.5fr 1fr 1fr 1fr 1fr 1.5fr;"><div class="label-header">#</div><div class="label-header">X</div><div class="label-header">Y</div><div class="label-header">Width</div><div class="label-header">Height</div><div class="label-header">Tag</div></div>';
      for (let i = 0; i < numP; i++) {
        html += `<div class="row" style="grid-template-columns: 0.5fr 1fr 1fr 1fr 1fr 1.5fr;">
          <div style="color: #67FEBD; font-weight: bold; display: flex; align-items: center; justify-content: center;">${i}</div>
          <input type="number" class="plat-x" value="${i === 0 ? 300 : 0}" step="10">
          <input type="number" class="plat-y" value="300" step="10">
          <input type="number" class="plat-w" value="150" min="10" step="10">
          <input type="number" class="plat-h" value="20" min="10" step="10">
          <input type="text" class="plat-tag" placeholder="default" value="">
        </div>`;
      }
      html += '</div>';
    }

    if (numG > 0) {
      html += '<div style="margin-top: 20px;"><h3 style="color: #67FEBD; margin-bottom: 10px;">Ground Segments</h3>';
      html += '<div class="row" style="grid-template-columns: 1fr 1fr;"><div class="label-header">Start X</div><div class="label-header">Width</div></div>';
      for (let i = 0; i < numG; i++) {
        html += `<div class="row" style="grid-template-columns: 1fr 1fr;">
          <input type="number" class="ground-x" value="${i === 0 ? 0 : 1000}" step="50">
          <input type="number" class="ground-w" value="${i === 0 ? 800 : 1000}" min="50" step="50">
        </div>`;
      }
      html += '</div>';
    }

    if (numP === 0 && numG === 0) {
      html = '<p style="color: rgba(255,255,255,0.6); text-align:center;">Add platforms or ground segments to get started!</p>';
    }

    this.dynamicInputsDiv.innerHTML = html;
  }

  createZoneInputs() {
    let html = '';
    const numZ = parseInt(this.numZonesInput.value) || 0;

    if (numZ > 0) {
      html += '<div style="margin-bottom: 20px;"><div class="row" style="grid-template-columns: 1fr 1fr 1fr 2fr;"><div class="label-header">Start X</div><div class="label-header">End X</div><div class="label-header">Color</div><div class="label-header">Label</div></div>';
      for (let i = 0; i < numZ; i++) {
        html += `<div class="row" style="grid-template-columns: 1fr 1fr 1fr 2fr;">
          <input type="number" class="zone-start" value="0" step="50">
          <input type="number" class="zone-end" value="500" step="50">
          <input type="color" class="zone-color" value="#ff6b6b">
          <input type="text" class="zone-label" placeholder="Zone ${i + 1}" value="Zone ${i + 1}">
        </div>`;
      }
      html += '</div>';
    }

    this.dynamicZonesDiv.innerHTML = html;
  }

  async handleJsonUpload(e) {
    if (!e.target.files || !e.target.files[0]) return;
    
    try {
      const text = await e.target.files[0].text();
      const data = JSON.parse(text);
      
      if (data.platforms && Array.isArray(data.platforms)) {
        this.numPlatformsInput.value = data.platforms.length;
      }
      
      if (data.GroundSegments && Array.isArray(data.GroundSegments)) {
        this.numGroundSegmentsInput.value = data.GroundSegments.length;
      }

      if (data.zones && Array.isArray(data.zones)) {
        this.numZonesInput.value = data.zones.length;
      }
      
      this.createDynamicInputs();
      this.createZoneInputs();
      
      setTimeout(() => {
        if (data.platforms) {
          document.querySelectorAll('.plat-x').forEach((el, i) => {
            if (data.platforms[i]) {
              el.value = data.platforms[i].x || 0;
              document.querySelectorAll('.plat-y')[i].value = data.platforms[i].y || 300;
              document.querySelectorAll('.plat-w')[i].value = data.platforms[i].w || data.platforms[i].width || 150;
              document.querySelectorAll('.plat-h')[i].value = data.platforms[i].h || data.platforms[i].height || 20;
              document.querySelectorAll('.plat-tag')[i].value = data.platforms[i].tag || '';
            }
          });
        }
        
        if (data.GroundSegments) {
          document.querySelectorAll('.ground-x').forEach((el, i) => {
            if (data.GroundSegments[i]) {
              el.value = data.GroundSegments[i].x || 0;
              document.querySelectorAll('.ground-w')[i].value = data.GroundSegments[i].width || 1000;
            }
          });
        }

        if (data.zones) {
          document.querySelectorAll('.zone-start').forEach((el, i) => {
            if (data.zones[i]) {
              el.value = data.zones[i].start;
              document.querySelectorAll('.zone-end')[i].value = data.zones[i].end;
              document.querySelectorAll('.zone-color')[i].value = data.zones[i].color;
              document.querySelectorAll('.zone-label')[i].value = data.zones[i].label;
            }
          });
        }
        
        this.generateLevel();
      }, 50);
      
    } catch (err) {
      alert("Error parsing uploaded file: " + err.message);
    }
  }

  generateLevel() {
    const newLevelLength = Math.max(1000, parseInt(this.levelLengthInput.value) || 10000);
    this.platformColor = this.platformColorInput.value;

    const platforms = [];
    document.querySelectorAll('.plat-x').forEach((el, i) => {
      const tag = document.querySelectorAll('.plat-tag')[i].value.trim();
      platforms.push({
        x: parseFloat(el.value) || 0,
        y: parseFloat(document.querySelectorAll('.plat-y')[i].value) || 300,
        w: Math.max(10, parseFloat(document.querySelectorAll('.plat-w')[i].value) || 150),
        h: Math.max(10, parseFloat(document.querySelectorAll('.plat-h')[i].value) || 20),
        tag: tag || 'default'
      });
    });

    const groundSegments = [];
    document.querySelectorAll('.ground-x').forEach((el, i) => {
      const x = parseFloat(el.value) || 0;
      const width = Math.max(50, parseFloat(document.querySelectorAll('.ground-w')[i].value) || 1000);
      groundSegments.push({
        x: x,
        y: GROUND_Y,
        width: width,
        height: GROUND_HEIGHT
      });
    });

    groundSegments.sort((a, b) => a.x - b.x);

    const zones = [];
    document.querySelectorAll('.zone-start').forEach((el, i) => {
      const start = parseFloat(el.value) || 0;
      const end = parseFloat(document.querySelectorAll('.zone-end')[i].value) || 500;
      const color = document.querySelectorAll('.zone-color')[i].value || '#ff6b6b';
      const label = document.querySelectorAll('.zone-label')[i].value || `Zone ${i + 1}`;
      
      if (start < end) {
        zones.push({ start, end, color, label });
      }
    });

    updateLevelData({
      platforms,
      groundSegments,
      levelLength: newLevelLength,
      zones
    });

    this.ufo.reset(this.canvas.height);
    this.camera.x = 0;
    this.spawnCows();
  }

  resetLevel() {
    this.levelLengthInput.value = 10000;
    this.numPlatformsInput.value = 0;
    this.numGroundSegmentsInput.value = 0;
    this.numZonesInput.value = 0;
    this.platformColorInput.value = '#dc4ce8';
    
    this.jsonUploadInput.value = '';
    
    this.createDynamicInputs();
    this.createZoneInputs();
    
    updateLevelData({
      platforms: [],
      groundSegments: [],
      levelLength: 10000,
      zones: []
    });
    
    this.ufo.reset(this.canvas.height);
    this.camera.x = 0;
    this.cows = [];
  }


  generateFullLevelPreview() {
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = levelData.levelLength;
    previewCanvas.height = this.canvas.height;
    const previewCtx = previewCanvas.getContext('2d');
    
    previewCtx.fillStyle = '#0a0a0a';
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    const tempRenderer = new MapRenderer(previewCtx, previewCanvas);
    
    tempRenderer.drawZones(levelData.zones);
    tempRenderer.drawGround(levelData.groundSegments);
    tempRenderer.drawPlatforms(levelData.platforms, this.platformColor, true);
    
    const dataURL = previewCanvas.toDataURL('image/png');
    this.showPreviewModal(dataURL);
  }

  showPreviewModal(imageDataURL) {
    let modal = document.getElementById('previewModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'previewModal';
      modal.className = 'modal';
      modal.style.display = 'none';
      
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 95%; max-height: 95vh; overflow: auto;">
          <div class="modal-header">
            <h1 class="modal-title">FULL LEVEL PREVIEW</h1>
            <button class="modal-close" id="closePreviewModal">X</button>
          </div>
          <div class="modal-body" style="text-align: center; padding: 20px;">
            <img id="previewImage" style="width: 100%; height: auto; border: 2px solid #67FEBD; border-radius: 8px;" />
            <div style="margin-top: 20px;">
              <button id="downloadPreviewBtn" style="background: #67FEBD; color: #0a0a0a; border: none; padding: 12px 24px; font-family: 'Orbitron', sans-serif; font-weight: bold; cursor: pointer; border-radius: 5px; font-size: 14px;">
                DOWNLOAD IMAGE
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const closeBtn = modal.querySelector('#closePreviewModal');
      closeBtn.onclick = () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
      };
      
      modal.onclick = (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
          document.body.style.overflow = 'auto';
        }
      };
      
      const downloadBtn = modal.querySelector('#downloadPreviewBtn');
      downloadBtn.onclick = () => {
        const img = modal.querySelector('#previewImage');
        const a = document.createElement('a');
        a.href = img.src;
        a.download = 'level-preview.png';
        a.click();
      };
    }
    
    const img = modal.querySelector('#previewImage');
    img.src = imageDataURL;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  exportJson() {
    const data = {
      GroundSegments: levelData.groundSegments,
      platforms: levelData.platforms.map(p => ({
        x: p.x, y: p.y, w: p.w, h: p.h, tag: p.tag
      })),
      zones: levelData.zones
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GeometryKittyLevel.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  spawnCows() {
    this.cows = [];
    if (levelData.groundSegments.length === 0) return;

    const numCows = 4 + Math.floor(Math.random() * 7);
    for (let i = 0; i < numCows; i++) {
      const seg = levelData.groundSegments[Math.floor(Math.random() * levelData.groundSegments.length)];
      if (seg.width < COW_WIDTH + 40) continue;

      const x = seg.x + 20 + Math.random() * (seg.width - COW_WIDTH - 40);
      this.cows.push({
        x: x + COW_WIDTH / 2,
        y: GROUND_Y - COW_HEIGHT / 2,
        state: "idle",
        frame: 0,
        animTime: 0
      });
    }
  }

  update() {
    const dt = 1/60;
    
    this.ufo.update(this.keys, this.canvas.height, levelData.levelLength);

    if (this.spaceJustPressed) {
      this.spaceJustPressed = false;
      
      for (let cow of this.cows) {
        if (cow.state === "abducting") continue;

        const dx = Math.abs(this.ufo.x - cow.x);
        const dy = this.ufo.bottom - cow.y;

        if (dx < 20 && dy < 10 && dy > -400) {
          cow.state = "abducting";
          cow.animTime = 0;
          cow.frame = 1;
          break;
        }
      }
    }

    this.cows = this.cows.filter(cow => {
      if (cow.state === "abducting") {
        cow.animTime += dt;
        if (cow.animTime >= 0.08) {
          cow.animTime = 0;
          cow.frame = cow.frame >= 8 ? 1 : cow.frame + 1;
        }

        cow.y -= ABDUCTION_SPEED * dt;

        if (cow.y <= this.ufo.y + 30) return false;
      }
      return true;
    });

    const targetCameraX = this.ufo.x - this.canvas.width / 3;
    this.camera.x += (targetCameraX - this.camera.x) * 0.12;
    this.camera.x = Math.max(0, Math.min(levelData.levelLength - this.canvas.width, this.camera.x));
  }

  draw() {
    this.renderer.clear();
    this.renderer.drawWithCamera(this.camera, () => {
      this.renderer.drawZones(levelData.zones);
      this.renderer.drawGrid(this.camera);
      this.renderer.drawGround(levelData.groundSegments);
      this.renderer.drawPlatforms(levelData.platforms, this.platformColor, true);
      this.renderer.drawCows(this.cows, this.ufo, this.cowSpriteSheet, this.cowFrameWidth, this.cowFrameHeight, this.cowSpriteLoaded);
      this.ufo.draw(this.ctx);
    });
    
    this.renderer.drawUI(this.ufo, this.cows, this.mouseX, this.mouseY);
  }
}