import React, { useState } from "react";
import Layout from "./Layout";
import { useIonRouter } from "@ionic/react";
import { apiPost } from "../api";

/* ─────────────────────────── styles ─────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap');

  .profile-page * { box-sizing: border-box; }

  /* hero banner */
  .profile-banner {
    background: linear-gradient(135deg, #00B894 0%, #00897B 100%);
    border-radius: 14px;
    padding: 36px 32px 64px;
    position: relative;
    overflow: hidden;
    margin-bottom: 0;
  }
  .profile-banner::before {
    content: "";
    position: absolute;
    top: -40px; right: -40px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
  }
  .profile-banner::after {
    content: "";
    position: absolute;
    bottom: -60px; left: 60px;
    width: 260px; height: 260px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
  }
  .profile-banner-title {
    font-family: 'DM Serif Display', serif;
    font-size: 26px;
    color: #fff;
    margin: 0 0 4px;
  }
  .profile-banner-sub {
    font-size: 13px;
    color: rgba(255,255,255,0.75);
    font-family: 'DM Sans', sans-serif;
  }

  /* avatar card — overlaps banner */
  .profile-card-wrap {
    padding: 0 32px;
    margin-top: -44px;
    position: relative;
    z-index: 2;
  }
  .profile-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    padding: 28px 28px 24px;
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
  }
  .profile-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg,#00B894,#00695C);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Serif Display', serif;
    font-size: 28px;
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(0,184,148,0.35);
    position: relative;
  }
  .profile-avatar-edit {
    position: absolute;
    bottom: 0; right: 0;
    width: 26px; height: 26px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid #00B894;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px;
    cursor: pointer;
  }
  .profile-meta { flex: 1; min-width: 180px; }
  .profile-meta-name {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    color: #1a1a1a;
    margin: 0 0 4px;
  }
  .profile-meta-role {
    font-size: 13px;
    color: #00B894;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .profile-meta-since {
    font-size: 12px;
    color: #aaa;
    margin-top: 4px;
    font-family: 'DM Sans', sans-serif;
  }
  .profile-edit-btn {
    margin-left: auto;
    padding: 9px 22px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.18s;
    border: 2px solid #00B894;
    background: transparent;
    color: #00B894;
  }
  .profile-edit-btn:hover { background: #00B894; color: #fff; }
  .profile-edit-btn.active { background: #00B894; color: #fff; }

  /* section */
  .profile-section {
    background: #fff;
    border-radius: 14px;
    padding: 24px 28px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    animation: fadeUp 0.3s ease both;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .profile-section-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #bbb;
    margin: 0 0 18px;
    padding-bottom: 10px;
    border-bottom: 1px solid #F0F0EA;
  }

  /* field grid */
  .profile-field-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  .profile-field-grid.full { grid-template-columns: 1fr; }

  @media (max-width: 600px) {
    .profile-field-grid { grid-template-columns: 1fr; }
    .profile-card { flex-direction: column; align-items: flex-start; }
    .profile-edit-btn { margin-left: 0; }
    .profile-banner { padding: 28px 20px 56px; }
    .profile-card-wrap { padding: 0 16px; }
  }

  /* field */
  .pf-group { display: flex; flex-direction: column; gap: 5px; }
  .pf-label {
    font-size: 12px;
    font-weight: 600;
    color: #999;
    font-family: 'DM Sans', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .pf-value {
    font-size: 15px;
    color: #222;
    font-family: 'DM Sans', sans-serif;
    padding: 2px 0;
  }
  .pf-input {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #222;
    padding: 9px 12px;
    border: 1.5px solid #E0E0DA;
    border-radius: 8px;
    outline: none;
    transition: border-color 0.18s;
    background: #FAFAF8;
    width: 100%;
  }
  .pf-input:focus { border-color: #00B894; background: #fff; }

  /* password toggle */
  .pf-pw-wrap { position: relative; }
  .pf-pw-wrap .pf-input { padding-right: 38px; }
  .pf-pw-eye {
    position: absolute;
    right: 10px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none;
    cursor: pointer; font-size: 16px;
    color: #aaa;
    padding: 0;
    line-height: 1;
  }

  /* save bar */
  .profile-save-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 4px;
  }
  .profile-save-btn {
    padding: 10px 28px;
    background: #00B894;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: background 0.18s;
  }
  .profile-save-btn:hover { background: #00997A; }
  .profile-save-btn:disabled { background: #ccc; cursor: not-allowed; }
  .profile-cancel-btn {
    padding: 10px 20px;
    background: transparent;
    color: #777;
    border: 1.5px solid #E0E0DA;
    border-radius: 8px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.15s;
  }
  .profile-cancel-btn:hover { border-color: #bbb; color: #444; }

  /* toast */
  .profile-toast {
    position: fixed;
    bottom: 28px; left: 50%;
    transform: translateX(-50%) translateY(0);
    background: #1a1a1a;
    color: #fff;
    padding: 11px 22px;
    border-radius: 10px;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    box-shadow: 0 6px 24px rgba(0,0,0,0.18);
    animation: toastIn 0.25s ease;
    z-index: 9999;
  }
  .profile-toast.success { background: #00B894; }
  .profile-toast.error   { background: #e53e3e; }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(16px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  /* stats row */
  .profile-stats {
    display: flex;
    gap: 1px;
    background: #F0F0EA;
    border-radius: 12px;
    overflow: hidden;
  }
  .profile-stat {
    flex: 1;
    background: #fff;
    padding: 16px 12px;
    text-align: center;
  }
  .profile-stat-val {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    color: #00B894;
  }
  .profile-stat-lbl {
    font-size: 11px;
    color: #aaa;
    font-family: 'DM Sans', sans-serif;
    margin-top: 2px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

/* ─────────────────────────── types ─────────────────────────── */
type UserData = {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  shop_name?: string;
  address?: string;
  role?: string;
  created_at?: string;
};

type Toast = { msg: string; type: "success" | "error" } | null;

/* ─────────────────────────── helpers ─────────────────────────── */
const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

const fmtDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
};

/* ─────────────────────────── component ─────────────────────────── */
const Profile: React.FC = () => {
  const router = useIonRouter();
  const stored: UserData = JSON.parse(localStorage.getItem("auth_user") || "null") ?? {};

  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [toast,   setToast]     = useState<Toast>(null);

  /* profile fields */
  const [name,      setName]      = useState(stored.name      ?? "");
  const [email,     setEmail]     = useState(stored.email     ?? "");
  const [phone,     setPhone]     = useState(stored.phone     ?? "");
  const [shopName,  setShopName]  = useState(stored.shop_name ?? "");
  const [address,   setAddress]   = useState(stored.address   ?? "");

  /* password fields */
  const [curPw,     setCurPw]     = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCur,   setShowCur]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [showCon,   setShowCon]   = useState(false);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── save profile ── */
  const handleSaveProfile = async () => {
    if (!name.trim())  { showToast("Name is required.", "error"); return; }
    if (!email.trim()) { showToast("Email is required.", "error"); return; }

    setSaving(true);
    try {
      const res = await apiPost("/vendor/update-profile", {
        name, email, phone, shop_name: shopName, address,
        vendor_id: stored.id,
      });
      if (!res.success) throw new Error(res.message || "Update failed.");

      // persist to localStorage
      const updated = { ...stored, name, email, phone, shop_name: shopName, address };
      localStorage.setItem("auth_user", JSON.stringify(updated));

      setEditing(false);
      showToast("Profile updated successfully!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Something went wrong.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── change password ── */
  const handleChangePassword = async () => {
    if (!curPw || !newPw || !confirmPw) {
      showToast("Please fill all password fields.", "error"); return;
    }
    if (newPw !== confirmPw) {
      showToast("New passwords do not match.", "error"); return;
    }
    if (newPw.length < 6) {
      showToast("Password must be at least 6 characters.", "error"); return;
    }

    setSaving(true);
    try {
      const res = await apiPost("/vendor/change-password", {
        current_password: curPw,
        new_password: newPw,
        new_password_confirmation: confirmPw,
        vendor_id: stored.id,
      });
      if (!res.success) throw new Error(res.message || "Password change failed.");

      setCurPw(""); setNewPw(""); setConfirmPw("");
      showToast("Password changed successfully!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Something went wrong.", "error");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setName(stored.name ?? "");
    setEmail(stored.email ?? "");
    setPhone(stored.phone ?? "");
    setShopName(stored.shop_name ?? "");
    setAddress(stored.address ?? "");
    setEditing(false);
  };

  /* ── render ── */
  return (
    <Layout title="Profile" activeNav="Profile">
      <style>{css}</style>

      <div className="profile-page" style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Banner ── */}
        <div className="profile-banner">
          <p className="profile-banner-title">My Profile</p>
          <p className="profile-banner-sub">Manage your account information and settings</p>
        </div>

        {/* ── Avatar card ── */}
        <div className="profile-card-wrap">
          <div className="profile-card">
            <div className="profile-avatar">
              {getInitials(name)}
              <div className="profile-avatar-edit" title="Change photo">✏️</div>
            </div>
            <div className="profile-meta">
              <p className="profile-meta-name">{name || "—"}</p>
              <p className="profile-meta-role">{stored.role ?? "Vendor"}</p>
              <p className="profile-meta-since">Member since {fmtDate(stored.created_at)}</p>
            </div>
            <button
              className={`profile-edit-btn ${editing ? "active" : ""}`}
              onClick={() => editing ? cancelEdit() : setEditing(true)}
            >
              {editing ? "✕  Cancel" : "✏️  Edit Profile"}
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="profile-stats">
          <div className="profile-stat">
            <div className="profile-stat-val">—</div>
            <div className="profile-stat-lbl">Products</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-val">—</div>
            <div className="profile-stat-lbl">Orders</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-val">—</div>
            <div className="profile-stat-lbl">Reviews</div>
          </div>
        </div>

        {/* ── Personal Info ── */}
        <div className="profile-section" style={{ animationDelay: "0.05s" }}>
          <p className="profile-section-title">Personal Information</p>

          <div className="profile-field-grid">
            {/* Name */}
            <div className="pf-group">
              <span className="pf-label">Full Name</span>
              {editing
                ? <input className="pf-input" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
                : <span className="pf-value">{name || "—"}</span>}
            </div>

            {/* Email */}
            <div className="pf-group">
              <span className="pf-label">Email Address</span>
              {editing
                ? <input className="pf-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
                : <span className="pf-value">{email || "—"}</span>}
            </div>

            {/* Phone */}
            <div className="pf-group">
              <span className="pf-label">Phone Number</span>
              {editing
                ? <input className="pf-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" />
                : <span className="pf-value">{phone || "—"}</span>}
            </div>

            {/* Shop Name */}
            <div className="pf-group">
              <span className="pf-label">Shop / Business Name</span>
              {editing
                ? <input className="pf-input" value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Shop name" />
                : <span className="pf-value">{shopName || "—"}</span>}
            </div>
          </div>

          {/* Address — full width */}
          <div className="profile-field-grid full" style={{ marginTop: 18 }}>
            <div className="pf-group">
              <span className="pf-label">Address</span>
              {editing
                ? <textarea
                    className="pf-input"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Full address"
                    style={{ height: 80, resize: "vertical" }}
                  />
                : <span className="pf-value" style={{ whiteSpace: "pre-wrap" }}>{address || "—"}</span>}
            </div>
          </div>

          {/* Save / Cancel */}
          {editing && (
            <div className="profile-save-bar" style={{ marginTop: 22 }}>
              <button className="profile-save-btn" onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button className="profile-cancel-btn" onClick={cancelEdit}>Cancel</button>
            </div>
          )}
        </div>

        {/* ── Change Password ── */}
        <div className="profile-section" style={{ animationDelay: "0.1s" }}>
          <p className="profile-section-title">Change Password</p>

          <div className="profile-field-grid">
            {/* Current */}
            <div className="pf-group">
              <span className="pf-label">Current Password</span>
              <div className="pf-pw-wrap">
                <input
                  className="pf-input"
                  type={showCur ? "text" : "password"}
                  value={curPw}
                  onChange={e => setCurPw(e.target.value)}
                  placeholder="Enter current password"
                />
                <button className="pf-pw-eye" onClick={() => setShowCur(p => !p)}>
                  {showCur ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* spacer on desktop */}
            <div />

            {/* New */}
            <div className="pf-group">
              <span className="pf-label">New Password</span>
              <div className="pf-pw-wrap">
                <input
                  className="pf-input"
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="Min. 6 characters"
                />
                <button className="pf-pw-eye" onClick={() => setShowNew(p => !p)}>
                  {showNew ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div className="pf-group">
              <span className="pf-label">Confirm New Password</span>
              <div className="pf-pw-wrap">
                <input
                  className="pf-input"
                  type={showCon ? "text" : "password"}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Repeat new password"
                />
                <button className="pf-pw-eye" onClick={() => setShowCon(p => !p)}>
                  {showCon ? "🙈" : "👁"}
                </button>
              </div>
            </div>
          </div>

          <div className="profile-save-bar" style={{ marginTop: 22 }}>
            <button className="profile-save-btn" onClick={handleChangePassword} disabled={saving}>
              {saving ? "Saving…" : "Update Password"}
            </button>
          </div>
        </div>

        {/* ── Danger zone ── */}
        <div className="profile-section" style={{ animationDelay: "0.15s", borderLeft: "3px solid #FFE0E0" }}>
          <p className="profile-section-title" style={{ color: "#e53e3e" }}>Account</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>Sign out of your account</p>
              <p style={{ margin: "3px 0 0", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#aaa" }}>You will be redirected to the login page.</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("auth_user");
                localStorage.removeItem("auth_token");
                router.push("/login", "root", "replace");
              }}
              style={{
                padding: "9px 22px",
                background: "transparent",
                color: "#e53e3e",
                border: "1.5px solid #e53e3e",
                borderRadius: 8,
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>

      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`profile-toast ${toast.type}`}>{toast.msg}</div>
      )}
    </Layout>
  );
};

export default Profile;