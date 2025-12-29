import { useCountUp } from '../hooks/useCountUp';
import { Card, CardContent } from './ui/card';

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  isCurrency?: boolean;
  delay?: number;
}

export function KPICard({ label, value, unit, subtitle, isCurrency = true, delay = 0 }: KPICardProps) {
  // Count-up starts after fade-in animation completes (1s) + a small buffer
  const countUpDelay = delay + 1000;
  const animatedValue = typeof value === 'number' ? useCountUp(value, { duration: 4000, delay: countUpDelay }) : value;

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (!isCurrency) {
        // For non-currency values (like transaction count), just format with commas
        return val.toLocaleString();
      }
      // Currency formatting
      if (val >= 1000000) {
        return `$${(val / 1000000).toFixed(2)}M`;
      } else if (val >= 1000) {
        return `$${(val / 1000).toFixed(2)}K`;
      } else {
        return `$${val.toFixed(2)}`;
      }
    }
    return val;
  };

  return (
    <Card 
      className="bg-[#1a1a1a] animate-fadeInUp"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-6">
        <div className="text-sm text-terminal-text/60 uppercase tracking-wider mb-2 font-medium">{label}</div>
        <div className="text-3xl font-bold text-terminal-text font-mono mb-1">
          {formatValue(animatedValue)}
          {unit && <span className="text-xl ml-1 text-terminal-text/60">{unit}</span>}
        </div>
        {subtitle && (
          <div className="text-xs text-terminal-text/40 mt-2">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
}

