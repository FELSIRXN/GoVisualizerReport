import { useDataStore } from '../store/useDataStore';
import { useMemo } from 'react';

export function DataTicker() {
  const { metrics, dateRange, getMonthlyAggregations } = useDataStore();

  const tickerItems = useMemo(() => {
    if (!metrics) return [];

    const items: string[] = [];
    const formatCurrency = (val: number) => {
      if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
      if (val >= 1000) return `$${(val / 1000).toFixed(2)}K`;
      return `$${val.toFixed(2)}`;
    };

    // Format date for display
    const formatMonth = (date: Date | null) => {
      if (!date) return '';
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    };

    const monthStr = formatMonth(dateRange.min) || formatMonth(dateRange.max) || '';

    // Add key metrics
    items.push(`TPV ${monthStr}: ${formatCurrency(metrics.totalTPV)}`);
    items.push(`NET REVENUE ${monthStr}: ${formatCurrency(metrics.totalNetRevenue)}`);
    items.push(`GROSS PROFIT ${monthStr}: ${formatCurrency(metrics.totalGrossProfit)}`);
    items.push(`TRANSACTIONS: ${metrics.totalTransactions.toLocaleString()}`);
    items.push(`TAKE RATE: ${metrics.blendedTakeRate.toFixed(2)}%`);
    items.push(`GPM: ${metrics.blendedGPM.toFixed(2)}%`);
    items.push(`AVG TICKET: ${formatCurrency(metrics.averageTicketSize)}`);

    // Add monthly highlights if available
    const monthlyData = getMonthlyAggregations();
    if (monthlyData.length > 0) {
      const topMonth = monthlyData.reduce((max, m) => m.tpv > max.tpv ? m : max, monthlyData[0]);
      const monthLabel = topMonth.month;
      items.push(`${monthLabel} TPV: ${formatCurrency(topMonth.tpv)}`);
    }

    return items;
  }, [metrics, dateRange, getMonthlyAggregations]);

  if (!metrics || tickerItems.length === 0) {
    return null;
  }

  // Duplicate items for seamless loop
  const duplicatedItems = [...tickerItems, ...tickerItems];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-terminal-orange text-white font-mono font-bold py-2.5 overflow-hidden shadow-lg">
      <div className="flex animate-marquee whitespace-nowrap">
        {duplicatedItems.map((item, index) => (
          <span key={index} className="mx-8 flex-shrink-0">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

