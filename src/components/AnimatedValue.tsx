import { useCountUp } from '../hooks/useCountUp';

interface AnimatedValueProps {
  value: number;
  format?: (val: number) => string;
  delay?: number;
  duration?: number;
}

export function AnimatedValue({ value, format, delay = 0, duration = 4000 }: AnimatedValueProps) {
  const animatedValue = useCountUp(value, { duration, delay, startOnMount: true });
  const formatted = format ? format(animatedValue) : animatedValue.toLocaleString();
  return <>{formatted}</>;
}

