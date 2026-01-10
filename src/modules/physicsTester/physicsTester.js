import { levelData } from '../shared/levelData.js';
import { GROUND_Y, MAX_TRAIL_POINTS } from '../shared/constants.js';
import { Player } from './player.js';
import { PhysicsRenderer } from './physicsRenderer.js';

export class PhysicsTester {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.renderer = new PhysicsRenderer(this.ctx, this.canvas);
    
    this.player = new Player(GROUND_Y);
    this.camera = { x: 0 };
    this.keys = {};
    
    this.mouseX = 0;
    this.mouseY = 0;
    
    this.jumpTrail = [];
    this.previewJumpDir = 0; 
    
    this.initInputs();
    this.initEventListeners();
  }

  initInputs() {
    this.gravityInput = document.getElementById('gravity');
    this.jumpForceInput = document.getElementById('jumpForce');
    this.speedInput = document.getElementById('speed');
    this.spriteWInput = document.getElementById('spriteW');
    this.spriteHInput = document.getElementById('spriteH');
    this.loadPhysicsBtn = document.getElementById('loadPhysics');
    this.resetPlayerBtn = document.getElementById('resetPlayer');
  }

  initEventListeners() {
    this.loadPhysicsBtn.onclick = () => this.loadPhysics();
    this.resetPlayerBtn.onclick = () => this.resetPlayer();
    
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left + this.camera.x;
      this.mouseY = e.clientY - rect.top;
    });
    
    window.addEventListener("keydown", e => {
      this.keys[e.key] = true;
      if (e.key === "r" || e.key === "R") this.resetPlayer();
      if (e.key === " ") e.preventDefault();
      if (e.key === "m" || e.key === "M") this.previewJumpDir = 1;
      if (e.key === "n" || e.key === "N") this.previewJumpDir = -1;
    });
    
    window.addEventListener("keyup", e => {
      this.keys[e.key] = false;
      if (e.key === "m" || e.key === "M" || e.key === "n" || e.key === "N") {
        this.previewJumpDir = 0;
      }
    });
  }

  getPhysicsConfig() {
    return {
      gravity: Math.max(0.1, Number(this.gravityInput.value) || 1600),
      jumpForce: Math.max(1, Number(this.jumpForceInput.value) || 780),
      speed: Math.max(1, Number(this.speedInput.value) || 250)
    };
  }

  loadPhysics() {
    const w = Number(this.spriteWInput.value) || 150;
    const h = Number(this.spriteHInput.value) || 108;
    this.player.setSize(w, h);
    this.resetPlayer();
  }

  resetPlayer() {
    this.player.reset();
    this.camera.x = 0;
    this.jumpTrail = [];
  }

  predictJumpArc(cfg, forcedVx = null) {
    const points = [];
    let x = this.player.x + this.player.w / 2;
    let y = this.player.y + this.player.h;
    let vx = forcedVx !== null ? forcedVx : this.player.vx;
    let vy = -cfg.jumpForce;

    const dt = 0.016;
    const maxSteps = 180;
    let apex = { x, y };
    let landing = null;

    for (let i = 0; i < maxSteps; i++) {
      vy += cfg.gravity * dt;
      x += vx * dt;
      y += vy * dt;

      if (y < apex.y) apex = { x, y };

      if (y >= GROUND_Y) {
        landing = { x, y: GROUND_Y };
        break;
      }

      for (let p of levelData.platforms) {
        if (x > p.x && x < p.x + p.w && y >= p.y && y <= p.y + p.h) {
          landing = { x, y: p.y };
          return { points, apex, landing };
        }
      }

      points.push({ x, y });
    }

    return { points, apex, landing };
  }

  update() {
    const cfg = this.getPhysicsConfig();
    this.player.update(this.keys, cfg, levelData.platforms);

    const targetCameraX = this.player.x - this.canvas.width / 3;
    this.camera.x += (targetCameraX - this.camera.x) * 0.1;
    this.camera.x = Math.max(0, this.camera.x);

    // RECORD JUMP ARC
    if (!this.player.onGround) {
      this.jumpTrail.push({
        x: this.player.x + this.player.w / 2,
        y: this.player.y + this.player.h
      });

      if (this.jumpTrail.length > MAX_TRAIL_POINTS) {
        this.jumpTrail.shift();
      }
    }

    if (this.player.onGround && this.jumpTrail.length > 0) {
      this.jumpTrail = [];
    }
  }

  draw() {
    const cfg = this.getPhysicsConfig();
    
    this.renderer.clear();
    this.renderer.drawWithCamera(this.camera, () => {
      this.renderer.drawGrid(this.camera);
      this.renderer.drawGround(this.camera);
      this.renderer.drawPlatforms(levelData.platforms);
      this.player.draw(this.ctx);
      
      if (window.arcSettings) {
        if (window.arcSettings.showRecorded) {
          this.renderer.drawRecordedArc(this.jumpTrail);
        }
        if (window.arcSettings.showStanding && this.player.onGround && this.player.vx === 0 && this.previewJumpDir !== 0) {
          const fakeVx = this.previewJumpDir * cfg.speed;
          const arc = this.predictJumpArc(cfg, fakeVx);
          this.renderer.drawStandingPredictionArc(arc);
        }
        if (window.arcSettings.showMoving && this.player.onGround) {
          const arc = this.predictJumpArc(cfg);
          this.renderer.drawMovingPredictionArc(arc, this.player);
        }
      }
    });
    
    this.renderer.drawUI(this.player, this.mouseX, this.mouseY);
  }
}