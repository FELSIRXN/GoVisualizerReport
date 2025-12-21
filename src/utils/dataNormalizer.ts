import { PaymentRecord } from '../types';

// Column mapping: variations -> standardized name
const COLUMN_MAPPINGS: Record<string, string> = {
  // TPV variations
  'sum of billing': 'tpv',
  'billing': 'tpv',
  'total payment volume': 'tpv',
  'tpv': 'tpv',
  
  // Net Revenue variations
  'sum of comm': 'netRevenue',
  'commission': 'netRevenue',
  'net revenue': 'netRevenue',
  'revenue': 'netRevenue',
  
  // Direct Cost variations
  'sum of direct cost': 'directCost',
  'direct cost': 'directCost',
  
  // Scheme Fees variations (handle both singular and plural)
  'sum of scheme fee': 'schemeFees',
  'sum of scheme fees': 'schemeFees',
  'scheme fee': 'schemeFees',
  'scheme fees': 'schemeFees',
  
  // MRA Cost variations
  'sum of mra cost': 'mraCost',
  'mra cost': 'mraCost',
  
  // Gross Profit variations
  'sum of gross profit': 'grossProfit',
  'gross profit': 'grossProfit',
  'gp': 'grossProfit',
  
  // Transaction Count
  'no of transaction': 'transactionCount',
  'number of transactions': 'transactionCount',
  'transactions': 'transactionCount',
  
  // Additional fields
  'month': 'month',
  'date': 'date',
  'company': 'company',
  'channel': 'channel',
  'currency': 'currency',
  'entity reporting currency': 'currency',
  'reporting currency': 'currency',
  'country': 'country',
  'merchant country': 'country',
};

function normalizeHeader(header: string): string {
  // Remove extra whitespace and convert to lowercase
  const normalized = header.trim().toLowerCase();
  
  // Check for exact match first
  if (COLUMN_MAPPINGS[normalized]) {
    return COLUMN_MAPPINGS[normalized];
  }
  
  // Check for partial matches (fuzzy matching)
  for (const [key, value] of Object.entries(COLUMN_MAPPINGS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // Return original if no match found (preserve other columns)
  return header.trim();
}

function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove currency symbols, commas, etc.
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function normalizeHeaders(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  headers.forEach(header => {
    const normalized = normalizeHeader(header);
    mapping[header] = normalized;
  });
  return mapping;
}

export function mapColumns(row: any, headerMapping: Record<string, string>): PaymentRecord {
  const mapped: any = {};
  
  // Map known columns
  Object.entries(headerMapping).forEach(([original, normalized]) => {
    if (row[original] !== undefined) {
      // Parse numbers for financial columns
      if (['tpv', 'netRevenue', 'directCost', 'schemeFees', 'mraCost', 'grossProfit', 'transactionCount'].includes(normalized)) {
        mapped[normalized] = parseNumber(row[original]);
      } else {
        mapped[normalized] = row[original];
      }
    }
  });
  
  // Preserve other columns
  Object.keys(row).forEach(key => {
    if (!headerMapping[key]) {
      mapped[key] = row[key];
    }
  });
  
  return mapped as PaymentRecord;
}

export function consolidateData(dataArrays: any[][]): PaymentRecord[] {
  if (dataArrays.length === 0) return [];
  
  // Get headers from first file
  const firstData = dataArrays[0];
  if (firstData.length === 0) return [];
  
  const firstHeaders = Object.keys(firstData[0]);
  const headerMapping = normalizeHeaders(firstHeaders);
  
  // Process all data arrays
  const allRecords: PaymentRecord[] = [];
  
  dataArrays.forEach((data, fileIndex) => {
    if (data.length === 0) return;
    
    // Normalize headers for this file (in case headers differ slightly)
    const currentHeaders = Object.keys(data[0]);
    const currentMapping = normalizeHeaders(currentHeaders);
    
    data.forEach((row) => {
      const mapped = mapColumns(row, currentMapping);
      allRecords.push(mapped);
    });
  });
  
  return allRecords;
}

