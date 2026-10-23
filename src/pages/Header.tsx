import React, { useState, useRef, useEffect } from "react";
import { useIonRouter } from "@ionic/react";

type HeaderProps = {
  title: string;
  onMenuClick?: () => void;
};

const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const user = JSON.parse(localStorage.getItem("auth_user") || "null");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useIonRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
    setDropdownOpen(false);
    router.push("/login", "root", "replace");
  };

  const handleProfile = () => {
    setDropdownOpen(false);
    router.push("/profile", "forward", "push");
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userName: string = user?.name || "User";
  const initials = getInitials(userName);

  return (
    <>
      <style>{`
        .header-avatar-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #F5F5F0;
          border: 1px solid #E0E0DA;
          border-radius: 8px;
          padding: 5px 10px 5px 5px;
          cursor: pointer;
          transition: background 0.15s;
          position: relative;
        }
        .header-avatar-btn:hover {
          background: #EBEBЕ6;
        }
        .header-avatar-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #00B894;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }
        .header-username {
          font-size: 13px;
          font-weight: 500;
          color: #333;
          max-width: 110px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .header-chevron {
          font-size: 10px;
          color: #999;
          margin-left: 2px;
          transition: transform 0.2s;
        }
        .header-chevron.open {
          transform: rotate(180deg);
        }
        .header-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: #fff;
          border: 1px solid #E0E0DA;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.10);
          min-width: 180px;
          z-index: 1000;
          overflow: hidden;
          animation: dropdownFadeIn 0.15s ease;
        }
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .header-dropdown-header {
          padding: 12px 14px 10px;
          border-bottom: 1px solid #F0F0EA;
        }
        .header-dropdown-name {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .header-dropdown-email {
          font-size: 12px;
          color: #999;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .header-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          font-size: 14px;
          color: #333;
          cursor: pointer;
          transition: background 0.12s;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }
        .header-dropdown-item:hover {
          background: #F5F5F0;
        }
        .header-dropdown-item.logout {
          color: #e53e3e;
          border-top: 1px solid #F0F0EA;
        }
        .header-dropdown-item.logout:hover {
          background: #FFF5F5;
        }
      `}</style>

      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #E8E8E4",
          padding: "0 28px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        {/* Left: hamburger + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onMenuClick}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#666", lineHeight: 1 }}
          >
            ☰
          </button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>
            {title}
          </h1>
        </div>

        {/* Right: bell + user */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#666" }}
          >
            🔔
          </button>

          {/* User avatar + dropdown */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              className="header-avatar-btn"
              onClick={() => setDropdownOpen((o) => !o)}
            >
              <div className="header-avatar-circle">{initials}</div>
              {/* <span className="header-username">{userName}</span> */}
              <span className={`header-chevron ${dropdownOpen ? "open" : ""}`}>▼</span>
            </button>

            {dropdownOpen && (
              <div className="header-dropdown">
                {/* User info header */}
                <div className="header-dropdown-header">
                  <div className="header-dropdown-name">{userName}</div>
                  {user?.email && (
                    <div className="header-dropdown-email">{user.email}</div>
                  )}
                </div>

                {/* Profile */}
                <button className="header-dropdown-item" onClick={handleProfile}>
                  <span>👤</span> My Profile
                </button>

                {/* Logout */}
                <button className="header-dropdown-item logout" onClick={handleLogout}>
                  <span>🚪</span> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;