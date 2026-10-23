import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { apiGet } from '../api';
import { useNewOrderSound } from '../hooks/useNewOrderSound';
import { Order } from '../types/orders.types';

interface NewOrderAlertContextValue {
  isRinging: boolean;
  newOrderCount: number;
  soundUnlocked: boolean;
  enableSound: () => void;
  stopRinging: () => void;
}

const NewOrderAlertContext = createContext<NewOrderAlertContextValue | null>(null);

export const useNewOrderAlert = (): NewOrderAlertContextValue => {
  const ctx = useContext(NewOrderAlertContext);
  if (!ctx) {
    // Provider mount nahi hua to safe fallback — crash mat karo
    return {
      isRinging: false,
      newOrderCount: 0,
      soundUnlocked: true,
      enableSound: () => {},
      stopRinging: () => {},
    };
  }
  return ctx;
};

interface NewOrderAlertProviderProps {
  enabled: boolean;
  children: ReactNode;
  pollMs?: number;
}

export const NewOrderAlertProvider: React.FC<NewOrderAlertProviderProps> = ({
  enabled,
  children,
  pollMs = 15000,
}) => {
  const [pendingOrderIds, setPendingOrderIds] = useState<number[]>([]);
  const pollTimerRef = useRef<number | null>(null);

  const fetchPendingOrderIds = async () => {
    try {
      const json: { success?: boolean; data?: Order[] } = await apiGet('/vendor/orders');
      const orders = json?.data ?? [];
      const pending = orders
        .filter((o) => {
          const st = (o.payment_status ?? o.status ?? '').toLowerCase();
          return st === 'new' || st === 'confirmed' || st === 'pending';
        })
        .map((o) => o.id);
      setPendingOrderIds(pending);
    } catch (err) {
      console.warn('NewOrderAlertProvider: poll failed', err);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setPendingOrderIds([]);
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
      return;
    }
    fetchPendingOrderIds();
    pollTimerRef.current = window.setInterval(fetchPendingOrderIds, pollMs);
    return () => { if (pollTimerRef.current) window.clearInterval(pollTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, pollMs]);

  const { isRinging, newOrderCount, soundUnlocked, enableSound, stopRinging } =
    useNewOrderSound(enabled ? pendingOrderIds : [], { soundUrl: '/order_ring.mp3' });

  return (
    <NewOrderAlertContext.Provider value={{ isRinging, newOrderCount, soundUnlocked, enableSound, stopRinging }}>
      {children}
    </NewOrderAlertContext.Provider>
  );
};