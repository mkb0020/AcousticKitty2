// PHYSICS RENDERER

import { GROUND_Y } from '../shared/constants.js';
import { levelData } from '../shared/levelData.js';

export class PhysicsRenderer {
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

  drawZones(zones) {
    if (zones && zones.length > 0) {
      zones.forEach(zone => {
        this.ctx.fillStyle = zone.color + '4D'; 
        this.ctx.fillRect(zone.start, 0, zone.end - zone.start, this.canvas.height);
        
        this.ctx.fillStyle = zone.color;
        this.ctx.font = "bold 16px Orbitron";
        this.ctx.fillText(zone.label, zone.start + 10, 30);
      });
    }
  }

  drawGround(camera) {
    const visibleStart = camera.x;
    const visibleEnd = camera.x + this.canvas.width;
    
    const dangerGradient = this.ctx.createLinearGradient(0, GROUND_Y, 0, this.canvas.height);
    dangerGradient.addColorStop(0, '#8B0000');
    dangerGradient.addColorStop(1, '#4B0000');
    this.ctx.fillStyle = dangerGradient;
    this.ctx.fillRect(visibleStart, GROUND_Y, visibleEnd - visibleStart, this.canvas.height - GROUND_Y);
    
    if (levelData.groundSegments && levelData.groundSegments.length > 0) {
      levelData.groundSegments.forEach(seg => {
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
  }

  drawPlatforms(platforms) {
    platforms.forEach(p => {
      this.ctx.fillStyle = "#dc4ce8";
      this.ctx.fillRect(p.x, p.y, p.w, p.h);
    });
  }

  drawRecordedArc(jumpTrail) {
    if (jumpTrail.length > 1) {
      this.ctx.strokeStyle = "rgba(220, 76, 232, 0.6)";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();

      jumpTrail.forEach((p, i) => {
        if (i === 0) this.ctx.moveTo(p.x, p.y);
        else this.ctx.lineTo(p.x, p.y);
      });

      this.ctx.stroke();

      this.ctx.fillStyle = "rgba(255, 199, 255, 1)";
      jumpTrail.forEach(p => {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        this.ctx.fill();
      });
    }
  }

  drawStandingPredictionArc(arc) {
    this.ctx.strokeStyle = "rgb(131, 12, 222)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    arc.points.forEach((p, i) => {
      if (i === 0) this.ctx.moveTo(p.x, p.y);
      else this.ctx.lineTo(p.x, p.y);
    });
    this.ctx.stroke();

    this.ctx.fillStyle = "rgb(165, 90, 255)";
    arc.points.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.fillStyle = "rgb(255, 120, 255)";
    this.ctx.beginPath();
    this.ctx.arc(arc.apex.x, arc.apex.y, 5, 0, Math.PI * 2);
    this.ctx.fill();

    if (arc.landing) {
      this.ctx.fillStyle = "rgb(180, 120, 255)";
      this.ctx.beginPath();
      this.ctx.arc(arc.landing.x, arc.landing.y, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.font = "12px Orbitron";
    this.ctx.fillStyle = "rgba(220, 200, 255, 0.95)";

    this.ctx.fillText(
      `Apex X: ${Math.round(arc.apex.x)}`,
      arc.apex.x + 8,
      arc.apex.y - 18
    );
    this.ctx.fillText(
      `Apex Y: ${Math.round(arc.apex.y)}`,
      arc.apex.x + 8,
      arc.apex.y - 6
    );

    if (arc.landing) {
      this.ctx.fillText(
        `Land X: ${Math.round(arc.landing.x)}`,
        arc.landing.x - 40,
        arc.landing.y + 20
      );
      this.ctx.fillText(
        `Land Y: ${Math.round(arc.landing.y)}`,
        arc.landing.x - 40,
        arc.landing.y + 34
      );
    }
  }

  drawMovingPredictionArc(arc, player) {
    const startX = player.x + player.w / 2;
    const startY = player.y + player.h;

    this.ctx.strokeStyle = "rgba(103, 254, 189, 0.8)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    arc.points.forEach((p, i) => {
      if (i === 0) this.ctx.moveTo(p.x, p.y);
      else this.ctx.lineTo(p.x, p.y);
    });
    this.ctx.stroke();

    this.ctx.fillStyle = "#dc4ce8";
    this.ctx.beginPath();
    this.ctx.arc(arc.apex.x, arc.apex.y, 5, 0, Math.PI * 2);
    this.ctx.fill();

    const maxX = arc.landing ? arc.landing.x : arc.points[arc.points.length - 1]?.x || startX;
    this.ctx.fillStyle = "#67FEBD";
    this.ctx.beginPath();
    this.ctx.arc(maxX, GROUND_Y, 5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.setLineDash([6, 6]);
    this.ctx.strokeStyle = "rgba(220, 76, 232, 0.6)";
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(startX, arc.apex.y);
    this.ctx.stroke();

    
    this.ctx.beginPath();
    this.ctx.moveTo(startX, GROUND_Y);
    this.ctx.lineTo(maxX, GROUND_Y);
    this.ctx.stroke();

    this.ctx.setLineDash([]);

    this.ctx.fillStyle = "rgba(220, 76, 232, 0.9)";
    this.ctx.font = "12px Orbitron";
    this.ctx.fillText(
      `Apex Y: ${Math.round(arc.apex.y)} px`,
      arc.apex.x + 8,
      arc.apex.y - 8
    );

    this.ctx.fillText(
      `Max Distance: ${Math.round(Math.abs(maxX - startX))} px`,
      maxX - 40,
      GROUND_Y + 20
    );
  }

  drawUI(player, mouseX, mouseY) {
    this.ctx.fillStyle = "rgba(0, 255, 255, 0.8)";
    this.ctx.font = "14px Orbitron";
    this.ctx.fillText(`Position: ${Math.round(player.x)} px`, 10, 20);
    this.ctx.fillText(`Platforms: ${window.levelData?.platforms?.length || 0}`, 10, 40);

    if (window.coordsSettings && window.coordsSettings.enabled) {
      this.ctx.fillStyle = "rgba(220, 76, 232, 0.9)";
      this.ctx.font = "14px Orbitron";
      this.ctx.fillText(`Mouse: X:${Math.round(mouseX)} Y:${Math.round(mouseY)}`, 10, 60);
    }
  }
}