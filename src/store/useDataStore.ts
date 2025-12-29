import { create } from 'zustand';
import { PaymentRecord, Metrics, MonthlyAggregation, EntityPerformance, DistributionData } from '../types';
import { parseFile } from '../utils/fileParser';
import { consolidateData } from '../utils/dataNormalizer';
import { fetchExchangeRates, ExchangeRates } from '../services/currencyService';

interface DataStore {
  rawData: any[][];
  processedData: PaymentRecord[];
  metrics: Metrics | null;
  dateRange: { min: Date | null; max: Date | null };
  isLoading: boolean;
  error: string | null;
  exchangeRates: ExchangeRates | null;
  
  // Actions
  processFiles: (files: File[]) => Promise<void>;
  calculateMetrics: () => void;
  reset: () => void;
  getMonthlyAggregations: () => MonthlyAggregation[];
  getTopEntities: (limit?: number) => EntityPerformance[];
  getTopMerchants: (limit?: number) => EntityPerformance[];
  getTopChannels: (limit?: number) => EntityPerformance[];
  getTPVDistribution: (by: 'currency' | 'country') => DistributionData[];
}

const initialMetrics: Metrics = {
  totalTPV: 0,
  totalNetRevenue: 0,
  totalGrossProfit: 0,
  blendedTakeRate: 0,
  blendedGPM: 0,
  totalTransactions: 0,
  averageTicketSize: 0,
  grossProfitValidation: {
    calculated: 0,
    fromFile: 0,
    matches: false,
  },
};

