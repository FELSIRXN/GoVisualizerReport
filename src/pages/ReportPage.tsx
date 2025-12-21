import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TerminalLayout } from '../components/TerminalLayout';
import { useDataStore } from '../store/useDataStore';
import { ArrowLeft } from 'lucide-react';
import { AnimatedValue } from '../components/AnimatedValue';

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

  return (
    <TerminalLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-6 animate-fadeInUp" style={{ animationDelay: '0ms', animationDuration: '1s' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 border border-terminal-border text-terminal-text/80 hover:bg-white/5 transition-colors rounded-sm text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Executive Summary */}
        <div className="border border-terminal-border p-6 rounded-sm bg-[#1a1a1a] hover:border-terminal-text/30 transition-colors animate-fadeInUp" style={{ animationDelay: '200ms', animationDuration: '1s' }}>
          <h2 className="text-xl font-bold text-terminal-text mb-4 uppercase tracking-wider">Executive Summary</h2>
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
        </div>

        {/* Key Findings */}
        <div className="border border-terminal-border p-6 rounded-sm bg-[#1a1a1a] hover:border-terminal-text/30 transition-colors animate-fadeInUp" style={{ animationDelay: '1800ms', animationDuration: '1s' }}>
          <h2 className="text-xl font-bold text-terminal-text mb-4 uppercase tracking-wider">Key Findings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-terminal-border p-4 rounded-sm hover:border-terminal-text/30 transition-colors animate-fadeInUp" style={{ animationDelay: '2000ms', animationDuration: '0.8s' }}>
              <h3 className="text-terminal-text/80 font-semibold mb-2 text-xs uppercase">Top Performing Month</h3>
              <p className="text-terminal-text/60 text-sm mb-1">Month: {topMonth.month}</p>
              <p className="text-white font-mono text-xl font-bold">
                <AnimatedValue value={topMonth.tpv} format={formatCurrency} delay={2800} />
              </p>
              <p className="text-terminal-text/40 text-xs mt-2">
                Net Revenue: <AnimatedValue value={topMonth.netRevenue} format={formatCurrency} delay={3000} />
              </p>
            </div>
            <div className="border border-terminal-border p-4 rounded-sm hover:border-terminal-text/30 transition-colors animate-fadeInUp" style={{ animationDelay: '2200ms', animationDuration: '0.8s' }}>
              <h3 className="text-terminal-text/80 font-semibold mb-2 text-xs uppercase">Lowest Performing Month</h3>
              <p className="text-terminal-text/60 text-sm mb-1">Month: {lowestMonth.month}</p>
              <p className="text-white font-mono text-xl font-bold">
                <AnimatedValue value={lowestMonth.tpv} format={formatCurrency} delay={3200} />
              </p>
              <p className="text-terminal-text/40 text-xs mt-2">
                Net Revenue: <AnimatedValue value={lowestMonth.netRevenue} format={formatCurrency} delay={3400} />
              </p>
            </div>
          </div>
        </div>

        {/* Metric Tables */}
        <div className="border border-terminal-border p-6 rounded-sm bg-[#1a1a1a] hover:border-terminal-text/30 transition-colors animate-fadeInUp" style={{ animationDelay: '2400ms', animationDuration: '1s' }}>
          <h2 className="text-xl font-bold text-terminal-text mb-4 uppercase tracking-wider">Consolidated Metrics</h2>
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
        </div>

        {/* Monthly Breakdown */}
        {monthlyData.length > 0 && (
          <div className="border border-terminal-border p-6 rounded-sm bg-[#1a1a1a] hover:border-terminal-text/30 transition-colors animate-fadeInUp" style={{ animationDelay: '4400ms', animationDuration: '1s' }}>
            <h2 className="text-xl font-bold text-terminal-text mb-4 uppercase tracking-wider">Monthly Breakdown</h2>
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
          </div>
        )}
      </div>
    </TerminalLayout>
  );
}

