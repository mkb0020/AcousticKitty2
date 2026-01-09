// ============================================ SHARED DATA BETWEEN TABS ============================================ 
let sharedLevelData = {
  platforms: [],
  groundSegments: [],
  levelLength: 20000,
  zones: []
};

// ============================================ TAB 1: MAP PLANNER ============================================
const mapCanvas = document.getElementById("mapCanvas");
const mapCtx = mapCanvas.getContext("2d");
let mapMouseX = 0;
let mapMouseY = 0;
let physicsMouseX = 0;
let physicsMouseY = 0;

const groundY = 440;
const groundHeight = 50;
let cows = [];
let platformColor = "#dc4ce8";

let ufo = {
  x: 75, y: 240, x: 0, vy: 0,
  w: 120, h: 50,
  angle: 0,
  targetVx: 0,
  targetVy: 0,
  get left() { return this.x - this.w / 2; },
  get top() { return this.y - this.h / 2; },
  get right() { return this.x + this.w / 2; },
  get bottom() { return this.y + this.h / 2; }
};

let mapCamera = { x: 0 };
const mapKeys = {};
let spaceJustPressed = false;

const ufoSprite = new Image();
ufoSprite.src = "public/sprites/UFO.png";

const cowSpriteSheet = new Image();
cowSpriteSheet.src = "public/sprites/cow.png";

const COW_WIDTH = 80;
const COW_HEIGHT = 80;
const COW_FRAME_COUNT = 9;
let cowFrameWidth = 0;
let cowFrameHeight = 0;
let cowSpriteLoaded = false;

cowSpriteSheet.onload = () => {
  cowFrameWidth = cowSpriteSheet.width / COW_FRAME_COUNT;
  cowFrameHeight = cowSpriteSheet.height;
  cowSpriteLoaded = true;
};

const ABDUCTION_SPEED = 150;
const BEAM_WIDTH = 50;
const BEAM_COLOR = "rgba(117, 251, 30, 0.63)";
const BEAM_GLOW_COLOR = "rgba(117, 251, 30, 0.2)";

const levelLengthInput = document.getElementById('levelLength');
const numPlatformsInput = document.getElementById('numPlatforms');
const numHolesInput = document.getElementById('numHoles');
const platformColorInput = document.getElementById('platformColor');
const dynamicInputsDiv = document.getElementById('dynamicInputs');
const generateBtn = document.getElementById('generateLevel');
const exportBtn = document.getElementById('exportJson');
const jsonUploadInput = document.getElementById('jsonUpload');
const numZonesInput = document.getElementById('numZones');
const dynamicZonesDiv = document.getElementById('dynamicZones');




function createDynamicInputs() {
  let html = '';
  const numP = parseInt(numPlatformsInput.value) || 0;
  const numH = parseInt(numHolesInput.value) || 0;

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

  dynamicInputsDiv.innerHTML = html;
}

function createZoneInputs() {
  let html = '';
  const numZ = parseInt(numZonesInput.value) || 0;

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

  dynamicZonesDiv.innerHTML = html;
}

numZonesInput.addEventListener('input', createZoneInputs);
createZoneInputs();

numPlatformsInput.addEventListener('input', createDynamicInputs);
numHolesInput.addEventListener('input', createDynamicInputs);
createDynamicInputs();

window.addEventListener("keydown", e => {
  if (e.key === " " || e.key === "Space") {
    e.preventDefault();
    if (!mapKeys[" "]) spaceJustPressed = true;
  }
  mapKeys[e.key] = true;
});

window.addEventListener("keyup", e => mapKeys[e.key] = false);


// MOUSE TRACKING
mapCanvas.addEventListener('mousemove', (e) => {
  const rect = mapCanvas.getBoundingClientRect();
  mapMouseX = e.clientX - rect.left + mapCamera.x;
  mapMouseY = e.clientY - rect.top;
});



function spawnCows() {
  cows = [];
  if (sharedLevelData.groundSegments.length === 0) return;

  const numCows = 4 + Math.floor(Math.random() * 7);
  for (let i = 0; i < numCows; i++) {
    const seg = sharedLevelData.groundSegments[Math.floor(Math.random() * sharedLevelData.groundSegments.length)];
    if (seg.width < COW_WIDTH + 40) continue;

    const x = seg.x + 20 + Math.random() * (seg.width - COW_WIDTH - 40);
    cows.push({
      x: x + COW_WIDTH / 2,
      y: groundY - COW_HEIGHT / 2,
      state: "idle",
      frame: 0,
      animTime: 0
    });
  }
}

