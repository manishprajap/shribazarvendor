import React, { useEffect, useState, useCallback } from 'react';
import {
  IonSkeletonText,
} from '@ionic/react';
import Layout from './Layout';
import { apiGet } from '../api';
import Footer from '../components/footer';
// ─── Types ────────────────────────────────────────────────────────────────────
interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bg: string;
  trend?: string;
  trendUp?: boolean;
}

interface Order {
  id: number | string;
  customer_name?: string;
  total?: number | string;
  status?: string;
  created_at?: string;
}

interface DashboardData {
  total_orders?: number;
  today_orders?: number;
  total_revenue?: number;
  today_revenue?: number;
  total_products?: number;
  pending_orders?: number;
  recent_orders?: Order[];
}


// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(val?: number | string) {
  const n = parseFloat(String(val ?? 0));
  return isNaN(n) ? '₹0' : `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

// ─── Inline styles ────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  // Page skeleton
  page: {
    minHeight: '100%',
    background: '#F5F5F0',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },

  // Hero banner
  hero: {
    background: 'linear-gradient(135deg, #FF7043 0%, #FF5722 60%, #E64A19 100%)',
    borderRadius: '0 0 28px 28px',
    padding: '18px 17px 30px',
    marginBottom: '-20px',
    position: 'relative',
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 60%),' +
      'radial-gradient(circle at 10% 80%, rgba(0,0,0,0.08) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  heroInner: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    position: 'relative',
    zIndex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.25)',
    backdropFilter: 'blur(8px)',
    border: '2px solid rgba(255,255,255,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  heroText: { flex: 1, minWidth: 0 },
  greeting: { margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5 },
  heroName: { margin: '2px 0 0', fontSize: 22, fontWeight: 700, color: '#fff' },
  heroSub: { margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  notifBtn: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, flexShrink: 0,
    position: 'relative', overflow: 'hidden',
  },

  // Section wrapper
  section: { padding: '28px 20px 0' },
  sectionHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  sectionTitle: {
    margin: 0, fontSize: 15, fontWeight: 700, color: '#1a1a1a',
  },
  viewAll: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, color: '#FF5722', fontWeight: 600,
    padding: '4px 0',
  },

  // Stat grid
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(125px, 1fr))',
    gap: 12,
  },
  statCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  statIconWrap: {
    width: 40, height: 40,
    borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20,
  },
  statValue: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: '#1a1a1a',
    lineHeight: 1.2,
  },
  statLabel: {
    margin: 0, fontSize: 12, color: '#888', fontWeight: 500,
  },
  statTrendUp: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    fontSize: 11, fontWeight: 600, color: '#10b981',
    background: '#d1fae5', padding: '2px 7px', borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statTrendDown: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    fontSize: 11, fontWeight: 600, color: '#ef4444',
    background: '#fee2e2', padding: '2px 7px', borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statAccentBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 3,
    borderRadius: '0 0 16px 16px',
  },

  // Order card
  orderCard: {
    background: '#fff',
    borderRadius: 14,
    padding: '14px 16px',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 5px rgba(0,0,0,0.05)',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  orderLeft: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 },
  orderIdBadge: {
    width: 42, height: 42, borderRadius: 10,
    background: '#FFF4F0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#FF5722',
    flexShrink: 0,
  },
  orderCustomer: {
    margin: 0, fontSize: 13, fontWeight: 600, color: '#1a1a1a',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  orderDate: { margin: '2px 0 0', fontSize: 11, color: '#aaa' },
  orderRight: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0,
  },
  orderAmount: { margin: 0, fontSize: 14, fontWeight: 700, color: '#1a1a1a' },
  orderStatus: {
    fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
  },

  // Quick actions
  quickGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
  },
  quickCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '16px 8px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 8,
    boxShadow: '0 1px 5px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    position: 'relative', overflow: 'hidden',
    border: 'none',
  },
  quickIcon: { fontSize: 26 },
  quickLabel: {
    margin: 0, fontSize: 11, fontWeight: 600, color: '#444', textAlign: 'center',
  },

  // Error / empty
  errorBanner: {
    margin: '23px 20px 0',
    background: '#FFF3F3', border: '1px solid #F5C6CB',
    borderRadius: 10, padding: '12px 16px',
    color: '#C0392B', fontSize: 13,
    display: 'flex', alignItems: 'center', gap: 10,
  },
  retryBtn: {
    marginLeft: 'auto', background: '#E74C3C', color: '#fff',
    border: 'none', borderRadius: 6, padding: '4px 12px',
    fontSize: 12, cursor: 'pointer',
  },
  emptyBox: {
    textAlign: 'center', padding: '32px 0',
    color: '#bbb', fontSize: 13,
  },

  // Footer
  footer: {
    marginTop: 'auto',
    padding: '24px 20px 20px',
  },
  footerInner: {
    background: '#fff',
    borderRadius: 16,
    padding: '18px 20px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  },
  footerTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottom: '1px solid #F0F0EA',
  },
  footerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  footerLogo: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #FF7043, #FF5722)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
  },
  footerBrandName: {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
    color: '#1a1a1a',
  },
  footerBrandTagline: {
    margin: 0,
    fontSize: 11,
    color: '#aaa',
  },
  footerLinks: {
    display: 'flex',
    gap: 16,
  },
  footerLink: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 11,
    color: '#888',
    fontWeight: 500,
    padding: 0,
  },
  footerBottom: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  footerCopy: {
    margin: 0,
    fontSize: 11,
    color: '#bbb',
  },
  footerVersion: {
    fontSize: 11,
    color: '#ddd',
    background: '#F5F5F0',
    padding: '2px 8px',
    borderRadius: 20,
    fontWeight: 600,
  },
};


// ─── Component ────────────────────────────────────────────────────────────────
const Home: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Read vendor from localStorage (set during login)
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('auth_user') || '{}'); }
    catch { return {}; }
  })();

  const fetchDashboard = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const res = await apiGet('/vendor');
      const json = res?.data ?? res;
      setData(json);
    } catch {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ── Stat cards definition ──────────────────────────────────────────────────
  const stats: StatCard[] = [
    {
      label: "Today's Orders",
      value: loading ? '–' : (data?.today_orders ?? 0),
      icon: '🛒', color: '#f97316', bg: '#fff7ed',
      trend: '+12%', trendUp: true,
    },
    {
      label: "Today's Revenue",
      value: loading ? '–' : formatCurrency(data?.today_revenue),
      icon: '💰', color: '#10b981', bg: '#d1fae5',
      trend: '+8%', trendUp: true,
    },
    {
      label: 'Total Orders',
      value: loading ? '–' : (data?.total_orders ?? 0),
      icon: '📦', color: '#3b82f6', bg: '#dbeafe',
    },
    {
      label: 'Pending',
      value: loading ? '–' : (data?.pending_orders ?? 0),
      icon: '⏳', color: '#f59e0b', bg: '#fef3c7',
    },
    {
      label: 'Total Revenue',
      value: loading ? '–' : formatCurrency(data?.total_revenue),
      icon: '📈', color: '#8b5cf6', bg: '#ede9fe',
    },
    {
      label: 'Products',
      value: loading ? '–' : (data?.total_products ?? 0),
      icon: '🏪', color: '#ec4899', bg: '#fce7f3',
    },
  ];

  return (
    <Layout title="Dashboard" activeNav="Dashboard">
      <div style={styles.page}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div style={styles.hero}>
          <div style={styles.heroBg} />
          <div style={styles.heroInner}>
            <div style={styles.avatar}>
              {user?.name ? user.name[0].toUpperCase() : 'V'}
            </div>
            <div style={styles.heroText}>
              <p style={styles.greeting}>Good {getGreeting()},</p>
              <h1 style={styles.heroName}>{user?.name ?? 'Vendor'}</h1>
              <p style={styles.heroSub}>Here's your store overview</p>
            </div>
            <button
              style={styles.notifBtn}
              onClick={() => {/* future: notification panel */ }}
            >
              🔔
            </button>
          </div>
        </div>

        {/* ── Error banner ─────────────────────────────────────────────────── */}
        {error && (
          <div style={styles.errorBanner}>
            <span>⚠️</span>
            <span style={{ flex: 1 }}>{error}</span>
            <button style={styles.retryBtn} onClick={fetchDashboard}>Retry</button>
          </div>
        )}

        {/* ── Stat cards ───────────────────────────────────────────────────── */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Overview</h2>
          </div>
          <div style={styles.statGrid}>
            {stats.map((s) => (
              <div key={s.label} style={styles.statCard}>
                <div style={{ ...styles.statIconWrap, background: s.bg }}>
                  <span>{s.icon}</span>
                </div>
                {loading ? (
                  <IonSkeletonText
                    animated
                    style={{ width: '60px', height: '24px', borderRadius: '6px' }}
                  />
                ) : (
                  <p style={styles.statValue}>{s.value}</p>
                )}
                <p style={styles.statLabel}>{s.label}</p>
                {s.trend && (
                  <span style={s.trendUp ? styles.statTrendUp : styles.statTrendDown}>
                    {s.trendUp ? '▲' : '▼'} {s.trend}
                  </span>
                )}
                {/* Accent bottom bar */}
                <div style={{ ...styles.statAccentBar, background: s.color }} />
              </div>
            ))}
          </div>
        </div>
      </div>
        <Footer />
    </Layout>
    
  );
};

export default Home;