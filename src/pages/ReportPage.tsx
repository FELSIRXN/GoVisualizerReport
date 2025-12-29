import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TerminalLayout } from '../components/TerminalLayout';
import { useDataStore } from '../store/useDataStore';
import { ArrowLeft } from 'lucide-react';
import { AnimatedValue } from '../components/AnimatedValue';
import { PaymentRecord, Metrics, MonthlyAggregation } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export function ReportPage() {
  const navigate = useNavigate();
  const { metrics, dateRange, processedData, getMonthlyAggregations } = useDataStore();

  useEffect(() => {
    if (!metrics) {
      navigate('/');
    }
  }, [metrics, navigate]);

  if (!metrics) {
    return null;
  }

  const monthlyData = getMonthlyAggregations();
  const topMonth = monthlyData.reduce((max, month) => 
    month.tpv > max.tpv ? month : max, monthlyData[0] || { month: 'N/A', tpv: 0 }
  );
  const lowestMonth = monthlyData.reduce((min, month) => 
    month.tpv < min.tpv ? month : min, monthlyData[0] || { month: 'N/A', tpv: Infinity }
  );

  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Filter data by sourceType
  const merchantData = useMemo(() => 
    processedData.filter(r => r.sourceType === 'merchant'),
    [processedData]
  );
  const channelData = useMemo(() => 
    processedData.filter(r => r.sourceType === 'channel'),
    [processedData]
  );

  // Helper function to calculate metrics for filtered data
  const calculateMetricsForData = (data: PaymentRecord[]): Metrics => {
    if (data.length === 0) {
      return {
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
          matches: true,
        },
      };
    }

    const totalTPV = data.reduce((sum, r) => sum + (r.tpv || 0), 0);
    const totalNetRevenue = data.reduce((sum, r) => sum + (r.netRevenue || 0), 0);
    const totalGrossProfit = data.reduce((sum, r) => sum + (r.grossProfit || 0), 0);
    const totalDirectCost = data.reduce((sum, r) => sum + (r.directCost || 0), 0);
    const totalSchemeFees = data.reduce((sum, r) => sum + (r.schemeFees || 0), 0);
    const totalMRACost = data.reduce((sum, r) => sum + (r.mraCost || 0), 0);
    const totalTransactions = data.reduce((sum, r) => sum + (r.transactionCount || 0), 0);
    
    const calculatedGP = totalNetRevenue - totalDirectCost - totalSchemeFees - totalMRACost;
    const fromFileGP = totalGrossProfit;
    const gpMatches = Math.abs(calculatedGP - fromFileGP) < 0.01;
    
    const blendedTakeRate = totalTPV > 0 ? (totalNetRevenue / totalTPV) * 100 : 0;
    const blendedGPM = totalNetRevenue > 0 ? (totalGrossProfit / totalNetRevenue) * 100 : 0;
    const averageTicketSize = totalTransactions > 0 ? totalTPV / totalTransactions : 0;

    return {
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
    };
  };

  // Helper function to get monthly aggregations for filtered data
  const getMonthlyAggregationsForData = (data: PaymentRecord[]): MonthlyAggregation[] => {
    const monthlyMap = new Map<string, { tpv: number; netRevenue: number; grossProfit: number }>();
    
    data.forEach(record => {
      let monthKey = '';
      
      let date: Date | null = null;
      const val = record.month || record.date;
      
      if (typeof val === 'number') {
        date = new Date(Math.round((val - 25569) * 86400 * 1000));
      } else if (typeof val === 'string') {
        date = new Date(val);
        if (isNaN(date.getTime())) {
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
  };

  const merchantMetrics = useMemo(() => calculateMetricsForData(merchantData), [merchantData]);
  const channelMetrics = useMemo(() => calculateMetricsForData(channelData), [channelData]);
  const merchantMonthlyData = useMemo(() => getMonthlyAggregationsForData(merchantData), [merchantData]);
  const channelMonthlyData = useMemo(() => getMonthlyAggregationsForData(channelData), [channelData]);

  return (
    <TerminalLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-6 animate-fadeInUp" style={{ animationDelay: '0ms', animationDuration: '1s' }}>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Executive Summary */}
        <Card className="bg-[#1a1a1a] animate-fadeInUp" style={{ animationDelay: '200ms', animationDuration: '1s' }}>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-terminal-text uppercase tracking-wider">Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="space-y-3 text-terminal-text/80 font-mono text-sm leading-relaxed">
            <p className="animate-fadeInUp" style={{ animationDelay: '400ms', animationDuration: '0.8s' }}>
              <span className="text-terminal-text/60">[INFO]</span> Total volume for the period was{' '}
              <span className="text-white font-bold">
                <AnimatedValue value={metrics.totalTPV} format={formatCurrency} delay={1200} />
              </span>.
            </p>
            <p className="animate-fadeInUp" style={{ animationDelay: '600ms', animationDuration: '0.8s' }}>
              <span className="text-terminal-text/60">[INFO]</span> Net revenue generated during this period:{' '}
              <span className="text-white font-bold">
                <AnimatedValue value={metrics.totalNetRevenue} format={formatCurrency} delay={1400} />
              </span>.
            </p>
            <p className="animate-fadeInUp" style={{ animationDelay: '800ms', animationDuration: '0.8s' }}>
              <span className="text-terminal-text/60">[INFO]</span> Gross profit margin stands at{' '}
              <span className="text-white font-bold">
                <AnimatedValue value={metrics.blendedGPM} format={(v) => `${v.toFixed(2)}%`} delay={1600} />
              </span> with a blended take rate of{' '}
              <span className="text-white font-bold">
                <AnimatedValue value={metrics.blendedTakeRate} format={(v) => `${v.toFixed(2)}%`} delay={1800} />
              </span>.
            </p>
            <p className="animate-fadeInUp" style={{ animationDelay: '1000ms', animationDuration: '0.8s' }}>
              <span className="text-terminal-text/60">[INFO]</span> Processed <span className="text-white font-bold">
                <AnimatedValue value={metrics.totalTransactions} format={(v) => v.toLocaleString()} delay={2000} />
              </span> transactions with an average ticket size of <span className="text-white font-bold">
                <AnimatedValue value={metrics.averageTicketSize} format={formatCurrency} delay={2200} />
              </span>.
            </p>
            <p className="animate-fadeInUp" style={{ animationDelay: '1200ms', animationDuration: '0.8s' }}>
              <span className="text-terminal-text/60">[INFO]</span> Analysis period: {formatDate(dateRange.min)} to {formatDate(dateRange.max)}.
            </p>
            <p className="animate-fadeInUp" style={{ animationDelay: '1400ms', animationDuration: '0.8s' }}>
              <span className="text-terminal-text/60">[INFO]</span> Total records processed: {processedData.length}.
            </p>
            {!metrics.grossProfitValidation.matches && (
              <p className="animate-fadeInUp" style={{ animationDelay: '1600ms', animationDuration: '0.8s' }}>
                <span className="text-yellow-500">[WARN]</span> Gross profit validation mismatch detected. 
                Calculated: <AnimatedValue value={metrics.grossProfitValidation.calculated} format={formatCurrency} delay={2400} />, 
                From file: <AnimatedValue value={metrics.grossProfitValidation.fromFile} format={formatCurrency} delay={2600} />.
              </p>
            )}
          </div>
          </CardContent>
        </Card>

        {/* Key Findings */}
        <Card className="bg-[#1a1a1a] animate-fadeInUp" style={{ animationDelay: '1800ms', animationDuration: '1s' }}>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-terminal-text uppercase tracking-wider">Key Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="animate-fadeInUp" style={{ animationDelay: '2000ms', animationDuration: '0.8s' }}>
                <CardContent className="p-4">
                  <h3 className="text-terminal-text/80 font-semibold mb-2 text-xs uppercase">Top Performing Month</h3>
                  <p className="text-terminal-text/60 text-sm mb-1">Month: {topMonth.month}</p>
                  <p className="text-white font-mono text-xl font-bold">
                    <AnimatedValue value={topMonth.tpv} format={formatCurrency} delay={2800} />
                  </p>
                  <p className="text-terminal-text/40 text-xs mt-2">
                    Net Revenue: <AnimatedValue value={topMonth.netRevenue} format={formatCurrency} delay={3000} />
                  </p>
                </CardContent>
              </Card>
              <Card className="animate-fadeInUp" style={{ animationDelay: '2200ms', animationDuration: '0.8s' }}>
                <CardContent className="p-4">
                  <h3 className="text-terminal-text/80 font-semibold mb-2 text-xs uppercase">Lowest Performing Month</h3>
                  <p className="text-terminal-text/60 text-sm mb-1">Month: {lowestMonth.month}</p>
                  <p className="text-white font-mono text-xl font-bold">
                    <AnimatedValue value={lowestMonth.tpv} format={formatCurrency} delay={3200} />
                  </p>
                  <p className="text-terminal-text/40 text-xs mt-2">
                    Net Revenue: <AnimatedValue value={lowestMonth.netRevenue} format={formatCurrency} delay={3400} />
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Metric Tables */}
        <Card className="bg-[#1a1a1a] animate-fadeInUp" style={{ animationDelay: '2400ms', animationDuration: '1s' }}>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-terminal-text uppercase tracking-wider">Consolidated Metrics</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-mono text-sm">
              <thead>
                <tr className="border-b border-terminal-border">
                  <th className="text-left p-3 text-terminal-text/60 uppercase text-xs">Metric</th>
                  <th className="text-right p-3 text-terminal-text/60 uppercase text-xs">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-terminal-border/30 hover:bg-white/5 animate-fadeInUp" style={{ animationDelay: '2600ms', animationDuration: '0.6s' }}>
                  <td className="p-3 text-terminal-text/80">Total TPV</td>
                  <td className="p-3 text-right text-white font-bold">
                    <AnimatedValue value={metrics.totalTPV} format={formatCurrency} delay={3600} />
                  </td>
                </tr>
                <tr className="border-b border-terminal-border/30 hover:bg-white/5 animate-fadeInUp" style={{ animationDelay: '2800ms', animationDuration: '0.6s' }}>
                  <td className="p-3 text-terminal-text/80">Total Net Revenue</td>
                  <td className="p-3 text-right text-white font-bold">
                    <AnimatedValue value={metrics.totalNetRevenue} format={formatCurrency} delay={3800} />
                  </td>
                </tr>
                <tr className="border-b border-terminal-border/30 hover:bg-white/5 animate-fadeInUp" style={{ animationDelay: '3000ms', animationDuration: '0.6s' }}>
                  <td className="p-3 text-terminal-text/80">Total Gross Profit</td>
                  <td className="p-3 text-right text-white font-bold">
                    <AnimatedValue value={metrics.totalGrossProfit} format={formatCurrency} delay={4000} />
                  </td>
                </tr>
                <tr className="border-b border-terminal-border/30 hover:bg-white/5 animate-fadeInUp" style={{ animationDelay: '3200ms', animationDuration: '0.6s' }}>
                  <td className="p-3 text-terminal-text/80">Total Transactions</td>
                  <td className="p-3 text-right text-white font-bold">
                    <AnimatedValue value={metrics.totalTransactions} format={(v) => v.toLocaleString()} delay={4200} />
                  </td>
                </tr>
                <tr className="border-b border-terminal-border/30 hover:bg-white/5 animate-fadeInUp" style={{ animationDelay: '3400ms', animationDuration: '0.6s' }}>
                  <td className="p-3 text-terminal-text/80">Avg Ticket Size</td>
                  <td className="p-3 text-right text-white font-bold">
                    <AnimatedValue value={metrics.averageTicketSize} format={formatCurrency} delay={4400} />
                  </td>
                </tr>
                <tr className="border-b border-terminal-border/30 hover:bg-white/5 animate-fadeInUp" style={{ animationDelay: '3600ms', animationDuration: '0.6s' }}>
                  <td className="p-3 text-terminal-text/80">Blended Take Rate</td>
                  <td className="p-3 text-right text-white font-bold">
                    <AnimatedValue value={metrics.blendedTakeRate} format={(v) => `${v.toFixed(2)}%`} delay={4600} />
                  </td>
                </tr>
                <tr className="border-b border-terminal-border/30 hover:bg-white/5 animate-fadeInUp" style={{ animationDelay: '3800ms', animationDuration: '0.6s' }}>
                  <td className="p-3 text-terminal-text/80">Blended GPM</td>
                  <td className="p-3 text-right text-white font-bold">
                    <AnimatedValue value={metrics.blendedGPM} format={(v) => `${v.toFixed(2)}%`} delay={4800} />
                  </td>
                </tr>
                <tr className="border-b border-terminal-border/30 hover:bg-white/5 animate-fadeInUp" style={{ animationDelay: '4000ms', animationDuration: '0.6s' }}>
                  <td className="p-3 text-terminal-text/80">Gross Profit (Calculated)</td>
                  <td className="p-3 text-right text-white font-bold">
                    <AnimatedValue value={metrics.grossProfitValidation.calculated} format={formatCurrency} delay={5000} />
                  </td>
                </tr>
                <tr className="hover:bg-white/5 animate-fadeInUp" style={{ animationDelay: '4200ms', animationDuration: '0.6s' }}>
                  <td className="p-3 text-terminal-text/80">Gross Profit (From File)</td>
                  <td className="p-3 text-right text-white font-bold">
                    <AnimatedValue value={metrics.grossProfitValidation.fromFile} format={formatCurrency} delay={5200} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </CardContent>
        </Card>

        {/* Monthly Breakdown */}
        {monthlyData.length > 0 && (
          <Card className="bg-[#1a1a1a] animate-fadeInUp" style={{ animationDelay: '4400ms', animationDuration: '1s' }}>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-terminal-text uppercase tracking-wider">Monthly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-mono text-sm">
                <thead>
                  <tr className="border-b border-terminal-border">
                    <th className="text-left p-3 text-terminal-text/60 uppercase text-xs">Month</th>
                    <th className="text-right p-3 text-terminal-text/60 uppercase text-xs">TPV</th>
                    <th className="text-right p-3 text-terminal-text/60 uppercase text-xs">Net Revenue</th>
                    <th className="text-right p-3 text-terminal-text/60 uppercase text-xs">Gross Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((month, index) => (
                    <tr
                      key={index}
                      className="border-b border-terminal-border/30 hover:bg-white/5 animate-fadeInUp"
                      style={{ animationDelay: `${4600 + (index * 200)}ms`, animationDuration: '0.6s' }}
                    >
                      <td className="p-3 text-terminal-text/80">{month.month}</td>
                      <td className="p-3 text-right text-white">
                        <AnimatedValue value={month.tpv} format={formatCurrency} delay={5400 + (index * 200)} />
                      </td>
                      <td className="p-3 text-right text-white">
                        <AnimatedValue value={month.netRevenue} format={formatCurrency} delay={5600 + (index * 200)} />
                      </td>
                      <td className="p-3 text-right text-white">
                        <AnimatedValue value={month.grossProfit} format={formatCurrency} delay={5800 + (index * 200)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </CardContent>
          </Card>
        )}

        {/* Merchant Performance Section */}
        {merchantData.length > 0 && (
          <Card className="bg-[#1a1a1a] animate-fadeInUp" style={{ animationDelay: '6000ms', animationDuration: '1s' }}>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-terminal-text uppercase tracking-wider">Merchant Performance</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-6">
              {/* Merchant Metrics Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse font-mono text-sm">
                  <thead>
                    <tr className="border-b border-terminal-border">
                      <th className="text-left p-3 text-terminal-text/60 uppercase text-xs">Metric</th>
                      <th className="text-right p-3 text-terminal-text/60 uppercase text-xs">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-terminal-border/30 hover:bg-white/5">
                      <td className="p-3 text-terminal-text/80">Total TPV</td>
                      <td className="p-3 text-right text-white font-bold">
                        <AnimatedValue value={merchantMetrics.totalTPV} format={formatCurrency} delay={6200} />
                      </td>
                    </tr>
                    <tr className="border-b border-terminal-border/30 hover:bg-white/5">
                      <td className="p-3 text-terminal-text/80">Total Net Revenue</td>
                      <td className="p-3 text-right text-white font-bold">
                        <AnimatedValue value={merchantMetrics.totalNetRevenue} format={formatCurrency} delay={6400} />
                      </td>
                    </tr>
                    <tr className="border-b border-terminal-border/30 hover:bg-white/5">
                      <td className="p-3 text-terminal-text/80">Total Gross Profit</td>
                      <td className="p-3 text-right text-white font-bold">
                        <AnimatedValue value={merchantMetrics.totalGrossProfit} format={formatCurrency} delay={6600} />
                      </td>
                    </tr>
                    <tr className="border-b border-terminal-border/30 hover:bg-white/5">
                      <td className="p-3 text-terminal-text/80">Total Transactions</td>
                      <td className="p-3 text-right text-white font-bold">
                        <AnimatedValue value={merchantMetrics.totalTransactions} format={(v) => v.toLocaleString()} delay={6800} />
                      </td>
                    </tr>
                    <tr className="border-b border-terminal-border/30 hover:bg-white/5">
                      <td className="p-3 text-terminal-text/80">Blended Take Rate</td>
                      <td className="p-3 text-right text-white font-bold">
                        <AnimatedValue value={merchantMetrics.blendedTakeRate} format={(v) => `${v.toFixed(2)}%`} delay={7000} />
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5">
                      <td className="p-3 text-terminal-text/80">Blended GPM</td>
                      <td className="p-3 text-right text-white font-bold">
                        <AnimatedValue value={merchantMetrics.blendedGPM} format={(v) => `${v.toFixed(2)}%`} delay={7200} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Merchant Monthly Breakdown */}
              {merchantMonthlyData.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-terminal-text mb-3 uppercase tracking-wider text-sm">Monthly Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse font-mono text-sm">
                      <thead>
                        <tr className="border-b border-terminal-border">
                          <th className="text-left p-3 text-terminal-text/60 uppercase text-xs">Month</th>
                          <th className="text-right p-3 text-terminal-text/60 uppercase text-xs">TPV</th>
                          <th className="text-right p-3 text-terminal-text/60 uppercase text-xs">Net Revenue</th>
                          <th className="text-right p-3 text-terminal-text/60 uppercase text-xs">Gross Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {merchantMonthlyData.map((month, index) => (
                          <tr
                            key={index}
                            className="border-b border-terminal-border/30 hover:bg-white/5"
                          >
                            <td className="p-3 text-terminal-text/80">{month.month}</td>
                            <td className="p-3 text-right text-white">
                              <AnimatedValue value={month.tpv} format={formatCurrency} delay={7400 + (index * 100)} />
                            </td>
                            <td className="p-3 text-right text-white">
                              <AnimatedValue value={month.netRevenue} format={formatCurrency} delay={7600 + (index * 100)} />
                            </td>
                            <td className="p-3 text-right text-white">
                              <AnimatedValue value={month.grossProfit} format={formatCurrency} delay={7800 + (index * 100)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            </CardContent>
          </Card>
        )}

        {/* Channel Performance Section */}
        {channelData.length > 0 && (
          <Card className="bg-[#1a1a1a] animate-fadeInUp" style={{ animationDelay: '8000ms', animationDuration: '1s' }}>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-terminal-text uppercase tracking-wider">Channel Performance</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-6">
              {/* Channel Metrics Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse font-mono text-sm">
                  <thead>
                    <tr className="border-b border-terminal-border">
                      <th className="text-left p-3 text-terminal-text/60 uppercase text-xs">Metric</th>
                      <th className="text-right p-3 text-terminal-text/60 uppercase text-xs">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-terminal-border/30 hover:bg-white/5">
                      <td className="p-3 text-terminal-text/80">Total TPV</td>
                      <td className="p-3 text-right text-white font-bold">
                        <AnimatedValue value={channelMetrics.totalTPV} format={formatCurrency} delay={8200} />
                      </td>
                    </tr>
                    <tr className="border-b border-terminal-border/30 hover:bg-white/5">
                      <td className="p-3 text-terminal-text/80">Total Net Revenue</td>
                      <td className="p-3 text-right text-white font-bold">
                        <AnimatedValue value={channelMetrics.totalNetRevenue} format={formatCurrency} delay={8400} />
                      </td>
                    </tr>
                    <tr className="border-b border-terminal-border/30 hover:bg-white/5">
                      <td className="p-3 text-terminal-text/80">Total Gross Profit</td>
                      <td className="p-3 text-right text-white font-bold">
                        <AnimatedValue value={channelMetrics.totalGrossProfit} format={formatCurrency} delay={8600} />
                      </td>
                    </tr>
                    <tr className="border-b border-terminal-border/30 hover:bg-white/5">
                      <td className="p-3 text-terminal-text/80">Total Transactions</td>
                      <td className="p-3 text-right text-white font-bold">
                        <AnimatedValue value={channelMetrics.totalTransactions} format={(v) => v.toLocaleString()} delay={8800} />
                      </td>
                    </tr>
                    <tr className="border-b border-terminal-border/30 hover:bg-white/5">
                      <td className="p-3 text-terminal-text/80">Blended Take Rate</td>
                      <td className="p-3 text-right text-white font-bold">
                        <AnimatedValue value={channelMetrics.blendedTakeRate} format={(v) => `${v.toFixed(2)}%`} delay={9000} />
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5">
                      <td className="p-3 text-terminal-text/80">Blended GPM</td>
                      <td className="p-3 text-right text-white font-bold">
                        <AnimatedValue value={channelMetrics.blendedGPM} format={(v) => `${v.toFixed(2)}%`} delay={9200} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Channel Monthly Breakdown */}
              {channelMonthlyData.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-terminal-text mb-3 uppercase tracking-wider text-sm">Monthly Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse font-mono text-sm">
                      <thead>
                        <tr className="border-b border-terminal-border">
                          <th className="text-left p-3 text-terminal-text/60 uppercase text-xs">Month</th>
                          <th className="text-right p-3 text-terminal-text/60 uppercase text-xs">TPV</th>
                          <th className="text-right p-3 text-terminal-text/60 uppercase text-xs">Net Revenue</th>
                          <th className="text-right p-3 text-terminal-text/60 uppercase text-xs">Gross Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {channelMonthlyData.map((month, index) => (
                          <tr
                            key={index}
                            className="border-b border-terminal-border/30 hover:bg-white/5"
                          >
                            <td className="p-3 text-terminal-text/80">{month.month}</td>
                            <td className="p-3 text-right text-white">
                              <AnimatedValue value={month.tpv} format={formatCurrency} delay={9400 + (index * 100)} />
                            </td>
                            <td className="p-3 text-right text-white">
                              <AnimatedValue value={month.netRevenue} format={formatCurrency} delay={9600 + (index * 100)} />
                            </td>
                            <td className="p-3 text-right text-white">
                              <AnimatedValue value={month.grossProfit} format={formatCurrency} delay={9800 + (index * 100)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TerminalLayout>
  );
}

