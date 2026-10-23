/**
 * OrdersPage.tsx  (Vendor Side)
 */

import React, {
  useState,
  useCallback,
  FC,
  useEffect,
  useMemo,
  useRef,
  useLayoutEffect,
} from 'react';
import ReactDOM from 'react-dom';
import {
  IonContent,
  IonIcon,
  IonAlert,
  IonToast,
  IonModal,
  IonSpinner,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  receiptOutline,
  eyeOutline,
  createOutline,
  trashOutline,
  personAddOutline,
  refreshOutline,
  bicycleOutline,
  cartOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  callOutline,
  locationOutline,
  cardOutline,
  timeOutline,
  alertCircleOutline,
  closeOutline,
  checkmarkOutline,
  lockClosedOutline,
  chevronDownOutline,
  navigateOutline,
  cubeOutline,
} from 'ionicons/icons';
import { DeliveryBoy, Order } from '../types/orders.types';
import './OrderPage.css';
import { DSTATUS_FILTERS, fmtINR, matchesStatusFilter, STATUS_FILTERS } from '../orderHelpers';
import Layout from './Layout';
import { apiGet, apiPost } from '../api';
import ViewOrderModal from './VieworderModel';
import VendorTrackingMap from './VendorTrackingMap';
import AssignPackerPopup from './Assignpackerpopup';

// ─── Types ────────────────────────────────────────────────────
interface OrdersPageProps {
  initialOrders?: Order[];
  deliveryBoys?: DeliveryBoy[];
  busyDeliveryBoyIds?: number[];
  onUpdate?: (updated: Order) => void;
  onDelete?: (id: number) => void;
  onAssign?: (orderId: number, boyId: number) => void;
}

interface ToastState {
  open: boolean;
  message: string;
  color: string;
}

interface TrackingTarget {
  orderId: number;
  deliveryBoyId: number;
  deliveryBoyName: string;
}

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface VendorProfile {
  id?: number;
  warehouse_lat?: number | string;
  warehouse_lng?: number | string;
  lat?: number | string;
  lng?: number | string;
}

interface ProfileApiResponse {
  data?: VendorProfile;
  id?: number;
  warehouse_lat?: number | string;
  warehouse_lng?: number | string;
  lat?: number | string;
  lng?: number | string;
}

type OrderWithPacker = Order & {
  packer_id?: number | null;
  packer?: { id: number; name: string; phone?: string } | null;
  packer_status?: 'pending' | 'accepted' | 'rejected' | 'packing' | 'completed' | null;
};

const ORDER_STATUS_OPTIONS: StatusOption[] = [
  { value: 'pending',    label: '⏳ Pending',    color: '#F59E0B' },
  { value: 'processing', label: '👨‍🍳 Processing', color: '#FF5722' },
  { value: 'delivered',  label: '✅ Delivered',  color: '#22C55E' },
  { value: 'cancelled',  label: '❌ Cancelled',  color: '#EF4444' },
];

const DELIVERY_STATUS_OPTIONS: StatusOption[] = [
  { value: 'pending',    label: '⏳ Pending',    color: '#F59E0B' },
  { value: 'assigned',   label: '📋 Assigned',   color: '#3B82F6' },
  { value: 'accepted',   label: '👍 Accepted',   color: '#F59E0B' },
  { value: 'picked',     label: '📦 Picked',     color: '#FF5722' },
  { value: 'on_the_way', label: '🛵 On the Way', color: '#3B82F6' },
  { value: 'delivered',  label: '✅ Delivered',  color: '#22C55E' },
  { value: 'cancelled',  label: '❌ Cancelled',  color: '#EF4444' },
];

// ─────────────────────────────────────────────────────────────
// StatusDropdown
// ─────────────────────────────────────────────────────────────
interface StatusDropdownProps {
  orderId: number;
  current: string;
  options: StatusOption[];
  type: 'order' | 'delivery';
  onChanged: (orderId: number, newStatus: string, type: 'order' | 'delivery') => void;
}

