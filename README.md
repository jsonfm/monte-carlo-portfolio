# 📈 Modern Monte Carlo Portfolio Simulator

[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![GitHub Actions Pages](https://github.com/jsonfm/monte-carlo-portfolio/actions/workflows/deploy.yml/badge.svg)](https://github.com/jsonfm/monte-carlo-portfolio/actions/workflows/deploy.yml)

A professional, fully client-side **Quantitative Portfolio Designer, Historical Backtester, and Monte Carlo Simulation Engine**. Designed with modern finance frameworks and high-performance algorithms, this web application helps investors, analysts, and students model future asset returns, run complex stochastic walks, and backtest portfolio strategies with extreme responsiveness.

---

## 🌟 Key Features

*   **🛠️ Interactive Portfolio Designer:** Custom-design portfolios by adding assets with arbitrary tickers/names, custom categories (ETF, Stock, Bond, Crypto), and dynamic weight distributions. Includes interactive weight visualizers, total allocation validation (must sum to exactly 100%), and template presets.
*   **🎲 Dual-Engine Monte Carlo Simulations:**
    *   **Geometric Brownian Motion (GBM):** Annualizes daily asset drifts ($\mu$) and volatilities ($\sigma$) and correlates assets via Cholesky Decomposition of the historical covariance matrix.
    *   **Historical Bootstrapping:** Non-parametric simulation that samples historical joint-daily returns (preserves actual distribution skewness, kurtosis, and fat-tailed tail risk without assuming normal distributions—excellent for Crypto and alternative assets).
*   **📊 Comprehensive Risk & Performance Metrics:** Compute institutional-grade statistics, including:
    *   **CAGR** (Compound Annual Growth Rate)
    *   **Sharpe Ratio** (Risk-adjusted return relative to volatility)
    *   **Sortino Ratio** (Downside-adjusted return using semi-standard deviation)
    *   **Maximum Drawdown** (Peak-to-trough historical loss)
    *   **Standard Volatility** (Annualized)
    *   **95% Value at Risk (VaR)** (Worst-case loss threshold at a 95% confidence interval)
    *   **95% Conditional Value at Risk (CVaR / Expected Shortfall)** (Average loss expected in the worst 5% of outcomes)
*   **🔄 Dynamic Portfolio Rebalancing Simulator:** Run simulations with different rebalancing frequencies (None, Monthly, Annually) to model realistic asset drifts and capture how periodic transaction adjustments affect tail risk and compound returns.
*   **📈 Rich Interactive Charting (Recharts):**
    *   **Monte Carlo Projections:** Displays a full statistical cone including the **10th percentile** (downside case), **50th percentile** (median case), and **90th percentile** (upside case), overlaid with 30 randomly selected sample asset paths.
    *   **Historical Backtester:** Models historical portfolio growth alongside a customizable benchmark index (e.g., SPY, QQQ, IWM, BTC-USD) over the historical range.
    *   **Asset Allocation:** A beautiful, responsive Pie Chart visualizing portfolio composition.
*   **📂 Zero-Server Custom CSV Uploads:** Import arbitrary CSV pricing data on-the-fly. The client-side parser reads historical data seamlessly, allowing you to simulate custom, unlisted, or private assets.
*   **⚡ High-Performance Web Workers:** Decoupled statistical engine executed entirely in a separate background thread via HTML5 Web Workers. Computes thousands of years of simulated paths in milliseconds without freezing the browser UI, ensuring a consistent 60 FPS.
*   **🌗 Adaptive Dark Mode & Tailwind v4 UI:** Beautiful, modern, dark-first UI optimized with Tailwind CSS v4, smooth Framer Motion transitions, responsive layouts, and unified light/dark styling.

---

## 🔬 Mathematical Methodology

### 1. Geometric Brownian Motion (GBM) with Cholesky Correlation

To model asset prices, we assume they follow a stochastic differential equation (SDE):

$$dS_t = \mu S_t dt + \sigma S_t dW_t$$

In a discrete simulation step over interval $\Delta t$ (where $\Delta t = \frac{1}{252}$ for daily steps), the asset price is updated as:

$$S_{i, t+\Delta t} = S_{i, t} \exp \left( \left( \mu_i - \frac{1}{2}\sigma_i^2 \right) \Delta t + \sigma_i \sqrt{\Delta t} X_i \right)$$

Where:
*   $\mu_i$ is the annualized expected return (historical CAGR) of asset $i$.
*   $\sigma_i$ is the annualized volatility of asset $i$.
*   $X_i$ is a correlated standard normal variable.

#### Covariance and Cholesky Decomposition
To preserve historical cross-asset relationships, we compute the covariance matrix $\Sigma$ of daily asset returns. We then perform a **Cholesky Decomposition** to factor the symmetric positive-definite covariance matrix:

$$\Sigma = L L^T$$

Where $L$ is a lower triangular matrix. To generate correlated normal variables $\mathbf{X}$, we generate a vector of independent standard normal random variables $\mathbf{Z} \sim \mathcal{N}(0, \mathbf{I})$ and multiply:

$$\mathbf{X} = L \mathbf{Z}$$

*Note: The math engine applies diagonal regularization ($10^{-8}$) to ensure strict positive-definiteness on highly correlated asset matrices.*

### 2. Historical Bootstrapping

Under the non-parametric **Historical Bootstrapping** model, we do not assume returns are normally distributed. This is critical for capturing fat-tailed events (e.g., black swans) in assets like cryptocurrencies.

The engine randomly samples a joint row of returns from actual historical trading days:

$$\mathbf{R}_t = \mathbf{r}_{\text{random\_day}}$$

Because we sample the **entire row** (returns of all assets on the same day) simultaneously, the correlation structure, skewness, and kurtosis of the assets are perfectly preserved in the simulation without the need for parametric adjustments.

### 3. Risk-Adjusted Ratios

*   **Sharpe Ratio:** Evaluates the return earned per unit of total risk.
    $$\text{Sharpe Ratio} = \frac{R_p - R_f}{\sigma_p}$$
*   **Sortino Ratio:** Evaluates return earned per unit of downside risk, ignoring upside volatility.
    $$\text{Sortino Ratio} = \frac{R_p - R_f}{\sigma_{d, p}}$$
    Where $\sigma_{d, p}$ is the downside deviation:
    $$\sigma_{d, p} = \sqrt{\frac{1}{N}\sum_{t=1}^{N} \min(0, R_{p, t} - R_f)^2}$$
    *(A risk-free rate $R_f = 0\%$ is assumed as the baseline).*

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
│   │   ├── InfoTooltip.tsx          # Lightweight metric tooltips
│   │   ├── MethodologyDocs.tsx      # KaTeX inline mathematical documentation
│   │   ├── MetricsDisplay.tsx       # KPI stats ( Sharpe, Sortino, VaR, CVaR )
│   │   ├── MonteCarloChart.tsx      # Percentile cone and sample paths
│   │   ├── Navbar.tsx               # Header and Dark Mode controls
│   │   ├── SimulationControls.tsx   # Sliders (years, runs, initial investment)
│   │   └── SimulationReport.tsx     # Comprehensive, exportable analytical report
│   ├── data/
│   │   └── commonAssets.json        # Built-in fallback template metadata
│   ├── hooks/               # Custom React state and side-effect hooks
│   │   ├── useHistoricalBacktest.ts # Direct integration of loading + running
│   │   ├── usePortfolioState.ts     # User designer form state
│   │   └── useSimulation.ts         # Worker orchestration and thread safety
│   ├── services/
│   │   └── dataService.ts           # Yahoo Finance CORS fetcher & CSV parser
│   ├── types/               # TypeScript interfaces & types
│   │   └── index.ts         # Shared TypeScript type definitions
│   ├── utils/
│   │   ├── colors.ts                # Dynamic tailwind color generation
│   │   └── mathEngine.ts            # Core quantitative mathematical algorithms
│   ├── workers/
│   │   └── simulationWorker.ts      # Web Worker thread background loops
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
    git clone https://github.com/your-username/monte-carlo-portfolio.git
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
*   [KaTeX](https://katex.org/) / [react-katex](https://github.com/talyssonoc/react-katex) - Math equation rendering
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
