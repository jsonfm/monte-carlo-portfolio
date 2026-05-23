# 📈 Modern Monte Carlo Portfolio Simulator

[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![GitHub Actions Pages](https://github.com/jsonfm/monte-carlo-portfolio/actions/workflows/deploy.yml/badge.svg)](https://github.com/jsonfm/monte-carlo-portfolio/actions/workflows/deploy.yml)

A professional, fully client-side **Quantitative Portfolio Designer, Historical Backtester, and Advanced Monte Carlo Simulation Engine**. Designed with modern finance frameworks, high-performance web-threading, and state-of-the-art stochastic models, this web application helps investors, quantitative analysts, and students model future asset returns, simulate realistic wealth accumulation schedules, and analyze portfolio tail risk with extreme responsiveness.

**Live demo:** [jsonfm.github.io/monte-carlo-portfolio](https://jsonfm.github.io/monte-carlo-portfolio/)

---

## 🌟 Key Features

*   **🛠️ Interactive Portfolio Designer:** Custom-design portfolios by adding assets with arbitrary tickers/names, custom categories (ETF, Stock, Bond, Crypto), and dynamic weight distributions. Includes interactive weight visualizers, total allocation validation (must sum to exactly 100%), and preloaded template presets.
*   **🎲 Advanced Stochastic Simulation Engines:**
    *   **Geometric Brownian Motion (GBM) with Correlation:** Annualizes daily asset drifts ($\mu$) and volatilities ($\sigma$), correlating returns across assets via **Cholesky Decomposition** of the historical covariance matrix.
    *   **GARCH(1,1) Volatility Clustering:** Extends standard GBM by modeling time-varying conditional variance. Captures realistic market "calm" and "panic" phases where large shocks lead to sustained high-volatility regimes.
    *   **Merton Jump-Diffusion (Black Swans):** Incorporates Poisson-distributed, randomized systemic shocks ("jumps") representing sudden crash events or flash crashes. Includes asset-class specific jump reactions (e.g., severe stock/crypto crashes paired with flight-to-safety bond gains) and a mathematical compensator to prevent drift bias.
    *   **Moving Block Bootstrap:** A non-parametric engine that samples contiguous historical daily return **blocks** (e.g., 10-day blocks). This preserves joint-asset covariance while naturally capturing momentum, short-term trends, and serial autocorrelation directly from market history.
*   **💰 Comprehensive Wealth Accumulation & Cash Flow Controls:**
    *   **Monthly Deposits & Withdrawals:** Model realistic, long-term accumulation plans (savings) or decumulation paths (retirement income distributions) processed on a monthly cycle.
    *   **Inflation-Adjusted Projections:** Toggle inflation discounting to view all future value percentiles in inflation-adjusted, real-purchasing-power dollars.
    *   **Capital Gains Taxes & Tax Drag:** Simulates realized capital gains tax liabilities on sold assets during periodic rebalances or withdrawals, tracking the cost basis of each asset. Toggle taxable vs. tax-sheltered accounts (0% tax drag).
    *   **Transaction Fees:** Model percentage-based brokerage commissions and trade fees that drag down growth during rebalances, deposits, and withdrawals.
*   **🔄 Dynamic Portfolio Rebalancing Simulator:** Run simulations with different rebalancing frequencies (None, Monthly, Annually) or dynamic **Tolerance Bands** (e.g., rebalance only when an asset's weight drifts by more than 5% absolute from its target allocation) to study how transaction friction and tax drag affect compound growth.
*   **📊 Institutional-Grade Performance & Risk Metrics:**
    *   **CAGR:** (Compound Annual Growth Rate) computed across the median path.
    *   **Sharpe Ratio:** Reward-to-volatility index (using a 0% baseline risk-free rate).
    *   **Sortino Ratio:** Downside-adjusted reward index utilizing downside semi-standard deviation.
    *   **Maximum Drawdown:** Peak-to-trough historical paper loss.
    *   **95% Value at Risk (VaR):** The worst-case capital loss threshold at a 95% confidence interval.
    *   **95% Conditional Value at Risk (CVaR / Expected Shortfall):** The average expected portfolio loss if outcomes land in the worst 5% tail.
*   **📈 Rich Interactive Charting (Recharts):**
    *   **Monte Carlo Projections:** Displays a clean statistical "cone" (10th percentile downside, 50th percentile median, 90th percentile upside), overlaid with 30 randomly selected simulated asset paths.
    *   **Historical Backtester:** Models historical portfolio growth alongside a customizable benchmark index (e.g., SPY, QQQ, IWM, BTC-USD) over the historical range.
    *   **Asset Allocation:** A beautiful, responsive Pie Chart visualizing portfolio composition.
*   **📂 Zero-Server Custom CSV Uploads:** Import arbitrary CSV pricing data on-the-fly. The client-side parser reads historical data seamlessly, allowing you to simulate custom, unlisted, or private assets.
*   **⚡ High-Performance Web Workers:** The intensive statistical simulation loop is executed entirely in a separate background thread via HTML5 ESM Web Workers. Computes thousands of years of simulated paths with full cash flow and tax histories in milliseconds without blocking the browser UI, ensuring a consistent 60 FPS.
*   **🌗 Adaptive Dark Mode & Tailwind v4 UI:** Beautiful, modern, dark-first UI optimized with Tailwind CSS v4, smooth Framer Motion transitions, responsive layouts, unified light/dark styling, and intuitive informational tooltips for all settings.

---

## 🔬 Mathematical Methodology

### 1. Geometric Brownian Motion (GBM) with Cholesky Correlation

To model asset prices under continuous-time assumptions, we model the spot price $S_t$ of each asset as following a stochastic differential equation (SDE):

$$dS_t = \mu S_t dt + \sigma S_t dW_t$$

In a discrete simulation step over interval $\Delta t$ (where $\Delta t = \frac{1}{252}$ for daily trading steps), the asset price is updated as:

$$S_{i, t+\Delta t} = S_{i, t} \exp \left( \left( \mu_i - \frac{1}{2}\sigma_i^2 \right) \Delta t + \sigma_i \sqrt{\Delta t} X_i \right)$$

Where:
*   $\mu_i$ is the annualized expected return (historical CAGR) of asset $i$.
*   $\sigma_i$ is the annualized volatility of asset $i$.
*   $X_i$ is a correlated standard normal variable.

#### Covariance and Cholesky Decomposition
To preserve historical cross-asset relationships, we compute the covariance matrix $\Sigma$ of daily asset returns. We perform a **Cholesky Decomposition** to factor the symmetric positive-definite covariance matrix:

$$\Sigma = L L^T$$

Where $L$ is a lower triangular matrix. To generate correlated normal variables $\mathbf{X}$, we generate a vector of independent standard normal random variables $\mathbf{Z} \sim \mathcal{N}(0, \mathbf{I})$ and multiply:

$$\mathbf{X} = L \mathbf{Z}$$

*Note: The math engine applies diagonal regularization ($10^{-8}$) to ensure strict positive-definiteness on highly correlated asset matrices.*

### 2. GARCH(1,1) Volatility Clustering

In reality, market volatility is time-varying and exhibits "volatility clustering" (quiet periods follow quiet periods, and high-volatility shocks trigger sustained high volatility). We implement a discrete GARCH(1,1) recurrence model:

$$h_t = \omega + \alpha \varepsilon_{t-1}^2 + \beta h_{t-1}$$

Where:
*   $h_t$ is the conditional daily variance of return on day $t$.
*   $\omega$ is the baseline variance constant, calibrated dynamically from historical annualized volatility:
    $$\omega = V_L \cdot (1 - \alpha - beta)$$
    where $V_L = \frac{\sigma^2}{252}$ is the daily unconditional historical variance, and we set standard financial coefficients $\alpha = 0.08$ and $\beta = 0.90$.
*   $\varepsilon_{t-1} = R_{t-1} - \mathbb{E}[R]$ is the return shock residual on the previous day.
*   $h_{t-1}$ is the prior day's conditional daily variance.

Under GARCH, the diffusion step is modeled using the time-varying daily volatility $\sqrt{h_t}$ instead of the static historical volatility $\sigma \sqrt{\Delta t}$.

### 3. Merton Jump-Diffusion (Black Swans)

To incorporate realistic tail risk and discontinuous "black swan" market crashes, we extend Geometric Brownian Motion by adding a Poisson-driven jump-diffusion process:

$$\frac{dS_t}{S_t} = (\mu - \lambda k) dt + \sigma dW_t + (Y_t - 1) dN_t$$

Where:
*   $\lambda$ is the jump intensity (expected number of shocks per year, set to 1.0).
*   $dN_t$ is a Poisson process ($dN_t = 1$ with probability $\lambda dt$, and $0$ otherwise).
*   $Y_t - 1$ is the random percentage jump size. The log-return of the jump follows a normal distribution:
    $$\ln(Y_t) \sim \mathcal{N}(\mu_J, \sigma_J^2)$$
    The model employs category-specific parameters to simulate realistic asset behaviors:
    *   **Bonds (Flight-to-Safety):** $\mu_J = +0.015$, $\sigma_J = 0.01$ (Bonds jump upward during market shocks).
    *   **Stocks / ETFs:** $\mu_J = -0.05$, $\sigma_J = 0.06$ (Equities crash during market shocks).
    *   **Cryptocurrency:** $\mu_J = -0.10$, $\sigma_J = 0.18$ (Crypto suffers severe capitulations).
*   $k = \mathbb{E}[Y_t - 1] = \exp\left(\mu_J + \frac{1}{2}\sigma_J^2\right) - 1$ is the expected relative jump size. Subtracting the Merton compensator term $\lambda k dt$ from the drift prevents the addition of jumps from biasing the long-term expected rate of return $\mu$.

### 4. Moving Block Bootstrap

Under the non-parametric **Historical Bootstrapping** model, we do not assume returns are normally distributed, which is critical for assets like Crypto with high skewness and kurtosis.

To avoid destroying short-term trends, momentum, and serial autocorrelation, we implement a **Moving Block Bootstrap**. Rather than sampling individual days independently:
1.  The engine divides the historical dataset into contiguous, overlapping blocks of size $b$ (default $b = 10$ trading days).
2.  The engine randomly selects a block starting day $s$ and samples $b$ consecutive daily returns:
    $$B = [\mathbf{R}_{s}, \mathbf{R}_{s+1}, \dots, \mathbf{R}_{s+b-1}]$$
3.  We sample the **entire row** (returns of all assets on the same day) simultaneously, perfectly preserving cross-asset covariance structures while capturing local autocorrelation and momentum.

### 5. Portfolio Rebalancing, Cash Flows, & Tax Cost Basis Tracking

The engine runs a full, step-by-step balance ledger for each simulated path, managing cash additions, withdrawals, fees, and capital gains taxes.

#### Cash Flows & Inflation Discounting
*   **Monthly Deposits ($C$) / Withdrawals ($W$):** Adjusted dynamically for compounding inflation over time:
    $$C_t = C_0 \cdot (1 + I)^{t}$$
    where $I$ is the annual inflation rate, and $t$ is the elapsed fraction of a year.
*   **Real purchasing power:** If inflation adjustment is enabled, final portfolio values and yearly snapshots are discounted back to "Year 0" real dollars:
    $$V_{\text{real}, t} = \frac{V_{\text{nominal}, t}}{(1 + I)^{t}}$$

#### Rebalancing and Realized Capital Gains Taxes
When a portfolio is rebalanced (either on a calendar schedule or when any asset's weight drifts beyond the absolute **Rebalancing Threshold** $\delta$ from its target), the engine simulates capital gains tax drag:
1.  **Sells are processed first:** For any asset $i$ whose current value exceeds its target value ($V_i > V_{\text{target}, i}$), the engine sells the excess amount:
    $$A_{\text{sold}, i} = V_i - V_{\text{target}, i}$$
2.  **Cost Basis realization:** The cost basis $B_i$ of the asset is adjusted proportionally. The sold fraction is $f_i = \frac{A_{\text{sold}, i}}{V_i}$, which realizes a taxable gain:
    $$G_{\text{realized}, i} = \max\left(0, A_{\text{sold}, i} - f_i \cdot B_i\right)$$
3.  **Tax realization:** If the account is taxable, a capital gains tax liability is incurred:
    $$\text{Tax}_i = G_{\text{realized}, i} \cdot \tau$$
    where $\tau$ is the capital gains tax rate. The asset's cost basis is decremented by $f_i \cdot B_i$.
4.  **Buys are processed next:** The proceeds are allocated to underweighted assets ($V_i < V_{\text{target}, i}$), increasing their cost basis dollar-for-dollar.
5.  **Transaction Fees:** A transaction fee drag is calculated on the total volume traded (the sum of all sells and buys):
    $$\text{Fee} = \left( \sum A_{\text{sold}, i} + \sum A_{\text{bought}, j} \right) \cdot \theta$$
    where $\theta$ is the transaction fee percentage.
6.  **Drag deduction:** The total drag ($\text{Fee} + \sum \text{Tax}_i$) is subtracted proportionally from all asset allocations, capturing the realistic drag on long-term compound growth.

---

## 📂 Project Architecture

The codebase is highly modular, separating state management, side effects, statistical calculations, and rendering.

```text
monte-carlo-portfolio/
├── .github/workflows/       # GitHub Actions deployment pipelines
├── src/
│   ├── assets/              # Static media and SVG assets (Vite/React icons)
│   ├── components/          # React Presentation & Chart Components
│   │   ├── AllocationPieChart.tsx   # Allocation weight layout
│   │   ├── AssetInput.tsx           # Portfolio custom setup panel
│   │   ├── DashboardCharts.tsx      # Charts parent wrapper
│   │   ├── HistoricalChart.tsx      # Recharts historical comparison
│   │   ├── InfoTooltip.tsx          # Contextual explanatory tooltips
│   │   ├── MethodologyDocs.tsx      # MathJax mathematical methodology documentation
│   │   ├── MetricsDisplay.tsx       # KPI stats (Sharpe, Sortino, VaR, CVaR, Taxes)
│   │   ├── MonteCarloChart.tsx      # Percentile cone and sample paths
│   │   ├── Navbar.tsx               # Header and Dark Mode controls
│   │   ├── SimulationControls.tsx   # Sliders (years, runs, deposits, inflation, taxes)
│   │   └── SimulationReport.tsx     # Comprehensive, exportable analytical report
│   ├── data/
│   │   └── commonAssets.json        # Built-in fallback template metadata
│   ├── hooks/               # Custom React state and side-effect hooks
│   │   ├── useHistoricalBacktest.ts # Debounced historical backtesting hook
│   │   ├── usePortfolioState.ts     # User designer form and model states
│   │   └── useSimulation.ts         # Worker orchestration and thread safety
│   ├── services/
│   │   └── dataService.ts           # Yahoo Finance CORS fetcher & CSV parser
│   ├── types/               # TypeScript interfaces & types
│   │   └── index.ts         # Shared TypeScript type definitions
│   ├── utils/
│   │   ├── colors.ts                # Dynamic tailwind color generation
│   │   └── mathEngine.ts            # Core quantitative mathematical algorithms
│   ├── workers/
│   │   └── simulationWorker.ts      # Web Worker thread background simulation loops
│   ├── index.css            # Tailwind directives and custom variables
│   ├── main.tsx             # Application entry-point
│   └── App.tsx              # Primary layout orchestrator
├── index.html               # Main index file
├── package.json             # NPM dependencies & task configurations
└── vite.config.ts           # Bundler config (supports ESM workers)
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have Node.js (v18+) and npm installed on your machine.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jsonfm/monte-carlo-portfolio.git
    cd monte-carlo-portfolio
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the local development server:**
    ```bash
    npm run dev
    ```
    The application will be running locally at [http://localhost:5173](http://localhost:5173).

4.  **Build for production:**
    ```bash
    npm run build
    ```
    This bundles and compiles the application into highly optimized assets in the `./dist` folder.

5.  **Preview production build locally:**
    ```bash
    npm run preview
    ```

---

## 📁 Custom CSV Format Guidelines

To upload your own historical price data, drag and drop or upload a `.csv` file. The local parser is robust and adapts to many structures, but for optimal results, ensure your CSV complies with the following format:

*   It must have a **Header Row** (the first row containing column names).
*   **Date Column:** One column must contain the dates. The parser identifies columns matching `date` or `time` (case-insensitive, e.g., "Date", "date", "Timestamp").
*   **Price Column:** One column must contain the close prices. The parser identifies columns matching `adj close`, `close`, `price`, or `value` (case-insensitive, e.g., "Adj Close", "Close", "Close Price").
*   Values in the price column can contain currency symbols (e.g., `$`) or commas (e.g., `1,250.50`), as the parser automatically strips formatting before calculations.

### Example CSV Structure:
```csv
Date,Open,High,Low,Close,Adj Close,Volume
2026-05-20,185.20,187.50,184.10,186.40,186.40,52000000
2026-05-21,186.50,188.10,185.90,187.90,187.75,48000000
2026-05-22,188.00,189.40,187.20,188.50,188.50,51000000
```

---

## 🛠️ Built With

*   [React 19](https://react.dev/) - Declarative UI development
*   [Vite 8](https://vite.dev/) - Super-fast frontend bundler
*   [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first styling with advanced CSS variable engines
*   [Recharts](https://recharts.org/) - Beautiful, interactive charting
*   [better-react-mathjax](https://github.com/a-bentofreire/better-react-mathjax) - High-performance client-side MathJax equation rendering
*   [PapaParse](https://www.papaparse.com/) - High-performance client-side CSV parsing
*   [Framer Motion](https://www.framer.com/motion/) - Fluent UI transitions and micro-interactions
*   [Lucide React](https://lucide.dev/) - Clean and consistent modern vector icons

---

## 🌍 Deployment

This project includes a fully automated GitHub Actions pipeline (`.github/workflows/deploy.yml`) that builds and deploys the application to **GitHub Pages** on every push to the `main` or `master` branch.

### Manual Pages Config
To configure GitHub Pages manually for your fork:
1.  Go to your repository settings on GitHub.
2.  Navigate to **Pages** in the left sidebar.
3.  Set the **Source** under Build and deployment to **GitHub Actions**.
4.  Once you push changes to `main`, the deployment job will run and compile your static app, outputting it directly to the designated static site URL.

---

## 📜 License

This project is open-source and licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute it as needed.
