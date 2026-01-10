// UFO
export class UFO {
  constructor() {
    this.x = 75;
    this.y = 240;
    this.vx = 0;
    this.vy = 0;
    this.w = 120;
    this.h = 50;
    this.angle = 0;
    this.targetVx = 0;
    this.targetVy = 0;
    
    this.sprite = new Image();
    this.sprite.src = "/sprites/UFO.png";
  }

  get left() { return this.x - this.w / 2; }
  get top() { return this.y - this.h / 2; }
  get right() { return this.x + this.w / 2; }
  get bottom() { return this.y + this.h / 2; }

  update(keys, canvasHeight, levelLength) {
    const dt = 1/60;
    const speed = 350;

    this.vx = this.vy = 0;
    if (keys.a || keys.A || keys.ArrowLeft) this.vx = -speed;
    if (keys.d || keys.D || keys.ArrowRight) this.vx = speed;
    if (keys.w || keys.W || keys.ArrowUp) this.vy = -speed;
    if (keys.s || keys.S || keys.ArrowDown) this.vy = speed;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.x = Math.max(this.w / 2, Math.min(levelLength - this.w / 2, this.x));
    this.y = Math.max(this.h / 2, Math.min(canvasHeight - this.h / 2, this.y));
  }

  reset(canvasHeight) {
    this.x = 100;
    this.y = canvasHeight / 2;
    this.vx = 0;
    this.vy = 0;
  }

  draw(ctx) {
    const drawX = this.x - this.w / 2;
    const drawY = this.y - this.h / 2;
    
    if (this.sprite.complete) {
      ctx.drawImage(this.sprite, drawX, drawY, this.w, this.h);
    } else {
      ctx.fillStyle = "#67FEBD";
      ctx.fillRect(drawX, drawY, this.w, this.h);
    }
  }
}