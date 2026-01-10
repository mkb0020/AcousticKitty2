// PLAYER CONTROLLER

import { CAT_FRAME_COUNT, HITBOX_WIDTH_RATIO, HITBOX_OFFSET_X } from '../shared/constants.js';

export class Player {
  constructor(groundY) {
    this.groundY = groundY;
    this.x = 50;
    this.y = groundY - 108;
    this.vx = 0;
    this.vy = 0;
    this.w = 150;
    this.h = 108;
    this.onGround = false;
    
    this.catWalkFrame = 2;
    this.catAnimTime = 0;
    
    this.sprite = new Image();
    this.sprite.src = "/sprites/cat.png";
    this.frameWidth = 0;
    this.frameHeight = 0;
    this.spriteLoaded = false;
    
    this.sprite.onload = () => {
      this.frameWidth = this.sprite.width / CAT_FRAME_COUNT;
      this.frameHeight = this.sprite.height;
      this.spriteLoaded = true;
    };
  }

  reset() {
    this.x = 50;
    this.y = this.groundY - this.h;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.catWalkFrame = 2;
    this.catAnimTime = 0;
  }

  setSize(w, h) {
    this.w = Math.max(1, Math.min(200, w));
    this.h = Math.max(1, Math.min(200, h));
  }

  collidesWith(rect) {
    const hitboxW = this.w * HITBOX_WIDTH_RATIO;
    const hitboxX = this.x + (this.w * HITBOX_OFFSET_X);
    
    return (
      hitboxX < rect.x + rect.w &&
      hitboxX + hitboxW > rect.x &&
      this.y < rect.y + rect.h &&
      this.y + this.h > rect.y
    );
  }

  update(keys, cfg, platforms) {
    const dt = 1/60;

    this.vx = 0;
    if (keys.a || keys.A || keys.ArrowLeft) this.vx = -cfg.speed;
    if (keys.d || keys.D || keys.ArrowRight) this.vx = cfg.speed;

    if ((keys[" "] || keys.w || keys.W || keys.ArrowUp) && this.onGround) {
      this.vy = -cfg.jumpForce;
      this.onGround = false;
    }

    this.vy += cfg.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.onGround = false;

    if (this.y + this.h >= this.groundY) {
      this.y = this.groundY - this.h;
      this.vy = 0;
      this.onGround = true;
    }

    for (let p of platforms) {
      if (this.collidesWith(p) && this.vy > 0 && this.y + this.h - this.vy <= p.y) {
        this.y = p.y - this.h;
        this.vy = 0;
        this.onGround = true;
      }
    }

    // ANIMATION
    if (this.onGround && this.vx !== 0) {
      this.catAnimTime += dt;
      if (this.catAnimTime >= 0.1) {
        this.catAnimTime = 0;
        this.catWalkFrame++;
        if (this.catWalkFrame > 9) this.catWalkFrame = 2;
      }
    } else if (this.onGround) {
      this.catWalkFrame = 2;
      this.catAnimTime = 0;
    }
  }

  draw(ctx) {
    let frameToUse = 0;
    if (!this.onGround) {
      frameToUse = 1;
    } else if (this.vx !== 0) {
      frameToUse = this.catWalkFrame;
    }

    if (this.spriteLoaded && this.frameWidth > 0) {
      if (this.vx < 0) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(
          this.sprite,
          frameToUse * this.frameWidth, 0,
          this.frameWidth, this.frameHeight,
          -this.x - this.w, this.y,
          this.w, this.h
        );
        ctx.restore();
      } else {
        ctx.drawImage(
          this.sprite,
          frameToUse * this.frameWidth, 0,
          this.frameWidth, this.frameHeight,
          this.x, this.y,
          this.w, this.h
        );
      }
    } else {
      ctx.fillStyle = "#67FEBD";
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }
}