// MAP RENDERER
import { COW_WIDTH, COW_HEIGHT, BEAM_WIDTH, BEAM_COLOR, BEAM_GLOW_COLOR } from '../shared/constants.js';

export class MapRenderer {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawWithCamera(camera, drawFn) {
    this.ctx.save();
    this.ctx.translate(-camera.x, 0);
    drawFn();
    this.ctx.restore();
  }

  drawGrid(camera) {
    if (window.gridSettings && window.gridSettings.enabled) {
      const gridSize = window.gridSettings.size;
      this.ctx.strokeStyle = 'rgba(103, 254, 189, 0.2)';
      this.ctx.lineWidth = 1;
      
      const startX = Math.floor(camera.x / gridSize) * gridSize;
      const endX = camera.x + this.canvas.width;
      
      for (let x = startX; x < endX; x += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();
      }
      
      for (let y = 0; y < this.canvas.height; y += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(camera.x, y);
        this.ctx.lineTo(endX, y);
        this.ctx.stroke();
      }
    }
  }

  drawGround(groundSegments) {
    groundSegments.forEach(seg => {
      const gradient = this.ctx.createLinearGradient(0, seg.y, 0, seg.y + seg.height);
      gradient.addColorStop(0, '#2d5016');
      gradient.addColorStop(1, '#1a2f0d');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(seg.x, seg.y, seg.width, seg.height);

      this.ctx.fillStyle = '#3d6020';
      const grassDensity = Math.ceil(seg.width / 100);
      for (let i = 0; i < grassDensity; i++) {
        const x = seg.x + (i / grassDensity) * seg.width;
        this.ctx.fillRect(x, seg.y + 10, 30, 5);
        this.ctx.fillRect(x + 20, seg.y + 30, 40, 3);
      }
    });
  }

  drawPlatforms(platforms, platformColor) {
    platforms.forEach(p => {
      this.ctx.fillStyle = platformColor;
      this.ctx.fillRect(p.x, p.y, p.w, p.h);
    });
  }

  drawCows(cows, ufo, cowSpriteSheet, cowFrameWidth, cowFrameHeight, cowSpriteLoaded) {
    cows.forEach(cow => {
      const drawX = cow.x - COW_WIDTH / 2;
      const drawY = cow.y - COW_HEIGHT / 2;

      if (cow.state === "abducting") {
        const beamTop = ufo.y + ufo.h / 2;
        const beamHeight = cow.y - beamTop + 30;

        this.ctx.fillStyle = BEAM_GLOW_COLOR;
        this.ctx.fillRect(cow.x - BEAM_WIDTH * 0.8, beamTop - 10, BEAM_WIDTH * 1.6, beamHeight + 20);

        this.ctx.fillStyle = BEAM_COLOR;
        this.ctx.fillRect(cow.x - BEAM_WIDTH / 2, beamTop, BEAM_WIDTH, beamHeight);
      }

      const frameToUse = cow.state === "idle" ? 0 : cow.frame;

      if (cowSpriteLoaded && cowFrameWidth > 0) {
        this.ctx.drawImage(
          cowSpriteSheet,
          frameToUse * cowFrameWidth, 0,
          cowFrameWidth, cowFrameHeight,
          drawX, drawY,
          COW_WIDTH, COW_HEIGHT
        );
      } else {
        this.ctx.fillStyle = cow.state === "idle" ? "#FFB6C1" : "#FF69B4";
        this.ctx.fillRect(drawX, drawY, COW_WIDTH, COW_HEIGHT);
      }
    });
  }

  drawUI(ufo, cows, mouseX, mouseY) {
    this.ctx.fillStyle = "rgba(0, 255, 255, 0.9)";
    this.ctx.font = "16px Orbitron";
    this.ctx.fillText(`UFO: X:${Math.round(ufo.x)} Y:${Math.round(ufo.y)}`, 10, 25);
    this.ctx.fillText(`Cows: ${cows.length}`, 10, 50);

    if (window.coordsSettings && window.coordsSettings.enabled) {
      this.ctx.fillStyle = "rgba(220, 76, 232, 0.9)";
      this.ctx.font = "14px Orbitron";
      this.ctx.fillText(`Mouse: X:${Math.round(mouseX)} Y:${Math.round(mouseY)}`, 10, 75);
    }
  }
}