export const useDataStore = create<DataStore>((set, get) => ({
  rawData: [],
  processedData: [],
  metrics: null,
  dateRange: { min: null, max: null },
  isLoading: false,
  error: null,
  exchangeRates: null,

  processFiles: async (files: File[]) => {
    set({ isLoading: true, error: null });
    
    try {
      // Fetch exchange rates first
      let rates = get().exchangeRates;
      if (!rates) {
        try {
          rates = await fetchExchangeRates();
          set({ exchangeRates: rates });
        } catch (rateError) {
          console.warn('Failed to fetch exchange rates, proceeding without conversion:', rateError);
          // Continue without rates - amounts will not be converted
        }
      }
      
      const dataArrays: any[][] = [];
      
      // Parse all files
      for (const file of files) {
        const data = await parseFile(file);
        dataArrays.push(data);
      }
      
      // Consolidate data with exchange rates
      const consolidated = consolidateData(dataArrays, rates || undefined);
      
      // Calculate date range
      const dates = consolidated
        .map(r => {
          let dateStr = r.month || r.date;
          if (!dateStr) return null;

          // Handle Excel serial dates (if parsed as number)
          if (typeof dateStr === 'number') {
            // Excel epoch starts Dec 30 1899
            const excelDate = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
            return isNaN(excelDate.getTime()) ? null : excelDate;
          }

          // Handle string dates
          if (typeof dateStr === 'string') {
            // Clean up string
            dateStr = dateStr.trim();
            
            // Try parsing "Month Year" or "Mon-YY" formats (e.g. "November 2025", "Nov-25")
            // If it's just "Nov-25", Date.parse might default to 2001 or fail depending on browser
            // Let's try standard constructor first
            let date = new Date(dateStr);
            if (!isNaN(date.getTime())) return date;

            // Try "Month-Year" manually if failed
            const parts = dateStr.match(/([a-zA-Z]+)[- ](\d{2,4})/);
            if (parts) {
              const monthName = parts[1];
              let year = parseInt(parts[2]);
              if (year < 100) year += 2000; // Assume 20xx for 2-digit years
              date = new Date(`${monthName} 1, ${year}`);
              if (!isNaN(date.getTime())) return date;
            }
          }
          
          return null;
        })
        .filter((d): d is Date => d !== null);
      
      const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
      const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
      
      set({
        rawData: dataArrays,
        processedData: consolidated,
        dateRange: { min: minDate, max: maxDate },
        isLoading: false,
      });
      
      // Calculate metrics
      get().calculateMetrics();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to process files',
        isLoading: false,
      });
    }
  },

  calculateMetrics: () => {
    const { processedData } = get();
    
    if (processedData.length === 0) {
      set({ metrics: initialMetrics });
      return;
    }
    
    // Calculate totals
    const totalTPV = processedData.reduce((sum, r) => sum + (r.tpv || 0), 0);
    const totalNetRevenue = processedData.reduce((sum, r) => sum + (r.netRevenue || 0), 0);
    const totalGrossProfit = processedData.reduce((sum, r) => sum + (r.grossProfit || 0), 0);
    const totalDirectCost = processedData.reduce((sum, r) => sum + (r.directCost || 0), 0);
    const totalSchemeFees = processedData.reduce((sum, r) => sum + (r.schemeFees || 0), 0);
    const totalMRACost = processedData.reduce((sum, r) => sum + (r.mraCost || 0), 0);
    const totalTransactions = processedData.reduce((sum, r) => sum + (r.transactionCount || 0), 0);
    
    // Calculate Gross Profit (validation)
    const calculatedGP = totalNetRevenue - totalDirectCost - totalSchemeFees - totalMRACost;
    const fromFileGP = totalGrossProfit;
    const gpMatches = Math.abs(calculatedGP - fromFileGP) < 0.01; // Allow small floating point differences
    
    // Calculate blended metrics
    const blendedTakeRate = totalTPV > 0 ? (totalNetRevenue / totalTPV) * 100 : 0;
    const blendedGPM = totalNetRevenue > 0 ? (totalGrossProfit / totalNetRevenue) * 100 : 0;
    const averageTicketSize = totalTransactions > 0 ? totalTPV / totalTransactions : 0;
    
    set({
      metrics: {
        totalTPV,
        totalNetRevenue,
        totalGrossProfit,
        blendedTakeRate,
        blendedGPM,
        totalTransactions,
        averageTicketSize,
        grossProfitValidation: {
          calculated: calculatedGP,
          fromFile: fromFileGP,
          matches: gpMatches,
        },
      },
    });
  },

  getMonthlyAggregations: () => {
    const { processedData } = get();
    const monthlyMap = new Map<string, { tpv: number; netRevenue: number; grossProfit: number }>();
    
    processedData.forEach(record => {
      let monthKey = '';
      
      let date: Date | null = null;
      const val = record.month || record.date;
      
      if (typeof val === 'number') {
        date = new Date(Math.round((val - 25569) * 86400 * 1000));
      } else if (typeof val === 'string') {
        date = new Date(val);
        if (isNaN(date.getTime())) {
           // Retry custom parsing if needed (simple fallback)
           const parts = val.match(/([a-zA-Z]+)[- ](\d{2,4})/);
           if (parts) {
             let year = parseInt(parts[2]);
             if (year < 100) year += 2000;
             date = new Date(`${parts[1]} 1, ${year}`);
           }
        }
      }
      
      if (date && !isNaN(date.getTime())) {
        monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!monthKey) return;
      
      const existing = monthlyMap.get(monthKey) || { tpv: 0, netRevenue: 0, grossProfit: 0 };
      monthlyMap.set(monthKey, {
        tpv: existing.tpv + (record.tpv || 0),
        netRevenue: existing.netRevenue + (record.netRevenue || 0),
        grossProfit: existing.grossProfit + (record.grossProfit || 0),
      });
    });
    
    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        ...data,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  },

  getTopEntities: (limit = 10) => {
    const { processedData } = get();
    const entityMap = new Map<string, { tpv: number; netRevenue: number }>();
    
    processedData.forEach(record => {
      const entityName = record.company || record.channel;
      if (!entityName) return; // Skip records without entity name
      
      const existing = entityMap.get(entityName) || { tpv: 0, netRevenue: 0 };
      entityMap.set(entityName, {
        tpv: existing.tpv + (record.tpv || 0),
        netRevenue: existing.netRevenue + (record.netRevenue || 0),
      });
    });
    
    return Array.from(entityMap.entries())
      .map(([name, data]) => ({
        name,
        ...data,
      }))
      .sort((a, b) => b.tpv - a.tpv)
      .slice(0, limit);
  },

  getTopMerchants: (limit = 10) => {
    const { processedData } = get();
    const entityMap = new Map<string, { tpv: number; netRevenue: number }>();
    
    processedData
      .filter(record => record.sourceType === 'merchant')
      .forEach(record => {
        const entityName = record.company;
        if (!entityName) return; // Skip records without company name
        
        const existing = entityMap.get(entityName) || { tpv: 0, netRevenue: 0 };
        entityMap.set(entityName, {
          tpv: existing.tpv + (record.tpv || 0),
          netRevenue: existing.netRevenue + (record.netRevenue || 0),
        });
      });
    
    return Array.from(entityMap.entries())
      .map(([name, data]) => ({
        name,
        ...data,
      }))
      .sort((a, b) => b.tpv - a.tpv)
      .slice(0, limit);
  },

  getTopChannels: (limit = 10) => {
    const { processedData } = get();
    const entityMap = new Map<string, { tpv: number; netRevenue: number }>();
    
    processedData
      .filter(record => record.sourceType === 'channel')
      .forEach(record => {
        const entityName = record.channel;
        if (!entityName) return; // Skip records without channel name
        
        const existing = entityMap.get(entityName) || { tpv: 0, netRevenue: 0 };
        entityMap.set(entityName, {
          tpv: existing.tpv + (record.tpv || 0),
          netRevenue: existing.netRevenue + (record.netRevenue || 0),
        });
      });
    
    return Array.from(entityMap.entries())
      .map(([name, data]) => ({
        name,
        ...data,
      }))
      .sort((a, b) => b.tpv - a.tpv)
      .slice(0, limit);
  },

  getTPVDistribution: (by: 'currency' | 'country') => {
    const { processedData } = get();
    const distributionMap = new Map<string, number>();
    
    processedData.forEach(record => {
      // Get the key value, checking multiple possible field names
      let key: string | undefined;
      
      if (by === 'currency') {
        // Check normalized currency first, then try other variations
        key = record.currency || 
              (record as any)['Entity Reporting Currency'] || 
              (record as any)['Reporting Currency'] ||
              (record as any)['entity reporting currency'] ||
              (record as any)['reporting currency'] ||
              (record as any)['Currency'];
      } else {
        key = record.country || 
              (record as any)['Merchant Country'] ||
              (record as any)['merchant country'] ||
              (record as any)['Country'];
      }
      
      // Only include records with valid keys (skip empty, null, undefined, or 'Unknown')
      if (key && key.trim() !== '' && key.trim().toLowerCase() !== 'unknown') {
        const normalizedKey = typeof key === 'string' ? key.trim().toUpperCase() : String(key);
        const existing = distributionMap.get(normalizedKey) || 0;
        distributionMap.set(normalizedKey, existing + (record.tpv || 0));
      }
    });
    
    const result = Array.from(distributionMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // If we have valid results, return them. Otherwise return empty array.
    return result;
  },

  reset: () => {
    set({
      rawData: [],
      processedData: [],
      metrics: null,
      dateRange: { min: null, max: null },
      error: null,
      // Keep exchangeRates cached across resets
    });
  },
}));

