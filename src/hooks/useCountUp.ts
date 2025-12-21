import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  duration?: number;
  startOnMount?: boolean;
  delay?: number;
}

export function useCountUp(
  endValue: number,
  options: UseCountUpOptions = {}
): number {
  const { duration = 2000, startOnMount = true, delay = 0 } = options;
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!startOnMount || hasStartedRef.current) return;
    
    const startAnimation = () => {
      hasStartedRef.current = true;
      startTimeRef.current = performance.now();

      const animate = (currentTime: number) => {
      if (!startTimeRef.current) return;

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = endValue * easeOut;
      
      setCount(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (delay > 0) {
      const timeoutId = setTimeout(startAnimation, delay);
      return () => {
        clearTimeout(timeoutId);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      startAnimation();
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [endValue, duration, startOnMount, delay]);

  // Reset when endValue changes
  useEffect(() => {
    if (endValue !== count) {
      hasStartedRef.current = false;
      setCount(0);
    }
  }, [endValue]);

  return Math.round(count * 100) / 100; // Round to 2 decimal places
}

