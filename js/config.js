// 組別清單：之後要新增/改名組別，改這裡就好
export const GROUPS = ['1', '2', '3', '4', '5', '6'];

// 濃度與液體量的合格範圍：之後要調整標準，改這裡就好
export const THRESHOLDS = {
  concentration: { min: 1.15, max: 1.45 }, // 單位：%
  liquidWeight: { min: 180, max: 220 },    // 單位：g
};

// 粉重下拉選單選項：之後要增減選項，改這裡就好
export const DOSE_OPTIONS = [15, 18, 20];

// 手沖表單各欄位的預設值
export const FIELD_DEFAULTS = {
  doseWeight: 20,
  waterTemp: 92,
  brewMinutes: 2,
  brewSeconds: 30,
  grindSize: 5.0,
  concentration: 1.3,
};

// 注水量／液體量的預設值都是依粉重比例換算，粉重改變時會重新計算
export function computeWaterWeight(doseWeight) {
  return Math.round(doseWeight * 15);
}

export function computeLiquidWeight(doseWeight) {
  return Math.round(doseWeight * 13);
}

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
