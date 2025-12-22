import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TerminalLayout } from '../components/TerminalLayout';
import { KPICard } from '../components/KPICard';
import { useDataStore } from '../store/useDataStore';
import { FileText, ArrowLeft } from 'lucide-react';

const COLORS = ['#ffffff', '#d4d4d4', '#a3a3a3', '#737373', '#525252', '#404040'];

export function DashboardPage() {
  const navigate = useNavigate();
  const { metrics, dateRange, getMonthlyAggregations, getTopEntities, getTPVDistribution, reset } = useDataStore();

  useEffect(() => {
    if (!metrics) {
      navigate('/');
    }
  }, [metrics, navigate]);

  if (!metrics) {
    return null;
  }

  const handleBack = () => {
    reset();
    navigate('/');
  };

  const monthlyData = getMonthlyAggregations();
  const topEntities = getTopEntities(10);
  const currencyDistribution = getTPVDistribution('currency');
  const countryDistribution = getTPVDistribution('country');
  const distributionData = currencyDistribution.length > 0 ? currencyDistribution : countryDistribution;

  // Prepare profitability data
  const profitabilityData = monthlyData.map(month => ({
    month: month.month,
    'Direct Cost + Scheme Fees + MRA': 
      (month.netRevenue - month.grossProfit),
    'Gross Profit': month.grossProfit,
  }));

  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <TerminalLayout>
      <div className="space-y-8">
        {/* Control Panel Header */}
        <div className="border border-terminal-border p-4 rounded-sm bg-[#1a1a1a] hover:border-terminal-text/30 transition-colors animate-fadeInUp" style={{ animationDelay: '0ms', animationDuration: '1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-terminal-text mb-1">Control Panel</h2>
              <p className="text-terminal-text/60 text-sm">
                Date Range: {formatDate(dateRange.min)} → {formatDate(dateRange.max)}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 border border-terminal-border text-terminal-text/80 hover:bg-white/5 transition-colors rounded-sm text-sm font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Upload New File
              </button>
              <button
                onClick={() => navigate('/report')}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors rounded-sm text-sm font-bold"
              >
                <FileText className="h-4 w-4" />
                View Report
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total TPV"
            value={metrics.totalTPV}
            delay={500}
          />
          <KPICard
            label="Total Net Revenue"
            value={metrics.totalNetRevenue}
            delay={700}
          />
          <KPICard
            label="Total Gross Profit"
            value={metrics.totalGrossProfit}
            delay={900}
          />
          <KPICard
            label="Total Transactions"
            value={metrics.totalTransactions}
            isCurrency={false}
            delay={1100}
          />
          <KPICard
            label="Avg Ticket Size"
            value={metrics.averageTicketSize}
            delay={1300}
          />
          <KPICard
            label="Blended Take Rate"
            value={metrics.blendedTakeRate}
            unit="%"
            delay={1500}
          />
          <KPICard
            label="Blended GPM"
            value={metrics.blendedGPM}
            unit="%"
            delay={1700}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Line Chart */}
          <div className="border border-terminal-border p-6 rounded-sm bg-[#1a1a1a] hover:border-terminal-text/30 transition-colors animate-fadeInUp" style={{ animationDelay: '2000ms', animationDuration: '1s' }}>
            <h3 className="text-terminal-text font-semibold mb-6 uppercase tracking-wider text-sm">TPV vs Net Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#666" fontSize={12} tickLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    color: '#e5e5e5',
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line
                  type="monotone"
                  dataKey="tpv"
                  stroke="#ffffff"
                  strokeWidth={2}
                  name="TPV"
                  dot={{ r: 4, fill: '#ffffff' }}
                  isAnimationActive={true}
                  animationDuration={4000}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="netRevenue"
                  stroke="#737373"
                  strokeWidth={2}
                  name="Net Revenue"
                  dot={{ r: 4, fill: '#737373' }}
                  isAnimationActive={true}
                  animationDuration={4000}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Profitability Composition */}
          <div className="border border-terminal-border p-6 rounded-sm bg-[#1a1a1a] hover:border-terminal-text/30 transition-colors animate-fadeInUp" style={{ animationDelay: '2500ms', animationDuration: '1s' }}>
            <h3 className="text-terminal-text font-semibold mb-6 uppercase tracking-wider text-sm">Profitability Composition</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitabilityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#666" fontSize={12} tickLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    color: '#e5e5e5',
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar
                  dataKey="Direct Cost + Scheme Fees + MRA"
                  stackId="a"
                  fill="#525252"
                  name="Costs"
                  isAnimationActive={true}
                  animationDuration={4000}
                  animationEasing="ease-out"
                />
                <Bar 
                  dataKey="Gross Profit" 
                  stackId="a" 
                  fill="#ffffff" 
                  name="Gross Profit"
                  isAnimationActive={true}
                  animationDuration={4000}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Entities */}
          <div className="border border-terminal-border p-6 rounded-sm bg-[#1a1a1a] hover:border-terminal-text/30 transition-colors animate-fadeInUp" style={{ animationDelay: '3000ms', animationDuration: '1s' }}>
            <h3 className="text-terminal-text font-semibold mb-6 uppercase tracking-wider text-sm">Top 10 Channels/Merchants by TPV</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topEntities} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#666" fontSize={12} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#666" width={100} fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    color: '#e5e5e5',
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Bar 
                  dataKey="tpv" 
                  fill="#ffffff" 
                  name="TPV"
                  isAnimationActive={true}
                  animationDuration={4000}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution Pie Chart */}
          <div className="border border-terminal-border p-6 rounded-sm bg-[#1a1a1a] hover:border-terminal-text/30 transition-colors animate-fadeInUp" style={{ animationDelay: '3500ms', animationDuration: '1s' }}>
            <h3 className="text-terminal-text font-semibold mb-6 uppercase tracking-wider text-sm">
              TPV Distribution by {currencyDistribution.length > 0 ? 'Currency' : 'Country'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={4000}
                  animationEasing="ease-out"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    color: '#e5e5e5',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </TerminalLayout>
  );
}

