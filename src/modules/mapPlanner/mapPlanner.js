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
    this.numHolesInput = document.getElementById('numHoles');
    this.platformColorInput = document.getElementById('platformColor');
    this.dynamicInputsDiv = document.getElementById('dynamicInputs');
    this.generateBtn = document.getElementById('generateLevel');
    this.exportBtn = document.getElementById('exportJson');
    this.jsonUploadInput = document.getElementById('jsonUpload');
  }

  initEventListeners() {
    this.numPlatformsInput.addEventListener('input', () => this.createDynamicInputs());
    this.numHolesInput.addEventListener('input', () => this.createDynamicInputs());
    this.generateBtn.onclick = () => this.generateLevel();
    this.exportBtn.onclick = () => this.exportJson();
    this.jsonUploadInput.addEventListener('change', (e) => this.handleJsonUpload(e));
    
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left + this.camera.x;
      this.mouseY = e.clientY - rect.top;
    });
    
    window.addEventListener("keydown", e => {
      if (e.key === " " || e.key === "Space") {
        e.preventDefault();
        if (!this.keys[" "]) this.spaceJustPressed = true;
      }
      this.keys[e.key] = true;
    });
    
    window.addEventListener("keyup", e => this.keys[e.key] = false);
    
    this.createDynamicInputs();
  }

  createDynamicInputs() {
    let html = '';
    const numP = parseInt(this.numPlatformsInput.value) || 0;
    const numH = parseInt(this.numHolesInput.value) || 0;

    if (numP > 0) {
      html += '<div style="margin-bottom: 20px;"><div class="row"><div class="label-header">X</div><div class="label-header">Y</div><div class="label-header">Width</div><div class="label-header">Height</div></div>';
      for (let i = 0; i < numP; i++) {
        html += `<div class="row">
          <input type="number" class="plat-x" value="${i === 0 ? 300 : 0}" step="10">
          <input type="number" class="plat-y" value="300" step="10">
          <input type="number" class="plat-w" value="150" min="10" step="10">
          <input type="number" class="plat-h" value="20" min="10" step="10">
        </div>`;
      }
      html += '</div>';
    }

    if (numH > 0) {
      html += '<div><div class="row" style="grid-template-columns: 1fr 1fr;"><div class="label-header">Hole Start X</div><div class="label-header">Hole End X</div></div>';
      for (let i = 0; i < numH; i++) {
        html += `<div class="hole-row">
          <input type="number" class="hole-start" value="${i === 0 ? 1000 : 0}" step="50">
          <input type="number" class="hole-end" value="${i === 0 ? 1600 : 600}" step="50">
        </div>`;
      }
      html += '</div>';
    }

    if (numP === 0 && numH === 0) {
      html = '<p style="color: rgba(255,255,255,0.6); text-align:center;">Add platforms or holes to get started!</p>';
    }

    this.dynamicInputsDiv.innerHTML = html;
  }

  async handleJsonUpload(e) {
    if (!e.target.files || !e.target.files[0]) return;
    
    try {
      const text = await e.target.files[0].text();
      const data = JSON.parse(text);
      
      if (data.platforms && Array.isArray(data.platforms)) {
        this.numPlatformsInput.value = data.platforms.length;
        
        if (data.GroundSegments && Array.isArray(data.GroundSegments)) {
          const holes = [];
          let lastEnd = 0;
          data.GroundSegments.forEach((seg) => {
            if (seg.x > lastEnd) {
              holes.push({ start: lastEnd, end: seg.x });
            }
            lastEnd = seg.x + seg.width;
          });
          this.numHolesInput.value = holes.length;
        }
        
        this.createDynamicInputs();
        
        setTimeout(() => {
          document.querySelectorAll('.plat-x').forEach((el, i) => {
            if (data.platforms[i]) {
              el.value = data.platforms[i].x || 0;
              document.querySelectorAll('.plat-y')[i].value = data.platforms[i].y || 300;
              document.querySelectorAll('.plat-w')[i].value = data.platforms[i].w || data.platforms[i].width || 150;
              document.querySelectorAll('.plat-h')[i].value = data.platforms[i].h || data.platforms[i].height || 20;
            }
          });
          
          if (data.GroundSegments) {
            const holes = [];
            let lastEnd = 0;
            data.GroundSegments.forEach(seg => {
              if (seg.x > lastEnd) {
                holes.push({ start: lastEnd, end: seg.x });
              }
              lastEnd = seg.x + seg.width;
            });
            
            document.querySelectorAll('.hole-start').forEach((el, i) => {
              if (holes[i]) {
                el.value = holes[i].start;
                document.querySelectorAll('.hole-end')[i].value = holes[i].end;
              }
            });
          }
          
          this.generateLevel();
        }, 50);
        
      } else {
        alert("Invalid JSON format. Please provide a JSON with 'platforms' array.");
      }
    } catch (err) {
      alert("Error parsing uploaded file: " + err.message);
    }
  }

  generateLevel() {
    const newLevelLength = Math.max(1000, parseInt(this.levelLengthInput.value) || 10000);
    this.platformColor = this.platformColorInput.value;

    const platforms = [];
    document.querySelectorAll('.plat-x').forEach((el, i) => {
      platforms.push({
        x: parseFloat(el.value) || 0,
        y: parseFloat(document.querySelectorAll('.plat-y')[i].value) || 300,
        w: Math.max(10, parseFloat(document.querySelectorAll('.plat-w')[i].value) || 150),
        h: Math.max(10, parseFloat(document.querySelectorAll('.plat-h')[i].value) || 20)
      });
    });

    const holes = [];
    document.querySelectorAll('.hole-start').forEach((el, i) => {
      const start = parseFloat(el.value) || 0;
      const end = parseFloat(document.querySelectorAll('.hole-end')[i].value) || 600;
      if (start < end) holes.push({ start, end });
    });
    holes.sort((a, b) => a.start - b.start);

    const groundSegments = [];
    let currentX = 0;
    for (let hole of holes) {
      if (hole.start > currentX) {
        groundSegments.push({
          x: currentX,
          y: GROUND_Y,
          width: hole.start - currentX,
          height: GROUND_HEIGHT
        });
      }
      currentX = Math.max(currentX, hole.end);
    }
    if (currentX < newLevelLength) {
      groundSegments.push({
        x: currentX,
        y: GROUND_Y,
        width: newLevelLength - currentX,
        height: GROUND_HEIGHT
      });
    }

    updateLevelData({
      platforms,
      groundSegments,
      levelLength: newLevelLength
    });

    this.ufo.reset(this.canvas.height);
    this.camera.x = 0;
    this.spawnCows();
  }

  exportJson() {
    const data = {
      GroundSegments: levelData.groundSegments,
      platforms: levelData.platforms.map(p => ({
        x: p.x, y: p.y, w: p.w, h: p.h
      }))
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
      this.renderer.drawGrid(this.camera);
      this.renderer.drawGround(levelData.groundSegments);
      this.renderer.drawPlatforms(levelData.platforms, this.platformColor);
      this.renderer.drawCows(this.cows, this.ufo, this.cowSpriteSheet, this.cowFrameWidth, this.cowFrameHeight, this.cowSpriteLoaded);
      this.ufo.draw(this.ctx);
    });
    
    this.renderer.drawUI(this.ufo, this.cows, this.mouseX, this.mouseY);
  }
}