const StatusDropdown: FC<StatusDropdownProps> = ({ orderId, current, options, type, onChanged }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 180 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const currentOpt = options.find((o) => o.value === current?.toLowerCase()) ?? options[0];
  const isCancelled = current?.toLowerCase() === 'cancelled';

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 190;
    setPos({
      top: rect.bottom + 4,
      left: Math.min(rect.left, window.innerWidth - menuWidth - 8),
      width: Math.max(rect.width, menuWidth),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', onDocMouseDown);
      document.addEventListener('keydown', onKeyDown);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleSelect = async (value: string) => {
    if (value === current) { setOpen(false); return; }
    setSaving(true); setOpen(false);
    try {
      const json: { success?: boolean; message?: string } = await apiPost(
        `/vendor/orders/update/${orderId}`,
        { [type === 'order' ? 'status' : 'dstatus']: value }
      );
      if (!json?.success) throw new Error(json?.message ?? 'Update failed');
      onChanged(orderId, value, type);
    } catch (err: unknown) {
      console.error('Status update failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const menu = open && !isCancelled
    ? ReactDOM.createPortal(
        <div
          style={{ position: 'fixed', zIndex: 100000, top: pos.top, left: pos.left, width: pos.width, background: '#fff', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', border: '1px solid #F0F0F0', overflow: 'hidden' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleSelect(opt.value); }}
              style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: opt.value === current ? `${opt.color}12` : 'transparent', borderLeft: opt.value === current ? `3px solid ${opt.color}` : '3px solid transparent', fontSize: 13, fontWeight: opt.value === current ? 700 : 400, color: opt.value === current ? opt.color : '#333' }}
            >
              {opt.label}
              {opt.value === current && (
                <IonIcon icon={checkmarkOutline} style={{ fontSize: 12, color: opt.color, marginLeft: 'auto' }} />
              )}
            </div>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); if (isCancelled || saving) return; setOpen((p) => !p); }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 6px', borderRadius: 20, border: `1.5px solid ${currentOpt.color}22`, background: `${currentOpt.color}15`, cursor: saving ? 'wait' : isCancelled ? 'default' : 'pointer', fontSize: 11, fontWeight: 600, color: currentOpt.color, userSelect: 'none', position: 'relative' }}
      >
        {saving
          ? <IonSpinner name="crescent" style={{ width: 12, height: 12 }} />
          : <span>{currentOpt.label}</span>
        }
        {!isCancelled && (
          <IonIcon icon={chevronDownOutline} style={{ fontSize: 10, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
        )}
      </div>
      {menu}
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// AssignPopup (Delivery Boy)
// ─────────────────────────────────────────────────────────────
interface AssignPopupProps {
  order: Order;
  vendorId: number;
  allOrders: Order[];
  onClose: () => void;
  onAssigned: (orderId: number, boy: DeliveryBoy) => void;
}

const AssignPopup: FC<AssignPopupProps> = ({ order, vendorId, allOrders, onClose, onAssigned }) => {
  const history = useHistory();
  const [boys, setBoys] = useState<DeliveryBoy[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(order.delivery_boy?.id ?? order.delivery_boy_id ?? null);
  const [loadingBoys, setLoadingBoys] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [boysError, setBoysError] = useState('');

  const busyBoyIds = useMemo<Set<number>>(() => {
    const busy = new Set<number>();
    allOrders.forEach((o) => {
      if (o.id === order.id) return;
      const st = (o.status ?? o.payment_status ?? '').toLowerCase();
      if (['delivered', 'cancelled'].includes(st)) return;
      if (o.delivery_boy_id) busy.add(o.delivery_boy_id);
      if (o.delivery_boy?.id) busy.add(o.delivery_boy.id);
    });
    return busy;
  }, [allOrders, order.id]);

  useEffect(() => {
    (async () => {
      setLoadingBoys(true);
      setBoysError('');
      try {
        // Union type — response is EITHER a bare array OR { data: [...] },
        // never both at once. Using `&` here previously collapsed to
        // `never` and broke `.data` access.
        const res: DeliveryBoy[] | { data?: DeliveryBoy[] } = await apiGet('/delivery-boys');
        const list: DeliveryBoy[] = Array.isArray(res) ? res : (res.data ?? []);
        setBoys(Array.isArray(list) ? list : []);
      } catch { setBoysError('Failed to load delivery boys'); }
      finally { setLoadingBoys(false); }
    })();
  }, [vendorId]);

  const handleAssign = async () => {
    if (!selectedId) return;
    setAssigning(true);
    try {
      await apiPost(`/vendor/orders/${order.id}/assign`, { delivery_boy_id: selectedId });
      const assignedBoy = boys.find((b) => b.id === selectedId);
      if (assignedBoy) { onAssigned(order.id, assignedBoy); }
      onClose();
    } catch { setBoysError('Failed to assign. Please try again.'); }
    finally { setAssigning(false); }
  };

  // Empty list se seedha "add new delivery boy" form (/onboard-rider) par
  // le jaata hai. Order id save kar dete hain taaki chaho to register ke
  // baad wapas aa kar isi order ko assign kiya ja sake.
  const handleAddDeliveryBoy = () => {
    try {
      sessionStorage.setItem('pendingAssignOrderId', String(order.id));
    } catch { /* sessionStorage unavailable — ignore */ }
    onClose();
    history.push('/onboard-rider');
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9998 }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '20px 20px 0 0', zIndex: 9999, padding: '0 0 32px', boxShadow: '0 -4px 30px rgba(0,0,0,0.15)', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E0E0E0' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px', borderBottom: '1px solid #F0F0F0' }}>
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>
              {order.delivery_boy ? 'Reassign Delivery Boy' : 'Assign Delivery Boy'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>
              Order #{order.id} · {order.customer_name ?? '—'}
            </p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F5F5F5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IonIcon icon={closeOutline} style={{ fontSize: 18, color: '#666' }} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 0' }}>
          {loadingBoys ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0', gap: 12 }}>
              <IonSpinner name="crescent" color="primary" />
              <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Loading delivery boys…</p>
            </div>
          ) : boys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <span style={{ fontSize: 36 }}>🛵</span>
              <p style={{ margin: '8px 0 4px', fontSize: 13, color: boysError.length > 0 ? '#EF4444' : '#888' }}>
                {boysError.length > 0 ? boysError : 'No delivery boys available'}
              </p>
              <button
                onClick={handleAddDeliveryBoy}
                style={{
                  marginTop: 10,
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#FF5722',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <IonIcon icon={personAddOutline} style={{ fontSize: 14 }} />
                Add Delivery Boy
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {boys.map((boy) => {
                const isSelected = selectedId === boy.id;
                const currentlyAssigned = boy.id === (order.delivery_boy?.id ?? order.delivery_boy_id);
                const isDisabled = busyBoyIds.has(boy.id) && !currentlyAssigned;
                return (
                  <div key={boy.id} onClick={() => !isDisabled && setSelectedId(boy.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: isSelected ? '2px solid #FF5722' : '1.5px solid #F0F0F0', background: isSelected ? '#FFF4F0' : isDisabled ? '#FAFAFA' : '#fff', cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.6 : 1 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: isDisabled ? '#E5E7EB' : isSelected ? '#FF5722' : '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: isSelected ? '#fff' : '#666', fontWeight: 700 }}>
                      {isDisabled
                        ? <IonIcon icon={lockClosedOutline} style={{ fontSize: 16, color: '#9CA3AF' }} />
                        : boy.name ? boy.name[0].toUpperCase() : '🛵'
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: isDisabled ? '#9CA3AF' : '#1a1a1a' }}>{boy.name}</p>
                      {boy.phone && <p style={{ margin: '1px 0 0', fontSize: 12, color: '#888' }}>📞 {boy.phone}</p>}
                    </div>
                    {isSelected && (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#FF5722', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <IonIcon icon={checkmarkOutline} style={{ fontSize: 14, color: '#fff' }} />
                      </div>
                    )}
                  </div>
                );
              })}
              {/* ✅ Dashed "Add New Delivery Boy" button hata diya gaya —
                  list already dikh rahi hai to add-button ki zaroorat nahi.
                  Add sirf empty-state (boys.length === 0) mein hi dikhega. */}
            </div>
          )}
          {boysError.length > 0 && boys.length > 0 && (
            <p style={{ margin: '10px 0 0', fontSize: 12, color: '#EF4444', textAlign: 'center' }}>{boysError}</p>
          )}
        </div>

        {boys.length > 0 && (
          <div style={{ padding: '16px 20px 0' }}>
            <button disabled={!selectedId || assigning || loadingBoys} onClick={handleAssign}
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: selectedId && !assigning ? '#FF5722' : '#FFCCBC', color: '#fff', fontSize: 15, fontWeight: 700, cursor: selectedId && !assigning ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {assigning
                ? <><IonSpinner name="crescent" style={{ width: 18, height: 18 }} />Assigning…</>
                : <><IonIcon icon={order.delivery_boy ? refreshOutline : personAddOutline} style={{ fontSize: 16 }} />{order.delivery_boy ? 'Reassign Delivery Boy' : 'Assign Delivery Boy'}</>
              }
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Helpers ──────────────────────────────────────────────────
const getDeliveryStatus = (order: Order): string => order.delivery_status ?? order.dstatus ?? '';
const getOrderStatus    = (order: Order): string => order.payment_status ?? order.status ?? '';
const getAmount         = (order: Order): number => Number(order.vendor_subtotal ?? order.amount ?? 0);

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return dateStr; }
};

const resolveDeliveryBoyName = (order: Order): string | null => {
  if (order.delivery_boy?.name) return order.delivery_boy.name;
  if (order.delivery_boy_id) return `Rider #${order.delivery_boy_id}`;
  return null;
};

const hasDeliveryBoy = (order: Order): boolean =>
  !!(order.delivery_boy?.id ?? order.delivery_boy_id);

const resolvePackerName = (order: OrderWithPacker): string | null => {
  if (order.packer?.name) return order.packer.name;
  if (order.packer_id) return `Packer #${order.packer_id}`;
  return null;
};

const hasPacker = (order: OrderWithPacker): boolean =>
  !!(order.packer?.id ?? order.packer_id);

// ─────────────────────────────────────────────────────────────
// OrdersPage
// ─────────────────────────────────────────────────────────────
const OrdersPage: FC<OrdersPageProps> = ({ initialOrders = [], onUpdate, onDelete }) => {
  const [orders, setOrders]               = useState<OrderWithPacker[]>(initialOrders);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [activeStatus, setActiveStatus]   = useState('');
  const [activeDstatus, setActiveDstatus] = useState('');

  // ── Modal state (direct render — avoids useIonModal stale-closure bug) ──
  const [viewOrder, setViewOrder]   = useState<Order | null>(null);
  const [editOrder, setEditOrder]   = useState<Order | null>(null);

  const [assignOrder, setAssignOrder]         = useState<Order | null>(null);
  const [assignPackerOrder, setAssignPackerOrder] = useState<OrderWithPacker | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteTargetId, setDeleteTargetId]   = useState<number | null>(null);
  const [toast, setToast]                 = useState<ToastState>({ open: false, message: '', color: 'success' });
  const [vendorId, setVendorId]           = useState(0);
  const [trackingTarget, setTrackingTarget] = useState<TrackingTarget | null>(null);
  const [warehouseCoords, setWarehouseCoords] = useState({ lat: 0, lng: 0 });

  // ── New-order sound alert ──
  // Ring only for pending/new/confirmed orders — delivered/cancelled ones
  // shouldn't trigger the alert.
  const pendingOrderIds = useMemo(
    () =>
      orders
        .filter((o) => {
          const st = getOrderStatus(o).toLowerCase();
          return st === 'new' || st === 'confirmed' || st === 'pending';
        })
        .map((o) => o.id),
    [orders]
  );

 /*  const { isRinging, newOrderCount, soundUnlocked, enableSound, stopRinging } =
    useNewOrderSound(pendingOrderIds, {
      soundUrl: '/order_ring.mp3', 
    }); */

  // Fetch warehouse coords from profile
  useEffect(() => {
    (async () => {
      try {
        const res: ProfileApiResponse = await apiGet('/profile');
        const profile: VendorProfile = res.data ?? res;
        const lat = parseFloat(String(profile?.warehouse_lat ?? profile?.lat ?? '0'));
        const lng = parseFloat(String(profile?.warehouse_lng ?? profile?.lng ?? '0'));
        if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
          setWarehouseCoords({ lat, lng });
        }
        if (profile?.id) setVendorId(profile.id);
      } catch {
        console.warn('Could not load warehouse coordinates from /profile');
      }
    })();
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const json: { success?: boolean; message?: string; data?: OrderWithPacker[] } = await apiGet('/vendor/orders');
      if (!json.success) throw new Error(json.message ?? 'Failed to fetch orders');
      setOrders(json.data ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load orders';
      setError(msg);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const showToast = (message: string, color = 'success') =>
    setToast({ open: true, message, color });

  const handleStatusChange = useCallback(
    (orderId: number, newStatus: string, type: 'order' | 'delivery') => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          if (type === 'order') return { ...o, status: newStatus as Order['status'], payment_status: newStatus as Order['payment_status'] } as OrderWithPacker;
          return { ...o, dstatus: newStatus as Order['dstatus'], delivery_status: newStatus as Order['delivery_status'] } as OrderWithPacker;
        })
      );
      showToast(`Status updated to "${newStatus}"`);
    }, []
  );

  const filtered = useCallback((): OrderWithPacker[] =>
  orders.filter((o) => {
    if (activeDstatus) return o.dstatus === activeDstatus;

    if (activeStatus) {
      return matchesStatusFilter(o.status ?? '', activeStatus);
    }

    return true;
  }),
[orders, activeStatus, activeDstatus]);

  const handleDeleteClick = (id: number) => { setDeleteTargetId(id); setShowDeleteAlert(true); };
  const confirmDelete = () => {
    if (deleteTargetId == null) return;
    setOrders((prev) => prev.filter((o) => o.id !== deleteTargetId));
    onDelete?.(deleteTargetId);
    showToast('Order deleted', 'danger');
    setShowDeleteAlert(false);
  };

  const handleAssigned = (orderId: number, boy: DeliveryBoy) => {
    setOrders((prev) =>
      prev.map((o) => o.id === orderId ? { ...o, delivery_boy: boy, delivery_boy_id: boy.id, dstatus: 'assigned' } : o)
    );
    showToast(`Assigned to ${boy.name} successfully`);
  };

  const handlePackerAssigned = (orderId: number | string, packerId: number) => {
    setOrders((prev) =>
      prev.map((o) => o.id === orderId ? { ...o, packer_id: packerId, packer_status: 'pending' } : o)
    );
    showToast('Packer assigned successfully');
  };

  // Full-screen tracking map
  if (trackingTarget !== null) {
    return (
      <VendorTrackingMap
        orderId={trackingTarget.orderId}
        deliveryBoyId={trackingTarget.deliveryBoyId}
        deliveryBoyName={trackingTarget.deliveryBoyName}
        warehouseLat={warehouseCoords.lat}
        warehouseLng={warehouseCoords.lng}
        onClose={() => setTrackingTarget(null)}
      />
    );
  }

  const filteredList   = filtered();
  const totalRevenue   = orders.reduce((s, o) => s + getAmount(o), 0);
  const deliveredCount = orders.filter((o) => getOrderStatus(o) === 'delivered').length;
  const cancelledCount = orders.filter((o) => getOrderStatus(o) === 'cancelled').length;
  const activeCount    = orders.filter((o) => !['delivered', 'cancelled'].includes(getOrderStatus(o))).length;

  return (
    <>
      {/* <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
       
        {isRinging && (
          <div
            style={{
              background: '#ff3b30',
              color: '#fff',
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 700,
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            <span>🔔 {newOrderCount} New Order{newOrderCount > 1 ? 's' : ''}!</span>
            <button
              onClick={stopRinging}
              style={{
                background: '#fff',
                color: '#ff3b30',
                border: 'none',
                padding: '6px 16px',
                borderRadius: 20,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Stop
            </button>
          </div>
        )}

       
        {!soundUnlocked && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
            <button
              onClick={enableSound}
              style={{
                background: '#ffc107',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 20,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              🔔 Enable Order Sound Alerts
            </button>
          </div>
        )}
      </div> */}

      <Layout title="Orders" activeNav="Orders">

        {/* ── View Modal ── */}
        <IonModal
          isOpen={viewOrder !== null}
          onDidDismiss={() => setViewOrder(null)}
          className="order-sheet-modal"
          breakpoints={[0, 1]}
          initialBreakpoint={1}
        >
          <ViewOrderModal
            order={viewOrder}
            onClose={() => setViewOrder(null)}
          />
        </IonModal>

        {/* ── Edit Modal ── */}
        <IonModal
          isOpen={editOrder !== null}
          onDidDismiss={() => setEditOrder(null)}
          className="order-sheet-modal"
          breakpoints={[0, 1]}
          initialBreakpoint={1}
        >
          
        </IonModal>

        {assignOrder !== null && (
          <AssignPopup
            order={assignOrder}
            vendorId={vendorId}
            allOrders={orders}
            onClose={() => setAssignOrder(null)}
            onAssigned={(orderId, boy) => { handleAssigned(orderId, boy); setAssignOrder(null); }}
          />
        )}

        {assignPackerOrder !== null && (
          <AssignPackerPopup
            order={assignPackerOrder}
            vendorId={vendorId}
            allOrders={orders}
            onClose={() => setAssignPackerOrder(null)}
            onAssigned={(orderId, packerId) => { handlePackerAssigned(orderId, packerId); setAssignPackerOrder(null); }}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Topbar */}
          <div className="topbar">
            <IonIcon icon={cartOutline} style={{ fontSize: 20, color: 'var(--primary)' }} />
            <span className="topbar-title">Orders</span>
            <div className="topbar-right">
              <div className="topbar-count">{orders.length} orders</div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="stats-bar">
            <div className="stat-card"><div className="stat-num">{orders.length}</div><div className="stat-label">Total</div></div>
            <div className="stat-card"><div className="stat-num" style={{ color: '#22C55E' }}>{deliveredCount}</div><div className="stat-label">Delivered</div></div>
            <div className="stat-card"><div className="stat-num" style={{ color: '#F59E0B' }}>{activeCount}</div><div className="stat-label">Active</div></div>
            <div className="stat-card"><div className="stat-num" style={{ color: '#EF4444' }}>{cancelledCount}</div><div className="stat-label">Cancelled</div></div>
            <div className="stat-card" style={{ minWidth: 110 }}>
              <div className="stat-num" style={{ fontSize: 15, color: 'var(--primary)' }}>₹{fmtINR(totalRevenue)}</div>
              <div className="stat-label">Revenue</div>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-bar">
            <div className="filter-section">
              <div className="filter-label">Order Status</div>
              <div className="chip-scroll">
                {STATUS_FILTERS.map((f) => (
                  <button key={f.value} className={`chip ${activeStatus === f.value && !activeDstatus ? 'chip-active-primary' : ''}`}
                    onClick={() => { setActiveStatus(f.value); setActiveDstatus(''); }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-section" style={{ marginTop: 6 }}>
              <div className="filter-label">Delivery Status</div>
              <div className="chip-scroll">
                {DSTATUS_FILTERS.map((f) => (
                  <button key={f.value} className={`chip ${activeDstatus === f.value ? 'chip-active-amber' : ''}`}
                    onClick={() => { setActiveDstatus((prev) => (prev === f.value ? '' : f.value)); setActiveStatus(''); }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <IonContent scrollY style={{ '--padding-bottom': '80px', flex: '1', minHeight: '0' }}>
            <div className="orders-content" style={{ paddingBottom: 80 }}>
              {loading && (
                <div className="empty-state">
                  <IonSpinner name="crescent" color="primary" />
                  <div className="empty-title" style={{ marginTop: 12 }}>Loading orders…</div>
                </div>
              )}

              {!loading && error !== null && (
                <div className="empty-state">
                  <div className="empty-icon-wrap">
                    <IonIcon icon={alertCircleOutline} style={{ fontSize: 32, color: '#EF4444' }} />
                  </div>
                  <div className="empty-title" style={{ color: '#EF4444' }}>{error}</div>
                  <button className="op-btn-sm op-btn-sm-assign" style={{ marginTop: 12 }} onClick={fetchOrders}>
                    <IonIcon icon={refreshOutline} style={{ fontSize: 13 }} />Retry
                  </button>
                </div>
              )}

              {!loading && error === null && (
                <div className="orders-grid">
                  {filteredList.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon-wrap">
                        <IonIcon icon={cartOutline} style={{ fontSize: 32, color: 'var(--primary)' }} />
                      </div>
                      <div className="empty-title">No orders found</div>
                      <div className="empty-sub">
                        {activeStatus.length > 0 || activeDstatus.length > 0 ? 'Try a different filter' : 'New orders will appear here'}
                      </div>
                    </div>
                  ) : (
                    filteredList.map((order) => {
                      const status       = getOrderStatus(order);
                      const dstatus      = getDeliveryStatus(order);
                      const amount       = getAmount(order);
                      const isCod        = (order.payment_method ?? '').toLowerCase() === 'cod' || order.cod === 1;
                      const displayDate  = order.created_at_formatted ?? formatDate(order.created_at);
                      const isClosed     = ['delivered', 'cancelled'].includes(status.toLowerCase());
                      const dstatusLower = dstatus.toLowerCase();
                      const deliveryActive   = ['accepted', 'picked', 'on_the_way', 'assigned'].includes(dstatusLower);
                      const deliveryRejected = dstatusLower === 'rejected';
                      const boyAssigned  = hasDeliveryBoy(order);
                      const boyName      = resolveDeliveryBoyName(order);
                      const boyIsActive  = boyAssigned && !isClosed;

                      const packerAssigned = hasPacker(order);
                      const packerName     = resolvePackerName(order);
                      // ⚠️ packer_status backend field abhi missing hai — jab tak add
                      // nahi hota, ye hamesha false rahega (never 'rejected')
                      const packerRejected = (order.packer_status ?? '').toLowerCase() === 'rejected';
                      const showPackerBtn  = !isClosed && (!packerAssigned || packerRejected);
                      const showRiderBtn   = !isClosed && (!boyAssigned || deliveryRejected);

                      const canTrack =
                        !isClosed &&
                        boyAssigned &&
                        !!(order.delivery_boy?.id ?? order.delivery_boy_id) &&
                        ['assigned', 'accepted', 'picked', 'on_the_way'].includes(dstatusLower);

                      return (
                        <div key={order.id} className="op-card">
                          {/* Card head */}
                          <div className="op-card-head">
                            <div className="op-order-id">
                              <IonIcon icon={receiptOutline} style={{ fontSize: 13, color: 'var(--muted)' }} />
                              Order&nbsp;<span className="op-order-id-hash">#{order.id}</span>
                            </div>
                            <div className="op-head-right">
                              <div className="op-amount">₹{fmtINR(amount)}</div>
                              <div className="op-date">
                                <IonIcon icon={timeOutline} style={{ fontSize: 10, verticalAlign: 'middle', marginRight: 3 }} />
                                {displayDate}
                              </div>
                            </div>
                          </div>

                          {/* Status section */}
                          <div className="op-status-section">
                            <div className="op-status-row-inner">
                              <span className="op-row-label">Order</span>
                              <StatusDropdown orderId={order.id} current={status} options={ORDER_STATUS_OPTIONS} type="order" onChanged={handleStatusChange} />
                              <span className={`op-payment-pill ${isCod ? 'cod' : ''}`}>
                                <IonIcon icon={cardOutline} style={{ fontSize: 10 }} />
                                {isCod ? 'COD' : (order.payment_method ?? 'Online').toUpperCase()}
                              </span>
                            </div>
                            {status.toLowerCase() !== 'cancelled' && (
                              <div className="op-status-row-inner">
                                <span className="op-row-label">Delivery</span>
                                <StatusDropdown orderId={order.id} current={dstatus || 'pending'} options={DELIVERY_STATUS_OPTIONS} type="delivery" onChanged={handleStatusChange} />
                              </div>
                            )}
                          </div>

                          {/* Card body */}
                          <div className="op-card-body">
                            <div className="op-info-row">
                              <span className="op-customer-name">{order.customer_name ?? order.billing_name ?? '—'}</span>
                            </div>
                            <div className="op-info-row">
                              <IonIcon icon={callOutline} />
                              {order.billing_phone ?? '—'}
                            </div>
                            <div className="op-info-row">
                              <IonIcon icon={locationOutline} />
                              {order.shipping_address ?? order.billing_address ?? '—'}
                            </div>

                            {/* Packer row */}
                            <div className="op-db-row">
                              {packerAssigned && packerName !== null ? (
                                <div className="op-db-info">
                                  <div className="op-db-avatar">📦</div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="op-db-name">{packerName}</div>
                                  </div>
                                  {!isClosed && <div className="op-db-active-dot" />}
                                </div>
                              ) : (
                                <div className="op-no-boy">
                                  <IonIcon icon={cubeOutline} />
                                  No packer assigned
                                </div>
                              )}
                              {showPackerBtn && (
                                <button
                                  className={`op-btn-sm ${!packerAssigned ? 'op-btn-sm-assign' : ''}`}
                                  onClick={() => setAssignPackerOrder(order)}
                                >
                                  <IonIcon icon={packerAssigned ? refreshOutline : personAddOutline} style={{ fontSize: 12 }} />
                                  {packerAssigned ? 'Reassign' : 'Assign'}
                                </button>
                              )}
                            </div>

                            {/* Rider row */}
                            <div className="op-db-row">
                              {boyAssigned && boyName !== null ? (
                                <div className="op-db-info">
                                  <div className="op-db-avatar">🛵</div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="op-db-name">{boyName}</div>
                                  </div>
                                  {boyIsActive && <div className="op-db-active-dot" />}
                                </div>
                              ) : (
                                <div className="op-no-boy">
                                  <IonIcon icon={bicycleOutline} />
                                  No rider assigned
                                </div>
                              )}
                              {showRiderBtn && (
                                <button
                                  className={`op-btn-sm ${!boyAssigned ? 'op-btn-sm-assign' : ''}`}
                                  onClick={() => setAssignOrder(order)}
                                >
                                  <IonIcon icon={!boyAssigned || deliveryRejected ? personAddOutline : refreshOutline} style={{ fontSize: 12 }} />
                                  {!boyAssigned || deliveryRejected ? 'Assign' : 'Reassign'}
                                </button>
                              )}
                            </div>

                            {/* Track Rider button */}
                            {canTrack && (
                              <button
                                onClick={() =>
                                  setTrackingTarget({
                                    orderId: order.id,
                                    deliveryBoyId: order.delivery_boy?.id ?? order.delivery_boy_id ?? 0,
                                    deliveryBoyName: boyName ?? 'Delivery Boy',
                                  })
                                }
                                style={{ marginTop: 8, width: '100%', padding: '9px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 3px 12px rgba(59,130,246,.3)' }}
                              >
                                <IonIcon icon={navigateOutline} style={{ fontSize: 14 }} />
                                🛵 Track Rider
                                {boyName !== null && (
                                  <span style={{ fontSize: 10, background: 'rgba(255,255,255,.2)', borderRadius: 6, padding: '2px 6px' }}>
                                    {boyName}
                                  </span>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="op-card-footer">
                            <button className="op-footer-btn view" onClick={() => setViewOrder(order)}>
                              <IonIcon icon={eyeOutline} />View
                            </button>
                            {/* <button className="op-footer-btn edit" onClick={() => setEditOrder(order)}>
                              <IonIcon icon={createOutline} />Edit
                            </button> */}
                            <button className="op-footer-btn del" onClick={() => handleDeleteClick(order.id)}>
                              <IonIcon icon={trashOutline} />Delete
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </IonContent>
        </div>

        <IonAlert
          isOpen={showDeleteAlert}
          header="Delete Order"
          message="Are you sure? This cannot be undone."
          buttons={[
            { text: 'Cancel', role: 'cancel', handler: () => setShowDeleteAlert(false) },
            { text: 'Delete', role: 'destructive', cssClass: 'alert-btn-danger', handler: confirmDelete },
          ]}
          onDidDismiss={() => setShowDeleteAlert(false)}
        />

        <IonToast
          isOpen={toast.open}
          message={toast.message}
          color={toast.color}
          duration={2500}
          onDidDismiss={() => setToast((p) => ({ ...p, open: false }))}
          icon={toast.color === 'danger' ? closeCircleOutline : checkmarkCircleOutline}
        />
      </Layout>
    </>
  );
};

export default OrdersPage;