import { useState, useEffect } from 'react';

export const useRateLimit = (cooldownSeconds = 60) => {
  const [lastActionTime, setLastActionTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isLimited, setIsLimited] = useState(false);
  
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (countdown > 0) {
      setIsLimited(true);
      intervalId = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setIsLimited(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [countdown]);
  
  const triggerAction = () => {
    const now = Date.now();
    setLastActionTime(now);
    setCountdown(cooldownSeconds);
    return true;
  };
  
  const canPerformAction = () => {
    return !isLimited;
  };
  
  return {
    triggerAction,
    canPerformAction,
    countdown,
    isLimited
  };
};