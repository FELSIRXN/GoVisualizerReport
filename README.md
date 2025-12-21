# GoReportVisualizer+

A React-based MVP application that allows users to upload payment gateway sales reports (CSV/XLSX), consolidates the data, and automatically generates an interactive dashboard and performance analysis report.

## Features

- **File Upload**: Drag and drop multiple CSV/XLSX files
- **Data Consolidation**: Automatically merges multiple files into a single dataset
- **Interactive Dashboard**: Visual KPIs and charts including:
  - Total TPV, Net Revenue, Gross Profit
  - Blended Take Rate and GPM
  - Trend analysis over time
  - Profitability composition
  - Top performing channels/merchants
  - Distribution by currency or country
- **Automated Report**: System log-style analysis with key findings
- **Terminal Theme**: "Hacker Terminal" aesthetic with deep black background and terminal green accents

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- Recharts (data visualization)
- PapaParse (CSV parsing)
- XLSX (Excel parsing)
- React Router
- Lucide React (icons)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Upload Files**: On the landing page, drag and drop or select CSV/XLSX files containing payment gateway data
2. **View Dashboard**: After processing, you'll be automatically redirected to the dashboard with visualizations
3. **View Report**: Click "View Report" to see the automated analysis report

## Data Format

The application expects CSV or XLSX files with the following columns (variations are automatically normalized):

- **Sum of Billing** (or "Billing", "TPV") - Total Payment Volume
- **Sum of Comm** (or "Commission", "Net Revenue") - Net Revenue
- **Sum of Direct Cost** (or "Direct Cost") - Direct costs
- **Sum of Scheme Fee/Fees** (or "Scheme Fee/Fees") - Scheme fees
- **Sum of MRA Cost** (or "MRA Cost") - MRA costs
- **Sum of Gross Profit** (or "Gross Profit", "GP") - Gross profit
- **Month** or **Date** - Time period
- **Company** or **Channel** - Entity name
- **Currency** or **Country** - Distribution fields

## Project Structure

```
src/
├── components/       # Reusable components
├── pages/           # Page components
├── store/           # Zustand store
├── types/           # TypeScript interfaces
└── utils/           # Utility functions
```

## License

MIT

