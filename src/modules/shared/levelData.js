// LEVEL DATA

export const levelData = {
  platforms: [],
  groundSegments: [],
  levelLength: 10000,
  zones: []
};

export function updateLevelData(newData) {
  Object.assign(levelData, newData);
}

export function resetLevelData() {
  levelData.platforms = [];
  levelData.groundSegments = [];
  levelData.levelLength = 10000;
  levelData.zones = [];
}