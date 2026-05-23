// test_simulation.js

function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

function variance(arr, isSample = true) {
  if (arr.length <= 1) return 0;
  const avg = mean(arr);
  const sumSqDiff = arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0);
  return sumSqDiff / (arr.length - (isSample ? 1 : 0));
}

function stdDevLocal(arr, isSample = true) {
  return Math.sqrt(variance(arr, isSample));
}

function randomNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function generateCorrelatedNormals(L) {
  const n = L.length;
  const Z = Array(n).fill(0).map(() => randomNormal());
  const X = Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j <= i; j++) {
      sum += L[i][j] * Z[j];
    }
    X[i] = sum;
  }

  return X;
}

const assets = [
  { ticker: 'SPY', weight: 40 },
  { ticker: 'QQQ', weight: 30 },
  { ticker: 'TLT', weight: 20 },
  { ticker: 'BTC-USD', weight: 10 }
];

const expectedReturns = [0.10, 0.15, 0.05, 0.60];
const volatilities = [0.15, 0.20, 0.12, 0.70];

// Wait! Look at L. In the Cholesky factor matrix L, the diagonals are NOT equal to volatility
// if L is the Cholesky factor of the covariance matrix.
// If the covariance matrix is cov[i][j], then cov[i][i] is variance_i = volatility_i^2.
// So L[i][i] for independent assets is volatility_i (since L * L^T = cov, so L[i][i]^2 = cov[i][i] = volatility_i^2).
// Thus, L diagonal should indeed be volatilities.
const L = [
  [0.15, 0, 0, 0],
  [0, 0.20, 0, 0],
  [0, 0, 0.12, 0],
  [0, 0, 0, 0.70]
];

const initialInvestment = 10000;
const horizonYears = 10;
const simulationsCount = 5000;
const targetWeights = assets.map(a => a.weight / 100);

const finalValues = [];
const numDaysPerYear = 252;
const totalSteps = horizonYears * numDaysPerYear;
const dt = 1 / numDaysPerYear;
const sqrtDt = Math.sqrt(dt);

for (let s = 0; s < simulationsCount; s++) {
  let portfolioValue = initialInvestment;
  let assetValues = targetWeights.map(w => initialInvestment * w);

  for (let step = 1; step <= totalSteps; step++) {
    const correlatedNormals = generateCorrelatedNormals(L);
    const dailyAssetReturns = assets.map((_, i) => {
      const mu = expectedReturns[i];
      const sigma = volatilities[i];
      const z = correlatedNormals[i];

      const drift = (mu - 0.5 * sigma * sigma) * dt;
      const diffusion = z * sqrtDt;
      return Math.exp(drift + diffusion) - 1;
    });

    portfolioValue = 0;
    for (let i = 0; i < assets.length; i++) {
      assetValues[i] = assetValues[i] * (1 + dailyAssetReturns[i]);
      portfolioValue += assetValues[i];
    }
  }

  finalValues.push(portfolioValue);
}

finalValues.sort((a, b) => a - b);
const lossCount = finalValues.filter(v => v < initialInvestment).length;
const probabilityOfLoss = lossCount / simulationsCount;

console.log('--- Simulation results ---');
console.log('Simulations run:', simulationsCount);
console.log('Initial Investment:', initialInvestment);
console.log('Min final value:', finalValues[0]);
console.log('P10 final value:', finalValues[Math.floor(simulationsCount * 0.1)]);
console.log('P50 final value:', finalValues[Math.floor(simulationsCount * 0.5)]);
console.log('P90 final value:', finalValues[Math.floor(simulationsCount * 0.9)]);
console.log('Max final value:', finalValues[finalValues.length - 1]);
console.log('Loss count:', lossCount);
console.log('Probability of loss:', (probabilityOfLoss * 100).toFixed(2) + '%');
