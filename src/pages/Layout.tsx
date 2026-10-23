import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

type LayoutProps = {
  children: React.ReactNode;
  title: string;
  activeNav: string;
  onNavChange?: (label: string) => void;
};

const SIDEBAR_WIDTH = 220;

const Layout: React.FC<LayoutProps> = ({
  children,
  activeNav,
  onNavChange,
}) => {
  const [nav, setNav] = useState(activeNav);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const handleNavChange = (label: string) => {
    setNav(label);
    onNavChange?.(label);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        overflow: "hidden",
        background: "#F5F5F0",
      }}
    >
      {isMobile ? (
        /* ── Mobile overlay sidebar ── */
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: sidebarOpen ? 0 : `-${SIDEBAR_WIDTH + 10}px`,
              height: "100%",
              width: SIDEBAR_WIDTH,
              zIndex: 1000,
              transition: "left 0.28s ease",
              boxShadow: sidebarOpen ? "2px 0 16px rgba(0,0,0,0.18)" : "none",
            }}
          >
            <Sidebar activeNav={nav} onNavChange={handleNavChange} />
          </div>

          {/* Dim overlay */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.35)",
                zIndex: 999,
              }}
            />
          )}
        </>
      ) : (
        /* ── Desktop inline sidebar (part of flex row) ── */
        <div
          style={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            height: "100dvh",
            overflowY: "auto",
          }}
        >
          <Sidebar activeNav={nav} onNavChange={handleNavChange} />
        </div>
      )}

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      {/* flex: 1 takes all remaining space regardless of mode */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0, // prevent flex child from overflowing
          overflow: "hidden",
        }}
      >
        <Header
          onMenuClick={() => setSidebarOpen(true)} title={""}        />

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isMobile ? "5px" : "24px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
