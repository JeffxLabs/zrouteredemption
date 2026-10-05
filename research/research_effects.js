// Non-numeric unlocks are absent from the older progression benefit rows.
// Super Soldiers (11023), also identified by icon_technology_soldierLevel10,
// unlocks T10 Soldier Training at research level 1. Other effects are taken
// directly from the localized per-level benefits; no missing values are guessed.
window.researchUpgradeEffect = function (tech, current = 0, target = 0) {
  const level = Math.min(tech.max_level, Math.max(current, target, 1));
  const unlocks = tech.id === 11023 && level >= 1 ? ['Unlocks T10 Soldier Training'] : [];
  const effects = [...(tech.levels.find(row => row.level === level)?.benefits || []), ...unlocks];
  return { level, effects, currentEffects: current > 0
    ? [...(tech.levels.find(row => row.level === current)?.benefits || []), ...(tech.id === 11023 ? unlocks : [])]
    : [] };
};
