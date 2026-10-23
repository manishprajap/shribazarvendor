// AssignPackerPopup.tsx — Assign a Packer to an order (mirrors AssignPopup for delivery boys)

import React, { FC, useState, useEffect, useMemo } from 'react';
import { apiGet, apiPost } from '../api';

interface Packer {
  packer_id: number;
  user_id: number;
  name: string;
  phone: string;
  photo?: string | null;
  availability_status: 'Active' | 'Inactive' | 'On Leave';
  is_deleted: number; // 1 = active/visible-normal, 0 = deactivated
}

interface OrderLike {
  id: number | string;
  packer_id?: number | null;
  status?: string;
  payment_status?: string;
}

interface AssignPackerPopupProps {
  order: OrderLike;
  vendorId: number | string;
  allOrders: OrderLike[];
  onClose: () => void;
  onAssigned: (orderId: number | string, packerId: number) => void;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  .apk-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:1000;display:flex;align-items:flex-end;justify-content:center;font-family:'DM Sans',sans-serif;}
  .apk-sheet{background:#fff;width:100%;max-width:480px;border-radius:20px 20px 0 0;max-height:82vh;display:flex;flex-direction:column;animation:apkUp .25s ease;}
  @keyframes apkUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
  .apk-hdr{padding:16px 18px 10px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1f5f9;}
  .apk-title{font-size:15px;font-weight:700;color:#1e293b;}
  .apk-sub{font-size:11px;color:#94a3b8;font-family:'DM Mono',monospace;margin-top:2px;}
  .apk-close{width:30px;height:30px;border-radius:50%;background:#f1f5f9;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#64748b;}
  .apk-list{overflow-y:auto;padding:8px 12px;flex:1;}
  .apk-row{display:flex;align-items:center;gap:12px;padding:12px 10px;border-radius:12px;cursor:pointer;border:1.5px solid transparent;transition:background .15s;}
  .apk-row:hover{background:#f8fafc;}
  .apk-row.selected{background:#fff7ed;border-color:#fed7aa;}
  .apk-row.disabled{opacity:.45;cursor:not-allowed;}
  .apk-avatar{width:40px;height:40px;border-radius:50%;background:#f97316;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;object-fit:cover;}
  .apk-info{flex:1;min-width:0;}
  .apk-name{font-size:13px;font-weight:700;color:#1e293b;}
  .apk-phone{font-size:11px;color:#94a3b8;font-family:'DM Mono',monospace;margin-top:1px;}
  .apk-tag{font-size:9px;font-weight:700;padding:3px 8px;border-radius:99px;text-transform:uppercase;letter-spacing:.3px;flex-shrink:0;}
  .apk-tag.busy{background:#fef2f2;color:#ef4444;}
  .apk-tag.free{background:#f0fdf4;color:#22c55e;}
  .apk-radio{width:18px;height:18px;border-radius:50%;border:2px solid #e2e8f0;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
  .apk-radio.on{border-color:#f97316;}
  .apk-radio.on::after{content:'';width:9px;height:9px;border-radius:50%;background:#f97316;}
  .apk-empty{padding:40px 20px;text-align:center;color:#94a3b8;font-size:13px;}
  .apk-footer{padding:12px 16px;border-top:1px solid #f1f5f9;}
  .apk-btn{width:100%;background:#f97316;color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .15s;}
  .apk-btn:hover{background:#ea6c05;}
  .apk-btn:disabled{background:#fdba74;cursor:not-allowed;}
  .apk-err{background:#fef2f2;color:#ef4444;font-size:12px;padding:8px 12px;border-radius:8px;margin:0 16px 10px;text-align:center;}
  .apk-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:50px 20px;gap:10px;color:#94a3b8;font-size:13px;}
  .apk-spin{width:26px;height:26px;border:3px solid #e2e8f0;border-top-color:#f97316;border-radius:50%;animation:apkSpin .8s linear infinite;}
  @keyframes apkSpin{to{transform:rotate(360deg)}}
`;

const initials = (name: string) =>
  (name || '').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

const AssignPackerPopup: FC<AssignPackerPopupProps> = ({ order, vendorId, allOrders, onClose, onAssigned }) => {
  const [packers, setPackers] = useState<Packer[]>([]);
  const [loadingPackers, setLoadingPackers] = useState(true);
  const [packersError, setPackersError] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(order.packer_id ?? null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  // Packers currently "busy" — already assigned to an active (not yet completed/cancelled) order
  const busyPackerIds = useMemo<Set<number>>(() => {
    const busy = new Set<number>();
    allOrders.forEach(o => {
      const st = (o.status ?? '').toLowerCase();
      if (['completed', 'cancelled', 'delivered'].includes(st)) return;
      if (o.packer_id) busy.add(o.packer_id);
    });
    return busy;
  }, [allOrders]);

  useEffect(() => {
    (async () => {
      setLoadingPackers(true);
      setPackersError('');
      try {
        // Backend /vendor/packers already vendor-scoped hai (PackerController::list)
        // aur formatPacker() se seedha { packer_id, user_id, name, phone, photo,
        // availability_status, is_deleted } shape aata hai — koi remap nahi chahiye
        const res: { success?: boolean; data?: Packer[] } = await apiGet('/vendor/packers');
        const raw = res?.data ?? [];
        // sirf active/visible packers hi assign ke liye dikhao
        const activeOnly = (Array.isArray(raw) ? raw : []).filter(
          (p) => p.is_deleted === 1 && p.availability_status === 'Active'
        );
        setPackers(activeOnly);
      } catch {
        setPackersError('Failed to load packers');
      } finally {
        setLoadingPackers(false);
      }
    })();
  }, [vendorId]);

  const handleAssign = async () => {
    if (!selectedId) return;
    setAssigning(true);
    setAssignError('');
    try {
      const json: { success?: boolean; message?: string } = await apiPost(
        `/vendor/orders/${order.id}/assign-packer`,
        { packer_id: selectedId }
      );
      if (!json?.success) throw new Error(json?.message ?? 'Assign failed');
      onAssigned(order.id, selectedId);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign. Please try again.';
      setAssignError(msg);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="apk-overlay" onClick={onClose}>
        <div className="apk-sheet" onClick={e => e.stopPropagation()}>
          <div className="apk-hdr">
            <div>
              <div className="apk-title">Assign Packer</div>
              <div className="apk-sub">Order #{order.id}</div>
            </div>
            <button className="apk-close" onClick={onClose} aria-label="Close">×</button>
          </div>

          {assignError && <div className="apk-err">{assignError}</div>}

          {loadingPackers ? (
            <div className="apk-loading">
              <div className="apk-spin" />
              Loading packers…
            </div>
          ) : packersError ? (
            <div className="apk-empty">{packersError}</div>
          ) : packers.length === 0 ? (
            <div className="apk-empty">No active packers found.</div>
          ) : (
            <div className="apk-list">
              {packers.map(p => {
                const isBusy = busyPackerIds.has(p.packer_id) && p.packer_id !== order.packer_id;
                const isSelected = selectedId === p.packer_id;
                return (
                  <div
                    key={p.packer_id}
                    className={`apk-row${isSelected ? ' selected' : ''}${isBusy ? ' disabled' : ''}`}
                    onClick={() => !isBusy && setSelectedId(p.packer_id)}
                  >
                    {p.photo ? (
                      <img className="apk-avatar" src={p.photo} alt={p.name} />
                    ) : (
                      <div className="apk-avatar">{initials(p.name)}</div>
                    )}
                    <div className="apk-info">
                      <div className="apk-name">{p.name}</div>
                      <div className="apk-phone">{p.phone}</div>
                    </div>
                    <span className={`apk-tag ${isBusy ? 'busy' : 'free'}`}>
                      {isBusy ? 'Busy' : 'Free'}
                    </span>
                    <div className={`apk-radio${isSelected ? ' on' : ''}`} />
                  </div>
                );
              })}
            </div>
          )}

          <div className="apk-footer">
            <button
              className="apk-btn"
              disabled={!selectedId || assigning}
              onClick={handleAssign}
            >
              {assigning ? 'Assigning…' : 'Assign Packer'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssignPackerPopup;