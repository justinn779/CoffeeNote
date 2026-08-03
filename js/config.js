// 組別清單：之後要新增/改名組別，改這裡就好
export const GROUPS = ['1', '2', '3', '4', '5', '6'];

// 濃度與液體量的合格範圍：之後要調整標準，改這裡就好
export const THRESHOLDS = {
  concentration: { min: 1.15, max: 1.45 }, // 單位：%
  liquidWeight: { min: 180, max: 220 },    // 單位：g
};

export function evaluatePass(concentration, liquidWeight) {
  const passConcentration =
    typeof concentration === 'number' &&
    !Number.isNaN(concentration) &&
    concentration >= THRESHOLDS.concentration.min &&
    concentration <= THRESHOLDS.concentration.max;

  const passLiquid =
    typeof liquidWeight === 'number' &&
    !Number.isNaN(liquidWeight) &&
    liquidWeight >= THRESHOLDS.liquidWeight.min &&
    liquidWeight <= THRESHOLDS.liquidWeight.max;

  return {
    passConcentration,
    passLiquid,
    passOverall: passConcentration && passLiquid,
  };
}
