import { useIonRouter } from "@ionic/react";

type NavItem = {
  label: string;
  icon: string;
  path?: string;
};

const navItems: Record<string, NavItem[]> = {
  MAIN: [
    { label: "Dashboard", icon: "⊞", path: "/home" },
    { label: "Packers", icon: "⊞", path: "/packers" },
  ],
  CATALOG: [
    { label: "Products", icon: "📦", path: "/product-list" },
  ],
  OPERATIONS: [
    { label: "Orders",           icon: "📄", path: "/orders" },
    { label: "Assign Delivery",  icon: "🚚", path: "/assign-delivery" },
  ],
};

type SidebarProps = {
  activeNav: string;
  onNavChange: (label: string) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ activeNav, onNavChange }) => {
  const router = useIonRouter();

  return (
    <aside
      style={{
        width: "100%",          // fills whatever container width it lives in
        height: "100%",
        background: "#fff",
        borderRight: "1px solid #E8E8E4",
        display: "flex",
        flexDirection: "column",
        padding: "20px 0",
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 20px 24px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "linear-gradient(135deg, #FF7043, #FF5722)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          S
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: "#1a1a1a",
            letterSpacing: 1,
            whiteSpace: "nowrap",
          }}
        >
          Shri Bazar
        </span>
      </div>

      {Object.entries(navItems).map(([section, items]) => (
        <div key={section} style={{ marginBottom: 8 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#999",
              letterSpacing: 1,
              padding: "8px 20px 4px",
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            {section}
          </p>

          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (!item.path) return;
                onNavChange(item.label);
                router.push(item.path);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "9px 20px",
                background: activeNav === item.label ? "#FFF4F0" : "transparent",
                border: "none",
                cursor: item.path ? "pointer" : "default",
                textAlign: "left",
                borderRight:
                  activeNav === item.label
                    ? "3px solid #FF5722"
                    : "3px solid transparent",
                color: activeNav === item.label ? "#FF5722" : "#555",
                fontWeight: activeNav === item.label ? 600 : 400,
                fontSize: 13,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </aside>
  );
};

export default Sidebar;