// JSON
jsonUploadInput.addEventListener('change', async (e) => {
  if (!e.target.files || !e.target.files[0]) return;
  
  try {
    const text = await e.target.files[0].text();
    const data = JSON.parse(text);
    
    if (data.platforms && Array.isArray(data.platforms)) {
      // PLATFORMS
      numPlatformsInput.value = data.platforms.length;
      
    if (data.zones && Array.isArray(data.zones)) {
            numZonesInput.value = data.zones.length;
          }

      // HOLES
      if (data.GroundSegments && Array.isArray(data.GroundSegments)) {
        const holes = [];
        let lastEnd = 0;
        data.GroundSegments.forEach((seg, i) => {
          if (seg.x > lastEnd) {
            holes.push({ start: lastEnd, end: seg.x });
          }
          lastEnd = seg.x + seg.width;
        });
        numHolesInput.value = holes.length;
      }
      
      createDynamicInputs();
      
      // PLATFORMS
      setTimeout(() => {
        document.querySelectorAll('.plat-x').forEach((el, i) => {
          if (data.platforms[i]) {
            el.value = data.platforms[i].x || 0;
            document.querySelectorAll('.plat-y')[i].value = data.platforms[i].y || 300;
            document.querySelectorAll('.plat-w')[i].value = data.platforms[i].w || data.platforms[i].width || 150;
            document.querySelectorAll('.plat-h')[i].value = data.platforms[i].h || data.platforms[i].height || 20;
          }
        });
        
        // HOLES
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
        

        // ZONES
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

        generateBtn.click();
      }, 50);
      
    } else {
      alert("Invalid JSON format. Please provide a JSON with 'platforms' array.");
    }
  } catch (err) {
    alert("Error parsing uploaded file: " + err.message);
  }
});

