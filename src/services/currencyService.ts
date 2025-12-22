export interface ExchangeRates {
  [currencyCode: string]: number; // Rate from USD to currency (e.g., MYR: 4.5 means 1 USD = 4.5 MYR)
}

let cachedRates: ExchangeRates | null = null;
let fetchPromise: Promise<ExchangeRates> | null = null;

/**
 * Fetches exchange rates from open.er-api.com
 * Rates are cached to avoid multiple API calls
 * Base currency is USD
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
  // Return cached rates if available
  if (cachedRates) {
    return cachedRates;
  }

  // Return existing promise if fetch is in progress
  if (fetchPromise) {
    return fetchPromise;
  }

  // Fetch rates
  fetchPromise = (async () => {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.rates || typeof data.rates !== 'object') {
        throw new Error('Invalid exchange rate data format');
      }

      // The API returns rates from USD to other currencies
      // We need to invert them to convert from local currency to USD
      // Actually wait - if rate is MYR: 4.5, that means 1 USD = 4.5 MYR
      // To convert MYR to USD: MYR / 4.5
      // So we keep the rates as-is since we divide by them
      cachedRates = data.rates as ExchangeRates;
      
      // Add USD rate (1:1)
      cachedRates['USD'] = 1;
      
      return cachedRates;
    } catch (error) {
      fetchPromise = null;
      throw error;
    }
  })();

  return fetchPromise;
}

/**
 * Converts an amount from a local currency to USD
 * @param amount Amount in local currency
 * @param currencyCode Currency code (e.g., 'MYR', 'IDR', 'USD')
 * @param rates Exchange rates map
 * @returns Amount in USD
 */
export function convertToUSD(
  amount: number,
  currencyCode: string | undefined | null,
  rates: ExchangeRates
): number {
  if (!currencyCode) {
    return amount; // Assume USD if no currency specified
  }

  const normalizedCurrency = currencyCode.toUpperCase().trim();
  
  // If already USD, return as-is
  if (normalizedCurrency === 'USD') {
    return amount;
  }

  const rate = rates[normalizedCurrency];
  
  // If rate not found, log warning and return amount unchanged
  if (!rate || rate === 0) {
    console.warn(`Exchange rate not found for currency: ${normalizedCurrency}`);
    return amount;
  }

  // Convert: localCurrency / rate = USD
  return amount / rate;
}

/**
 * Clears cached exchange rates (useful for testing or forcing refresh)
 */
export function clearCache(): void {
  cachedRates = null;
  fetchPromise = null;
}

