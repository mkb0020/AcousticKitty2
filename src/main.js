// MAIN
import { MapPlanner } from './modules/mapPlanner/mapPlanner.js';
import { PhysicsTester } from './modules/physicsTester/physicsTester.js';

console.log("=== PLATFORMKITTY.JS LOADED ===");
console.log("Map Canvas:", document.getElementById("mapCanvas"));
console.log("Physics Canvas:", document.getElementById("physicsCanvas"));
console.log("Window loaded:", document.readyState);

let mapPlanner = null;
let physicsTester = null;
let activeTab = 'map';

// TAB SWITCH
const tabButtons = document.querySelectorAll('.tab-button');
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.dataset.tab;
    if (targetTab === 'PLACEHOLDER') return;
    activeTab = targetTab;
  });
});

// INITIALIZE WHEN DOM IS READY
function init() {
  console.log("Initializing...");
  
  try {
    mapPlanner = new MapPlanner('mapCanvas');
    console.log("MapPlanner initialized");
  } catch (e) {
    console.error("MapPlanner init failed:", e);
  }
  
  try {
    physicsTester = new PhysicsTester('physicsCanvas');
    console.log("PhysicsTester initialized");
  } catch (e) {
    console.error("PhysicsTester init failed:", e);
  }
  
p
  animate();
}

// ANIMATION LOOP
function animate() {
  requestAnimationFrame(animate);
  
  try {
    if (activeTab === 'map' && mapPlanner) {
      mapPlanner.update();
      mapPlanner.draw();
    } else if (activeTab === 'physics' && physicsTester) {
      physicsTester.update();
      physicsTester.draw();
    }
  } catch (e) {
    console.error("Animation loop error:", e);
  }
}

// WAIT FOR DOM TO BE READY
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

//  DEBUGGING 
window.mapPlanner = mapPlanner;
window.physicsTester = physicsTester;