generateBtn.onclick = () => {
  sharedLevelData.levelLength = Math.max(1000, parseInt(levelLengthInput.value) || 10000);
  platformColor = platformColorInput.value;

  sharedLevelData.platforms = [];
  document.querySelectorAll('.plat-x').forEach((el, i) => {
    sharedLevelData.platforms.push({
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

  sharedLevelData.groundSegments = [];
  let currentX = 0;
  for (let hole of holes) {
    if (hole.start > currentX) {
      sharedLevelData.groundSegments.push({
        x: currentX,
        y: groundY,
        width: hole.start - currentX,
        height: groundHeight
      });
    }
    currentX = Math.max(currentX, hole.end);
  }
  if (currentX < sharedLevelData.levelLength) {
    sharedLevelData.groundSegments.push({
      x: currentX,
      y: groundY,
      width: sharedLevelData.levelLength - currentX,
      height: groundHeight
    });
  }



// GENERATE ZONES
  sharedLevelData.zones = [];
  document.querySelectorAll('.zone-start').forEach((el, i) => {
    const start = parseFloat(el.value) || 0;
    const end = parseFloat(document.querySelectorAll('.zone-end')[i].value) || 500;
    const color = document.querySelectorAll('.zone-color')[i].value || '#ff6b6b';
    const label = document.querySelectorAll('.zone-label')[i].value || `Zone ${i + 1}`;
    
    if (start < end) {
      sharedLevelData.zones.push({ start, end, color, label });
    }
  });




  ufo.x = 100;
  ufo.y = mapCanvas.height / 2;
  mapCamera.x = 0;
  spawnCows();
};

exportBtn.onclick = () => {
const data = {
    GroundSegments: sharedLevelData.groundSegments,
    platforms: sharedLevelData.platforms.map(p => ({
      x: p.x, y: p.y, w: p.w, h: p.h
    })),
    zones: sharedLevelData.zones
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'GeometryKittyLevel.json';
  a.click();
  URL.revokeObjectURL(url);
};

function updateMap() {
  const dt = 1/60;
  const speed = 350;

  ufo.vx = ufo.vy = 0;
  if (mapKeys.a || mapKeys.A || mapKeys.ArrowLeft) ufo.vx = -speed;
  if (mapKeys.d || mapKeys.D || mapKeys.ArrowRight) ufo.vx = speed;
  if (mapKeys.w || mapKeys.W || mapKeys.ArrowUp) ufo.vy = -speed;
  if (mapKeys.s || mapKeys.S || mapKeys.ArrowDown) ufo.vy = speed;

  ufo.x += ufo.vx * dt;
  ufo.y += ufo.vy * dt;

  ufo.x = Math.max(ufo.w / 2, Math.min(sharedLevelData.levelLength - ufo.w / 2, ufo.x));
  ufo.y = Math.max(ufo.h / 2, Math.min(mapCanvas.height - ufo.h / 2, ufo.y));

  if (spaceJustPressed) {
    spaceJustPressed = false;
    
    for (let cow of cows) {
      if (cow.state === "abducting") continue;

      const dx = Math.abs(ufo.x - cow.x);
      const dy = ufo.bottom - cow.y;

      if (dx < 20 && dy < 10 && dy > -400) {
        cow.state = "abducting";
        cow.animTime = 0;
        cow.frame = 1;
        break;
      }
    }
  }

  cows = cows.filter(cow => {
    if (cow.state === "abducting") {
      cow.animTime += dt;
      if (cow.animTime >= 0.08) {
        cow.animTime = 0;
        cow.frame = cow.frame >= 8 ? 1 : cow.frame + 1;
      }

      cow.y -= ABDUCTION_SPEED * dt;

      if (cow.y <= ufo.y + 30) return false;
    }
    return true;
  });

  const targetCameraX = ufo.x - mapCanvas.width / 3;
  mapCamera.x += (targetCameraX - mapCamera.x) * 0.12;
  mapCamera.x = Math.max(0, Math.min(sharedLevelData.levelLength - mapCanvas.width, mapCamera.x));
}

function drawMap() {
  mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
  mapCtx.save();
  mapCtx.translate(-mapCamera.x, 0);

// DRAW ZONES IN BG
  sharedLevelData.zones.forEach(zone => {
    mapCtx.fillStyle = zone.color + '4D'; 
    mapCtx.fillRect(zone.start, 0, zone.end - zone.start, mapCanvas.height);
    
    //DRAW ZONE LABEL
    mapCtx.fillStyle = zone.color;
    mapCtx.font = "bold 16px Orbitron";
    mapCtx.fillText(zone.label, zone.start + 10, 30);
  });

  if (window.gridSettings && window.gridSettings.enabled) {
    const gridSize = window.gridSettings.size;
    mapCtx.strokeStyle = 'rgba(103, 254, 189, 0.2)';
    mapCtx.lineWidth = 1;
    
    const startX = Math.floor(mapCamera.x / gridSize) * gridSize;
    const endX = mapCamera.x + mapCanvas.width;
    
    for (let x = startX; x < endX; x += gridSize) {
      mapCtx.beginPath();
      mapCtx.moveTo(x, 0);
      mapCtx.lineTo(x, mapCanvas.height);
      mapCtx.stroke();
    }
    
    for (let y = 0; y < mapCanvas.height; y += gridSize) {
      mapCtx.beginPath();
      mapCtx.moveTo(mapCamera.x, y);
      mapCtx.lineTo(endX, y);
      mapCtx.stroke();
    }
  }


  // GRASS
  sharedLevelData.groundSegments.forEach(seg => {
    const gradient = mapCtx.createLinearGradient(0, seg.y, 0, seg.y + seg.height);
    gradient.addColorStop(0, '#2d5016');
    gradient.addColorStop(1, '#1a2f0d');
    mapCtx.fillStyle = gradient;
    mapCtx.fillRect(seg.x, seg.y, seg.width, seg.height);

    mapCtx.fillStyle = '#3d6020';
    const grassDensity = Math.ceil(seg.width / 100);
    for (let i = 0; i < grassDensity; i++) {
      const x = seg.x + (i / grassDensity) * seg.width;
      mapCtx.fillRect(x, seg.y + 10, 30, 5);
      mapCtx.fillRect(x + 20, seg.y + 30, 40, 3);
    }
  });

  sharedLevelData.platforms.forEach(p => {
    mapCtx.fillStyle = platformColor;
    mapCtx.fillRect(p.x, p.y, p.w, p.h);
  });

  cows.forEach(cow => {
    const drawX = cow.x - COW_WIDTH / 2;
    const drawY = cow.y - COW_HEIGHT / 2;

    if (cow.state === "abducting") {
      const beamTop = ufo.y + ufo.h / 2;
      const beamHeight = cow.y - beamTop + 30;

      mapCtx.fillStyle = BEAM_GLOW_COLOR;
      mapCtx.fillRect(cow.x - BEAM_WIDTH * 0.8, beamTop - 10, BEAM_WIDTH * 1.6, beamHeight + 20);

      mapCtx.fillStyle = BEAM_COLOR;
      mapCtx.fillRect(cow.x - BEAM_WIDTH / 2, beamTop, BEAM_WIDTH, beamHeight);
    }

    const frameToUse = cow.state === "idle" ? 0 : cow.frame;

    if (cowSpriteLoaded && cowFrameWidth > 0) {
      mapCtx.drawImage(
        cowSpriteSheet,
        frameToUse * cowFrameWidth, 0,
        cowFrameWidth, cowFrameHeight,
        drawX, drawY,
        COW_WIDTH, COW_HEIGHT
      );
    } else {
      mapCtx.fillStyle = cow.state === "idle" ? "#FFB6C1" : "#FF69B4";
      mapCtx.fillRect(drawX, drawY, COW_WIDTH, COW_HEIGHT);
    }
  });

  const ufoDrawX = ufo.x - ufo.w / 2;
  const ufoDrawY = ufo.y - ufo.h / 2;
  if (ufoSprite.complete) {
    mapCtx.drawImage(ufoSprite, ufoDrawX, ufoDrawY, ufo.w, ufo.h);
  } else {
    mapCtx.fillStyle = "#67FEBD";
    mapCtx.fillRect(ufoDrawX, ufoDrawY, ufo.w, ufo.h);
  }

  mapCtx.restore();

  mapCtx.fillStyle = "rgba(0, 255, 255, 0.9)";
  mapCtx.font = "16px Orbitron";
  mapCtx.fillText(`UFO: X:${Math.round(ufo.x)} Y:${Math.round(ufo.y)}`, 10, 25);
  mapCtx.fillText(`Cows: ${cows.length}`, 10, 50);

  // MOUSE COORDINATES
  if (window.coordsSettings && window.coordsSettings.enabled) {
    mapCtx.fillStyle = "rgba(220, 76, 232, 0.9)";
    mapCtx.font = "14px Orbitron";
    mapCtx.fillText(`Mouse: X:${Math.round(mapMouseX)} Y:${Math.round(mapMouseY)}`, 10, 75);
  }

}

// ============================================ TAB 2: PHYSICS TESTER ============================================
const physicsCanvas = document.getElementById("physicsCanvas");
const physicsCtx = physicsCanvas.getContext("2d");

const physicsGroundY = 440;

let showStandingArc = true;
let showMovingArc = true;
let showRecordedArc = true;

let jumpTrail = []; // FOR JUMP ARC
const MAX_TRAIL_POINTS = 120;
let previewJumpDir = 0; 

let player = {
  x: 50,
  y: physicsGroundY - 108,
  vx: 0,
  vy: 0,
  w: 150,
  h: 108,
  onGround: false
};

const HITBOX_WIDTH_RATIO = 0.65; // HITBOX 65% OF WIDTH
const HITBOX_OFFSET_X = 0.15; // HITBOX OFFSET

let physicsCamera = { x: 0 };
const physicsKeys = {};

window.addEventListener("keydown", e => { // FOR PREDICTIVE JUMP ARC
  if (e.key === "m" || e.key === "M") previewJumpDir = 1;
  if (e.key === "n" || e.key === "N") previewJumpDir = -1;
});

window.addEventListener("keyup", e => {
  if (
    e.key === "m" || e.key === "M" ||
    e.key === "n" || e.key === "N"
  ) {
    previewJumpDir = 0;
  }
});


const catSpriteSheet = new Image();
catSpriteSheet.src = "public/sprites/cat.png";

const CAT_FRAME_COUNT = 10;
let catFrameWidth = 0;
let catFrameHeight = 0;
let catSpriteLoaded = false;
let catWalkFrame = 2; // START AT FRAME 3
let catAnimTime = 0;

catSpriteSheet.onload = () => {
  catFrameWidth = catSpriteSheet.width / CAT_FRAME_COUNT;
  catFrameHeight = catSpriteSheet.height;
  catSpriteLoaded = true;
};

const gravityInput = document.getElementById('gravity');
const jumpForceInput = document.getElementById('jumpForce');
const speedInput = document.getElementById('speed');
const spriteWInput = document.getElementById('spriteW');
const spriteHInput = document.getElementById('spriteH');
const loadPhysicsBtn = document.getElementById('loadPhysics');
const resetPlayerBtn = document.getElementById('resetPlayer');

window.addEventListener("keydown", e => {
  physicsKeys[e.key] = true;
  if (e.key === "r" || e.key === "R") resetPlayerPosition();
  if (e.key === " ") e.preventDefault();
});

window.addEventListener("keyup", e => physicsKeys[e.key] = false);

// MOUSE TRACKING
physicsCanvas.addEventListener('mousemove', (e) => {
  const rect = physicsCanvas.getBoundingClientRect();
  physicsMouseX = e.clientX - rect.left + physicsCamera.x;
  physicsMouseY = e.clientY - rect.top;
});

function resetPlayerPosition() {
  player.x = 50;
  player.y = physicsGroundY - player.h;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  physicsCamera.x = 0;
}

loadPhysicsBtn.onclick = () => {
  player.w = Math.max(1, Math.min(200, Number(spriteWInput.value) || 150));
  player.h = Math.max(1, Math.min(200, Number(spriteHInput.value) || 108));
  resetPlayerPosition();
};

resetPlayerBtn.onclick = () => resetPlayerPosition();

function getPhysicsConfig() {
  return {
    gravity: Math.max(0.1, Number(gravityInput.value) || 1600),
    jumpForce: Math.max(1, Number(jumpForceInput.value) || 780),
    speed: Math.max(1, Number(speedInput.value) || 250)
  };
}

function collide(a, b) {
  const hitboxW = a.w * HITBOX_WIDTH_RATIO;
  const hitboxX = a.x + (a.w * HITBOX_OFFSET_X);
  
  return (
    hitboxX < b.x + b.w &&
    hitboxX + hitboxW > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function updatePhysics() {
  const cfg = getPhysicsConfig();
  const dt = 1/60;

  player.vx = 0;
  if (physicsKeys.a || physicsKeys.A || physicsKeys.ArrowLeft) player.vx = -cfg.speed;
  if (physicsKeys.d || physicsKeys.D || physicsKeys.ArrowRight) player.vx = cfg.speed;

  if ((physicsKeys[" "] || physicsKeys.w || physicsKeys.W || physicsKeys.ArrowUp) && player.onGround) {
    player.vy = -cfg.jumpForce;
    player.onGround = false;
  }

  player.vy += cfg.gravity * dt;
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  player.onGround = false;

  if (player.y + player.h >= physicsGroundY) {
    player.y = physicsGroundY - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  for (let p of sharedLevelData.platforms) {
    if (collide(player, p) && player.vy > 0 && player.y + player.h - player.vy <= p.y) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }

  // CAT WALK
  if (player.onGround && (player.vx !== 0)) {
    catAnimTime += dt;
    if (catAnimTime >= 0.1) { // ANIMATION SPEED
      catAnimTime = 0;
      catWalkFrame++;
      if (catWalkFrame > 9) catWalkFrame = 2; 
    }
  } else if (player.onGround) {
    catWalkFrame = 2; 
    catAnimTime = 0;
  }


  const targetCameraX = player.x - physicsCanvas.width / 3;
  physicsCamera.x += (targetCameraX - physicsCamera.x) * 0.1;
  physicsCamera.x = Math.max(0, physicsCamera.x);


  // RECORD JUMP ARC
  if (!player.onGround) {
    jumpTrail.push({
      x: player.x + player.w / 2,
      y: player.y + player.h
    });

    if (jumpTrail.length > MAX_TRAIL_POINTS) {
      jumpTrail.shift();
    }
  }

  // CLEAR TRAIL WHEN LANDING
  if (player.onGround && jumpTrail.length > 0) {
    jumpTrail = [];
  }


}


function predictJumpArc(cfg, forcedVx = null) {
  const points = [];

  let x = player.x + player.w / 2;
  let y = player.y + player.h;

  let vx = forcedVx !== null ? forcedVx : player.vx;
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

    //  STOP AT GROUND
    if (y >= physicsGroundY) {
      landing = { x, y: physicsGroundY };
      break;
    }

    // STOP  AT PLATFORM
    for (let p of sharedLevelData.platforms) {
      if (
        x > p.x &&
        x < p.x + p.w &&
        y >= p.y &&
        y <= p.y + p.h
      ) {
        landing = { x, y: p.y };
        return { points, apex, landing };
      }
    }

    points.push({ x, y });
  }

  return { points, apex, landing };
}

function drawRecordedArc() { // PINK JUMP ARC - TRACER ARC
  if (jumpTrail.length > 1) {
    physicsCtx.strokeStyle = "rgba(220, 76, 232, 0.6)";
    physicsCtx.lineWidth = 2;
    physicsCtx.beginPath();

    jumpTrail.forEach((p, i) => {
      if (i === 0) physicsCtx.moveTo(p.x, p.y);
      else physicsCtx.lineTo(p.x, p.y);
    });

    physicsCtx.stroke();

    physicsCtx.fillStyle = "rgba(255, 199, 255, 1)";
    jumpTrail.forEach(p => {
      physicsCtx.beginPath();
      physicsCtx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      physicsCtx.fill();
    });
  }
}

function drawStandingPredictionArc(){ // PURPLE JUMP ARC - PREDICT WHAT ARC WOULD BE AS IF PLAYER WERE MOVING
  if ( 
      player.onGround &&
      player.vx === 0 &&
      previewJumpDir !== 0
    ) {
      const cfg = getPhysicsConfig(); 
      const fakeVx = previewJumpDir * cfg.speed;
      const arc = predictJumpArc(cfg, fakeVx);

      // ARC LINE
      physicsCtx.strokeStyle = "rgb(131, 12, 222)";
      physicsCtx.lineWidth = 2;
      physicsCtx.beginPath();
      arc.points.forEach((p, i) => {
        if (i === 0) physicsCtx.moveTo(p.x, p.y);
        else physicsCtx.lineTo(p.x, p.y);
      });
      physicsCtx.stroke();

      // DOTS
      physicsCtx.fillStyle = "rgb(165, 90, 255)";
      arc.points.forEach(p => {
        physicsCtx.beginPath();
        physicsCtx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        physicsCtx.fill();
      });

      // APEX MARKER
      physicsCtx.fillStyle = "rgb(255, 120, 255)";
      physicsCtx.beginPath();
      physicsCtx.arc(arc.apex.x, arc.apex.y, 5, 0, Math.PI * 2);
      physicsCtx.fill();

      // LANDING MARKER
      if (arc.landing) {
        physicsCtx.fillStyle = "rgb(180, 120, 255)";
        physicsCtx.beginPath();
        physicsCtx.arc(arc.landing.x, arc.landing.y, 5, 0, Math.PI * 2);
        physicsCtx.fill();
      }

      // LABELS
      physicsCtx.font = "12px Orbitron";
      physicsCtx.fillStyle = "rgba(220, 200, 255, 0.95)";

      physicsCtx.fillText(
        `Apex X: ${Math.round(arc.apex.x)}`,
        arc.apex.x + 8,
        arc.apex.y - 18
      );
      physicsCtx.fillText(
        `Apex Y: ${Math.round(arc.apex.y)}`,
        arc.apex.x + 8,
        arc.apex.y - 6
      );

      if (arc.landing) {
        physicsCtx.fillText(
          `Land X: ${Math.round(arc.landing.x)}`,
          arc.landing.x - 40,
          arc.landing.y + 20
        );
        physicsCtx.fillText(
          `Land Y: ${Math.round(arc.landing.y)}`,
          arc.landing.x - 40,
          arc.landing.y + 34
        );
      }
    }
}
  
function drawMovingPredictionArc(){ // AQUA JUMP ARC - IN-MOTION PREDICT
    if (player.onGround) { 
      const cfg = getPhysicsConfig();
      const arcData = predictJumpArc(cfg);
      const startX = player.x + player.w / 2;
      const startY = player.y + player.h;

      // ARC LINE
      physicsCtx.strokeStyle = "rgba(103, 254, 189, 0.8)";
      physicsCtx.lineWidth = 2;
      physicsCtx.beginPath();
      arcData.points.forEach((p, i) => {
        if (i === 0) physicsCtx.moveTo(p.x, p.y);
        else physicsCtx.lineTo(p.x, p.y);
      });
      physicsCtx.stroke();

      // APEX MARKER
      physicsCtx.fillStyle = "#dc4ce8";
      physicsCtx.beginPath();
      physicsCtx.arc(arcData.apex.x, arcData.apex.y, 5, 0, Math.PI * 2);
      physicsCtx.fill();

      // MAX X MARKER
      physicsCtx.fillStyle = "#67FEBD";
      physicsCtx.beginPath();
      physicsCtx.arc(arcData.maxX, physicsGroundY, 5, 0, Math.PI * 2);
      physicsCtx.fill();

      // GUIDE LINES
      physicsCtx.setLineDash([6, 6]);
      physicsCtx.strokeStyle = "rgba(220, 76, 232, 0.6)";
      physicsCtx.lineWidth = 1;

      // HEIGHT
      physicsCtx.beginPath();
      physicsCtx.moveTo(startX, startY);
      physicsCtx.lineTo(startX, arcData.apex.y);
      physicsCtx.stroke();

      // DISTANCE
      physicsCtx.beginPath();
      physicsCtx.moveTo(startX, physicsGroundY);
      physicsCtx.lineTo(arcData.maxX, physicsGroundY);
      physicsCtx.stroke();

      physicsCtx.setLineDash([]);

      // LABELS
      physicsCtx.fillStyle = "rgba(220, 76, 232, 0.9)";
      physicsCtx.font = "12px Orbitron";
      physicsCtx.fillText(
        `Apex Y: ${Math.round(arcData.apex.y)} px`,
        arcData.apex.x + 8,
        arcData.apex.y - 8
      );


      physicsCtx.fillText(
        `Max Distance: ${Math.round(Math.abs(arcData.maxX - startX))} px`,
        arcData.maxX - 40,
        physicsGroundY + 20
      );
    }
}



function drawPhysics() {
  physicsCtx.clearRect(0, 0, physicsCanvas.width, physicsCanvas.height);

  physicsCtx.save();
  physicsCtx.translate(-physicsCamera.x, 0);

   // DRAW ZONES IN BG
  sharedLevelData.zones.forEach(zone => {
    physicsCtx.fillStyle = zone.color + '4D'; 
    physicsCtx.fillRect(zone.start, 0, zone.end - zone.start, physicsCanvas.height);
    
    // DRAW ZONE LABEL
    physicsCtx.fillStyle = zone.color;
    physicsCtx.font = "bold 16px Orbitron";
    physicsCtx.fillText(zone.label, zone.start + 10, 30);
  });

  const cfg = getPhysicsConfig();
    // GRID
  if (window.gridSettings && window.gridSettings.enabled) {
    const gridSize = window.gridSettings.size;
    physicsCtx.strokeStyle = 'rgba(103, 254, 189, 0.2)';
    physicsCtx.lineWidth = 1;
    
    const startX = Math.floor(physicsCamera.x / gridSize) * gridSize;
    const endX = physicsCamera.x + physicsCanvas.width;
    
    for (let x = startX; x < endX; x += gridSize) {
      physicsCtx.beginPath();
      physicsCtx.moveTo(x, 0);
      physicsCtx.lineTo(x, physicsCanvas.height);
      physicsCtx.stroke();
    }
    
    for (let y = 0; y < physicsCanvas.height; y += gridSize) {
      physicsCtx.beginPath();
      physicsCtx.moveTo(physicsCamera.x, y);
      physicsCtx.lineTo(endX, y);
      physicsCtx.stroke();
    }
  }


  // DANGER ZONES - AKA WHERE THE HOLE ARE
    const visibleStart = physicsCamera.x;
    const visibleEnd = physicsCamera.x + physicsCanvas.width;
    
    // MAKE ENTIRE GROUND RED FIRST
    const dangerGradient = physicsCtx.createLinearGradient(0, physicsGroundY, 0, physicsCanvas.height);
    dangerGradient.addColorStop(0, '#8B0000');
    dangerGradient.addColorStop(1, '#4B0000');
    physicsCtx.fillStyle = dangerGradient;
    physicsCtx.fillRect(visibleStart, physicsGroundY, visibleEnd - visibleStart, physicsCanvas.height - physicsGroundY);

    // GRASS - DRAW ONLY WHERE THERE AREN'T HOLES
    sharedLevelData.groundSegments.forEach(seg => {
      const gradient = physicsCtx.createLinearGradient(0, seg.y, 0, seg.y + seg.height);
      gradient.addColorStop(0, '#2d5016');
      gradient.addColorStop(1, '#1a2f0d');
      physicsCtx.fillStyle = gradient;
      physicsCtx.fillRect(seg.x, seg.y, seg.width, seg.height);

      physicsCtx.fillStyle = '#3d6020';
      const grassDensity = Math.ceil(seg.width / 100);
      for (let i = 0; i < grassDensity; i++) {
        const x = seg.x + (i / grassDensity) * seg.width;
        physicsCtx.fillRect(x, seg.y + 10, 30, 5);
        physicsCtx.fillRect(x + 20, seg.y + 30, 40, 3);
      }
    });




  sharedLevelData.platforms.forEach(p => {
    physicsCtx.fillStyle = "#dc4ce8";
    physicsCtx.fillRect(p.x, p.y, p.w, p.h);
  });


    // CAT
  let frameToUse = 0; 
  if (!player.onGround) {
    frameToUse = 1; 
  } else if (player.vx !== 0) {
    frameToUse = catWalkFrame; 
  }

  if (catSpriteLoaded && catFrameWidth > 0) {
    if (player.vx < 0) {
      physicsCtx.save();
      physicsCtx.scale(-1, 1);
      physicsCtx.drawImage(
        catSpriteSheet,
        frameToUse * catFrameWidth, 0,
        catFrameWidth, catFrameHeight,
        -player.x - player.w, player.y,
        player.w, player.h
      );
      physicsCtx.restore();
    } else {
      physicsCtx.drawImage(
        catSpriteSheet,
        frameToUse * catFrameWidth, 0,
        catFrameWidth, catFrameHeight,
        player.x, player.y,
        player.w, player.h
      );
    }
  } else {
    physicsCtx.fillStyle = "#67FEBD";
    physicsCtx.fillRect(player.x, player.y, player.w, player.h);
  }


  if (window.arcSettings && window.arcSettings.showStanding) {
    drawStandingPredictionArc();
  }

  if (window.arcSettings && window.arcSettings.showMoving) {
    drawMovingPredictionArc();
  }

  if (window.arcSettings && window.arcSettings.showRecorded) {
    drawRecordedArc();
  }


    

  physicsCtx.restore(); // END CAMERA TRANSFORM

  physicsCtx.fillStyle = "rgba(0, 255, 255, 0.8)";
  physicsCtx.font = "14px Orbitron";
  physicsCtx.fillText(`Position: ${Math.round(player.x)} px`, 10, 20);
  physicsCtx.fillText(`Platforms: ${sharedLevelData.platforms.length}`, 10, 40);

  // MOUSE COORDINATES
  if (window.coordsSettings && window.coordsSettings.enabled) {
    physicsCtx.fillStyle = "rgba(220, 76, 232, 0.9)";
    physicsCtx.font = "14px Orbitron";
    physicsCtx.fillText(`Mouse: X:${Math.round(physicsMouseX)} Y:${Math.round(physicsMouseY)}`, 10, 60);
  }

}

// ============================================MAIN LOOP ============================================
function loop() {
  const activeTab = document.querySelector('.tab-content.active');
  
  if (activeTab.id === 'mapTab') {
    updateMap();
    drawMap();
  } else if (activeTab.id === 'physicsTab') {
    updatePhysics();
    drawPhysics();
  }
  
  requestAnimationFrame(loop);
}

// INITIALIZE
generateBtn.click();
loop();