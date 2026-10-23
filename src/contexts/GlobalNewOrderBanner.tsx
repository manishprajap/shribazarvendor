import React from 'react';
import { useNewOrderAlert } from '../contexts/NewOrderAlertContext';

const GlobalNewOrderBanner: React.FC = () => {
  const { isRinging, newOrderCount, soundUnlocked, enableSound, stopRinging } = useNewOrderAlert();

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      {isRinging && (
        <div style={{ background: '#ff3b30', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
          <span>🔔 {newOrderCount} New Order{newOrderCount > 1 ? 's' : ''}!</span>
          <button onClick={stopRinging} style={{ background: '#fff', color: '#ff3b30', border: 'none', padding: '6px 16px', borderRadius: 20, fontWeight: 700, cursor: 'pointer' }}>
            Stop
          </button>
        </div>
      )}
      {!soundUnlocked && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
          <button onClick={enableSound} style={{ background: '#ffc107', border: 'none', padding: '8px 16px', borderRadius: 20, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            🔔 Enable Order Sound Alerts
          </button>
        </div>
      )}
    </div>
  );
};

export default GlobalNewOrderBanner;