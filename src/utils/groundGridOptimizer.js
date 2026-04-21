export const calculateGrid = (params) => {
  const {
    soilResistivity: ρ,
    gridLength,
    gridWidth,
    numParallel,
    numRods,
    rodLength,
    gridDepth,
    faultDuration,
    surfaceLayer = 3000,
    surfaceDepth = 0.1,
    currentDivisionFactor = 0.6,
    transformerKVA = 1000,
    secondaryVoltage = 480,
    transformerImpedance = 5
  } = params;

  const A = gridLength * gridWidth;
  const perimeter = 2 * (gridLength + gridWidth);

  const totalGridLength = perimeter * numParallel;
  const totalRodLength = numRods * rodLength;
  const LT = totalGridLength + totalRodLength;

  const In = (transformerKVA * 1000) / (Math.sqrt(3) * secondaryVoltage);
  const faultCurrent = In / (transformerImpedance / 100);
  const Ig = faultCurrent * currentDivisionFactor;

  const h = gridDepth;

  const Rg = ρ * (1 / LT + 1 / Math.sqrt(20 * A));

  const Cs = 1 - (0.09 * (1 - ρ / surfaceLayer)) / (2 * surfaceDepth + 0.09);
  const Etouch = (1000 + 1.5 * Cs * surfaceLayer) * (0.157 / Math.sqrt(faultDuration));
  const Estep = (1000 + 6 * Cs * surfaceLayer) * (0.157 / Math.sqrt(faultDuration));

  const Em = (ρ * Ig) / LT;
  const Es = (ρ * Ig) / (0.75 * totalGridLength + totalRodLength);

  const cost = totalGridLength * 3.5 + numRods * 25;

  return {
    Rg,
    Em,
    Es,
    Etouch,
    Estep,
    cost,
    complies: Em <= Etouch && Es <= Estep
  };
};


// 🔥 OPTIMIZADOR
export const optimizeGroundGrid = (params) => {
  let best = null;
  const solutions = [];

  for (let spacing = 3; spacing <= 10; spacing += 1) {
    for (let rods = 10; rods <= 80; rods += 5) {

      const nx = Math.floor(params.gridLength / spacing);
      const ny = Math.floor(params.gridWidth / spacing);

      const result = calculateGrid({
        ...params,
        numParallel: nx,
        numRods: rods
      });

      if (result.complies) {
        const solution = {
          ...result,
          spacing,
          rods,
          nx,
          ny
        };

        solutions.push(solution);

        if (!best || solution.cost < best.cost) {
          best = solution;
        }
      }
    }
  }

  return {
    best,
    solutions
  };
};


// ⚠️ PEOR CASO
export const worstCaseAnalysis = (params) => {
  const worstParams = {
    ...params,
    soilResistivity: Math.max(params.soilResistivity, 300)
  };

  return calculateGrid(worstParams);
};