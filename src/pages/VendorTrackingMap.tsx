/**
 * VendorTrackingMap.tsx
 * Vendor's rider tracking screen:
 *  • Warehouse pin (fixed, orange)
 *  • Rider live location (blue — polled every 8 s from backend)
 *  • Google Directions route + ETA
 *  • "Rider is nearby!" banner when < 300 m
 */

import React, {
  FC,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { IonIcon, IonSpinner, IonToast } from '@ionic/react';
import {
  bicycleOutline,
  refreshOutline,
  closeOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { apiGet } from '../api';

// ─── Extend Window for Google Maps ────────────────────────────
declare global {
  interface Window {
    initGoogleMaps: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
  }
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyCYYrgKJKlHVt_Ew1KUl5ToHZdO3LP3zwU';
const POLL_INTERVAL = 8_000; // ms

// ─── API shape returned by /delivery/location/{user_id} ───────
interface RiderLocationResponse {
  latitude: number | string;
  longitude: number | string;
  updated_at?: string;
}

interface LatLng {
  lat: number;
  lng: number;
}

interface StatCard {
  label: string;
  value: string;
  bg: string;
  border: string;
  color: string;
}

interface ToastState {
  open: boolean;
  msg: string;
  ok: boolean;
}

export interface VendorTrackingMapProps {
  orderId: number;
  deliveryBoyId: number;
  deliveryBoyName?: string;
  warehouseLat: number;
  warehouseLng: number;
  onClose?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────
function haversine(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function etaString(km: number): string {
  const mins = Math.round((km / 25) * 60);
  if (mins < 1) return 'Arriving now!';
  if (mins < 60) return `~${mins} min away`;
  return `~${Math.floor(mins / 60)}h ${mins % 60}m away`;
}

function timeSince(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const WAREHOUSE_SVG = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
    <path d="M20 0C9 0 0 9 0 20c0 15 20 28 20 28S40 35 40 20C40 9 31 0 20 0z" fill="#FF5722"/>
    <text x="20" y="26" text-anchor="middle" font-size="18">🏪</text>
  </svg>`
)}`;

const RIDER_SVG = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="20" fill="#3B82F6" stroke="#fff" stroke-width="3"/>
    <text x="22" y="28" text-anchor="middle" font-size="20">🛵</text>
  </svg>`
)}`;

// ─── Component ────────────────────────────────────────────────
const VendorTrackingMap: FC<VendorTrackingMapProps> = ({
  orderId,
  deliveryBoyId,
  deliveryBoyName = 'Delivery Boy',
  warehouseLat,
  warehouseLng,
  onClose,
}) => {
  const mapElRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const riderMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rendererRef = useRef<any>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [riderPos, setRiderPos] = useState<LatLng | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [toast, setToast] = useState<ToastState>({ open: false, msg: '', ok: true });

  // ✅ Stable object — prevents useCallback deps changing every render
  const warehouse = useMemo<LatLng>(
    () => ({ lat: warehouseLat, lng: warehouseLng }),
    [warehouseLat, warehouseLng]
  );

  // ── 1. Load SDK ───────────────────────────────────────────────
  useEffect(() => {
    if (window.google?.maps) { setMapReady(true); return; }
    window.initGoogleMaps = () => setMapReady(true);
    if (!document.getElementById('gmap-sdk')) {
      const s = document.createElement('script');
      s.id = 'gmap-sdk';
      s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initGoogleMaps`;
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  // ── 2. Init map ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapElRef.current || mapRef.current) return;

    const G = window.google.maps;

    const map = new G.Map(mapElRef.current, {
      center: { lat: warehouse.lat, lng: warehouse.lng },
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    });

    new G.Marker({
      position: { lat: warehouse.lat, lng: warehouse.lng },
      map,
      title: 'Your Warehouse',
      icon: {
        url: WAREHOUSE_SVG,
        scaledSize: new G.Size(40, 48),
        anchor: new G.Point(20, 48),
      },
    });

    rendererRef.current = new G.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#3B82F6', strokeWeight: 4, strokeOpacity: 0.8 },
    });

    mapRef.current = map;
  }, [mapReady, warehouse]);

  // ── 3. Update rider on map ────────────────────────────────────
  const updateRiderOnMap = useCallback((pos: LatLng) => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;
    const G = window.google.maps;

    const gPos = new G.LatLng(pos.lat, pos.lng);

    if (!riderMarkerRef.current) {
      riderMarkerRef.current = new G.Marker({
        position: gPos,
        map,
        title: deliveryBoyName,
        icon: {
          url: RIDER_SVG,
          scaledSize: new G.Size(44, 44),
          anchor: new G.Point(22, 22),
        },
      });
    } else {
      riderMarkerRef.current.setPosition(gPos);
    }

    // Draw route
    if (rendererRef.current) {
      new G.DirectionsService().route(
        {
          origin: { lat: pos.lat, lng: pos.lng },
          destination: { lat: warehouse.lat, lng: warehouse.lng },
          travelMode: G.TravelMode.DRIVING,
        },
        (result: any, status: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (status === G.DirectionsStatus.OK && result !== null && rendererRef.current) {
            rendererRef.current.setDirections(result);
            const meters = result.routes[0]?.legs[0]?.distance?.value;
            if (meters !== undefined) setDistance(meters / 1000);
          } else {
            setDistance(haversine(pos, warehouse));
          }
        }
      );
    }

    const bounds = new G.LatLngBounds();
    bounds.extend({ lat: pos.lat, lng: pos.lng });
    bounds.extend({ lat: warehouse.lat, lng: warehouse.lng });
    map.fitBounds(bounds, { top: 80, bottom: 80, left: 40, right: 40 });
  }, [deliveryBoyName, warehouse]); // ✅ stable because warehouse is memoized

  // ── 4. Fetch rider location ───────────────────────────────────
  const fetchRiderLocation = useCallback(async () => {
    try {
      const res: { data?: RiderLocationResponse } & RiderLocationResponse =
        await apiGet(`/delivery/location/${deliveryBoyId}`);

      const raw: RiderLocationResponse = res?.data ?? res;
      if (!raw?.latitude || !raw?.longitude) return;

      const pos: LatLng = {
        lat: parseFloat(String(raw.latitude)),
        lng: parseFloat(String(raw.longitude)),
      };

      setRiderPos(pos);
      setFetchError('');
      setLastUpdated(raw.updated_at ?? new Date().toISOString());

      if (mapReady) updateRiderOnMap(pos);
    } catch {
      setFetchError('Could not fetch rider location');
    }
  }, [deliveryBoyId, mapReady, updateRiderOnMap]);

  // ── 5. Start polling when map ready ──────────────────────────
  useEffect(() => {
    if (!mapReady) return;
    fetchRiderLocation();
    pollTimerRef.current = setInterval(fetchRiderLocation, POLL_INTERVAL);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [mapReady, fetchRiderLocation]);

  // ─── Render ───────────────────────────────────────────────────
  const dist = distance;
  const eta = dist !== null ? etaString(dist) : null;
  const isNear = dist !== null && dist < 0.3;

  const statCards: StatCard[] = [
    { label: 'DISTANCE', value: dist !== null ? `${dist.toFixed(1)} km` : '—', bg: '#FFF8F6', border: '#FFE0D6', color: '#FF5722' },
    { label: 'ETA', value: riderPos !== null ? (eta ?? '—') : 'Waiting for rider…', bg: '#F0F9FF', border: '#BAE6FD', color: '#0284C7' },
    { label: 'STATUS', value: riderPos !== null ? '✓ Live' : '⏳ Waiting', bg: '#F0FDF4', border: '#BBF7D0', color: riderPos !== null ? '#16A34A' : '#F59E0B' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', background: '#FAFAF8' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '48px 16px 14px', background: '#fff', borderBottom: '1px solid #F0EDE8', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        {onClose && (
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F5F5F5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IonIcon icon={closeOutline} style={{ fontSize: 18, color: '#666' }} />
          </button>
        )}
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FF572215', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IonIcon icon={bicycleOutline} style={{ fontSize: 20, color: '#FF5722' }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>Track Rider</div>
          <div style={{ fontSize: 11, color: '#888' }}>{deliveryBoyName} · Order #{orderId}</div>
        </div>
        <button
          onClick={fetchRiderLocation}
          style={{ marginLeft: 'auto', background: '#F5F5F5', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#666' }}
        >
          <IonIcon icon={refreshOutline} style={{ fontSize: 13 }} />
          Refresh
        </button>
      </div>

      {/* ── Near banner ── */}
      {isNear && (
        <div style={{ background: '#22C55E', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#fff' }}>
          🛵 Rider is almost here! Get ready.
        </div>
      )}

      {/* ── Stat cards ── */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: '#fff', borderBottom: '1px solid #F0EDE8' }}>
        {statCards.map((c) => (
          <div key={c.label} style={{ flex: 1, background: c.bg, borderRadius: 12, padding: '10px 12px', border: `1px solid ${c.border}` }}>
            <div style={{ fontSize: 9, color: '#999', marginBottom: 2, letterSpacing: 1 }}>{c.label}</div>
            <div style={{ fontSize: c.label === 'ETA' ? 13 : 17, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* ── Map ── */}
      <div style={{ flex: 1, position: 'relative' }}>
        {!mapReady && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FAFAF8', gap: 12 }}>
            <IonSpinner name="crescent" color="primary" />
            <div style={{ fontSize: 13, color: '#999' }}>Loading map…</div>
          </div>
        )}
        {mapReady && riderPos === null && fetchError.length === 0 && (
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 500, background: '#fff', borderRadius: 20, padding: '6px 14px', boxShadow: '0 2px 10px rgba(0,0,0,.12)', fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <IonSpinner name="dots" style={{ width: 14, height: 14 }} color="medium" />
            Waiting for rider location…
          </div>
        )}
        {fetchError.length > 0 && (
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 500, background: '#FEE2E2', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: '#DC2626', whiteSpace: 'nowrap' }}>
            {fetchError}
          </div>
        )}
        <div ref={mapElRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* ── Footer ── */}
      <div style={{ background: '#fff', borderTop: '1px solid #F0EDE8', padding: '12px 16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>🛵</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{deliveryBoyName}</div>
            <div style={{ fontSize: 11, color: '#888' }}>Heading to your warehouse</div>
          </div>
        </div>
        {lastUpdated.length > 0 && (
          <div style={{ fontSize: 11, color: '#aaa' }}>
            Updated {timeSince(lastUpdated)}
          </div>
        )}
      </div>

      <IonToast
        isOpen={toast.open}
        message={toast.msg}
        duration={2000}
        color={toast.ok ? 'success' : 'danger'}
        icon={toast.ok ? checkmarkCircleOutline : alertCircleOutline}
        onDidDismiss={() => setToast((p) => ({ ...p, open: false }))}
      />
    </div>
  );
};

export default VendorTrackingMap;