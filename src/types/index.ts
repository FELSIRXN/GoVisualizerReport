export interface PaymentRecord {
  // Standardized column names after normalization
  tpv: number;
  netRevenue: number;
  directCost: number;
  schemeFees: number;
  mraCost: number;
  grossProfit: number;
  transactionCount: number;
  // Additional fields that may exist
  month?: string;
  date?: string;
  company?: string;
  channel?: string;
  currency?: string;
  country?: string;
  sourceType?: 'merchant' | 'channel' | 'unknown'; // Sheet type identifier
  [key: string]: any; // For any other columns
}

export interface ConsolidatedData {
  records: PaymentRecord[];
  dateRange: {
    min: Date | null;
    max: Date | null;
  };
  totalRecords: number;
}

export interface Metrics {
  totalTPV: number;
  totalNetRevenue: number;
  totalGrossProfit: number;
  blendedTakeRate: number; // percentage
  blendedGPM: number; // percentage
  totalTransactions: number;
  averageTicketSize: number;
  grossProfitValidation: {
    calculated: number;
    fromFile: number;
    matches: boolean;
  };
}

export interface MonthlyAggregation {
  month: string;
  tpv: number;
  netRevenue: number;
  grossProfit: number;
}

export interface EntityPerformance {
  name: string;
  tpv: number;
  netRevenue: number;
}

export interface DistributionData {
  name: string;
  value: number;
}

