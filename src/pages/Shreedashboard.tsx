import { useState, useEffect } from "react";
import Layout from "./Layout";

type StatCardProps = {
  label: string;
  value: string | number;
  color?: string;
  icon?: React.ReactNode;
};

const orderStats = [
  { label: "New Orders", value: 0, color: "#6C63FF", icon: "🔔" },
  { label: "Pending", value: 0, color: "#F5A623", icon: "🕐" },
  { label: "Delivered", value: 0, color: "#00B894", icon: "✔" },
  { label: "Cancelled", value: 0, color: "#E74C3C", icon: "✖" },
];

const businessStats = [
  { label: "Total Orders", value: 13, color: "#3B82F6", icon: "🛍" },
  { label: "Products", value: 5, color: "#8B5CF6", icon: "📦" },
  { label: "Users", value: 8, color: "#14B8A6", icon: "👥" },
  { label: "Warehouses", value: 2, color: "#22C55E", icon: "🏠" },
];

const filters = ["Today", "Yesterday", "This Week", "This Month"];

/* ─── Responsive styles injected once ─── */
const CSS = `
  /* ── Global scroll fix ── */
  html, body, #root {
    height: 100%;
    overflow: auto;
  }

  /* ── Layout scroll fix: make the main content area scrollable ── */
  @media (max-width: 768px) {
    /* Common layout shell patterns – covers most sidebar+main setups */
    body > #root > div,
    .layout-root,
    .app-shell,
    .page-wrapper {
      height: 100%;
      overflow: auto;
    }

    /* The content / main panel alongside a sidebar */
    main,
    [class*="content"],
    [class*="main"],
    [class*="page"],
    [class*="body"] {
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch;
      height: auto !important;
      max-height: none !important;
    }
  }

  .dash-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 28px;
  }

  .dash-scroll-wrapper {
    width: 100%;
    box-sizing: border-box;
  }

  @media (max-width: 768px) {
    .dash-scroll-wrapper {
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 24px;
    }
  }

  .dash-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }

  /* Large tablets / small laptops */
  @media (max-width: 1024px) {
    .dash-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Phablets / large phones */
  @media (max-width: 600px) {
    .dash-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .dash-filters button {
      flex: 1 1 calc(50% - 4px);
      text-align: center;
    }
  }

  /* Small phones */
  @media (max-width: 380px) {
    .dash-grid {
      grid-template-columns: 1fr;
    }

    .dash-filters button {
      flex: 1 1 100%;
    }
  }

  .stat-card {
    border-radius: 14px;
    padding: 20px 22px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-3px);
  }

  .stat-card .card-icon {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 52px;
    opacity: 0.2;
    line-height: 1;
    pointer-events: none;
  }

  .stat-card .card-label {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 500;
    color: rgba(255,255,255,0.85);
  }

  .stat-card .card-value {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }

  @media (max-width: 600px) {
    .stat-card {
      padding: 16px 18px;
    }
    .stat-card .card-value {
      font-size: 26px;
    }
    .stat-card .card-icon {
      font-size: 40px;
    }
  }
`;

const Dashboard: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState("Today");

  /* Inject CSS once */
  useEffect(() => {
    const id = "dashboard-responsive-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  return (
    <Layout title="Dashboard" activeNav="Dashboard">
      <div className="dash-scroll-wrapper">
      {/* Breadcrumb */}
      <p style={{ margin: "0 0 18px", fontSize: 13, color: "#999" }}>
        Home &gt;{" "}
        <span style={{ color: "#1a1a1a", fontWeight: 500 }}>Dashboard</span>
      </p>

      {/* Filter Tabs */}
      <div className="dash-filters">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: "7px 18px",
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
              border: "1px solid #D0D0CA",
              background: activeFilter === f ? "#1a1a1a" : "#fff",
              color: activeFilter === f ? "#fff" : "#444",
              fontWeight: activeFilter === f ? 600 : 400,
              transition: "all 0.15s",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Order Status */}
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#999",
          letterSpacing: 1,
          margin: "0 0 14px",
          textTransform: "uppercase",
        }}
      >
        Order Status
      </p>
      <div className="dash-grid">
        {orderStats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Business Overview */}
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#999",
          letterSpacing: 1,
          margin: "0 0 14px",
          textTransform: "uppercase",
        }}
      >
        Business Overview
      </p>
      <div className="dash-grid" style={{ marginBottom: 0 }}>
        {businessStats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>
      </div> {/* end dash-scroll-wrapper */}
    </Layout>
  );
};

function StatCard({ label, value, color = "#6C63FF", icon }: StatCardProps) {
  return (
    <div
      className="stat-card"
      style={{
        background: color,
        boxShadow: `0 2px 8px ${color}33`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 8px 24px ${color}55`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 2px 8px ${color}33`;
      }}
    >
      <span className="card-icon">{icon}</span>
      <p className="card-label">{label}</p>
      <p className="card-value">{value}</p>
    </div>
  );
}

export default Dashboard;