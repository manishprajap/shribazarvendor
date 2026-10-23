// utils/orderHelpers.ts

import { DeliveryStatus, OrderStatus } from "./types/orders.types";

// ── badge color maps ──────────────────────────────────────────────────────────

export const STATUS_COLOR: Record<OrderStatus, string> = {
  new:        'primary',
  confirmed:  'primary',
  pending:    'warning',
  processing: 'tertiary',
  picked:     'secondary',
  on_the_way: 'secondary',
  delivered:  'success',
  cancelled:  'danger',
};

export const DSTATUS_COLOR: Record<string, string> = {
  pending:    'warning',
  assigned:   'primary',
  accepted:   'success',
  picked:     'tertiary',
  on_the_way: 'primary',
  delivered:  'success',
  cancelled:  'danger',
  rejected:   'danger',
};

// ── filter chip definitions ───────────────────────────────────────────────────

export const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '',           label: 'All' },
  { value: 'new',        label: 'New' },        // matches new + confirmed
  { value: 'pending',    label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'delivered',  label: 'Delivered' },
  { value: 'cancelled',  label: 'Cancelled' },
];

export const DSTATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'assigned',   label: '📋 Assigned' },
  { value: 'accepted',   label: '👍 Accepted' },
  { value: 'picked',     label: '📦 Picked Up' },
  { value: 'on_the_way', label: '🛵 On the Way' },
];

export const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'new',        label: '🆕 New' },
  { value: 'confirmed',  label: '✅ Confirmed' },
  { value: 'pending',    label: '⏳ Pending' },
  { value: 'processing', label: '👨‍🍳 Processing' },
  { value: 'picked',     label: '📦 Picked' },
  { value: 'on_the_way', label: '🛵 On the Way' },
  { value: 'delivered',  label: '✅ Delivered' },
  { value: 'cancelled',  label: '❌ Cancelled' },
];

// ── label helpers ─────────────────────────────────────────────────────────────

export function statusLabel(s: OrderStatus | string): string {
  const map: Record<string, string> = {
    new:        'New',
    confirmed:  'New',        // confirmed shows as "New"
    pending:    'Pending',
    processing: 'Processing',
    picked:     'Picked',
    on_the_way: 'On the Way',
    delivered:  'Delivered',
    cancelled:  'Cancelled',
  };
  return map[s?.toLowerCase()] ?? (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');
}

export function dstatusLabel(s: DeliveryStatus | string): string {
  const map: Record<string, string> = {
    pending:    'Pending',
    assigned:   'Assigned',
    accepted:   'Accepted',
    picked:     'Picked',
    on_the_way: 'On the Way',
    delivered:  'Delivered',
    cancelled:  'Cancelled',
    rejected:   'Rejected',
  };
  return map[s?.toLowerCase()] ?? (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');
}

// ── currency formatter ────────────────────────────────────────────────────────

export function fmtINR(n: number | string | undefined, decimals = 0): string {
  const num = Number(n ?? 0);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ── filter match helper ───────────────────────────────────────────────────────
// "new" chip matches both "new" and "confirmed" API status values

export function matchesStatusFilter(orderStatus: string, filterValue: string): boolean {
  if (!filterValue) return true;
  const s = orderStatus?.toLowerCase() ?? '';
  if (filterValue === 'new') return s === 'new' || s === 'confirmed';
  return s === filterValue;
}

// ── order product resolvers ───────────────────────────────────────────────────

export function resolveProductName(item: {
  product_name?: string;       // ← API returns this directly
  name?: string;
  title?: string;
  product?: { name?: string; title?: string };
  product_id?: number;
  id?: number;
}): string {
  return (
    item.product_name          ??
    item.name                  ??
    item.title                 ??
    item.product?.name         ??
    item.product?.title        ??
    `Item #${item.product_id ?? item.id ?? '?'}`
  );
}

export function resolveProductImage(item: {
  product?: { image?: string; photo?: string; img?: string };
}): string | null {
  return item.product?.image ?? item.product?.photo ?? item.product?.img ?? null;
}

export function resolvePrice(item: {
  price?: number;
  amount?: number;
  unit_price?: number;
  sale_price?: number;
  product_price?: number;
  product?: { price?: number; selling_price?: number; sale_price?: number };
}): number {
  return (
    item.price          ??
    item.unit_price     ??
    item.sale_price     ??
    item.product_price  ??
    item.amount         ??
    item.product?.price ??
    item.product?.selling_price ??
    item.product?.sale_price    ??
    0
  );
}

export function resolveQty(item: {
  quantity?: number;
  qty?: number;
}): number {
  return parseInt(String(item.quantity ?? item.qty ?? 1), 10);
}