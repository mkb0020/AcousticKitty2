// LEVEL DATA
export const levelData = {
  platforms: [],
  groundSegments: [],
  levelLength: 15000,
  zones: [],
  notes: ''
};

export function updateLevelData(newData) {
  Object.assign(levelData, newData);
}

export function resetLevelData() {
  levelData.platforms = [];
  levelData.groundSegments = [];
  levelData.levelLength = 15000;
  levelData.zones = [];
  levelData.notes = '';
}