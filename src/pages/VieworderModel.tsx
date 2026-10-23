import React, { FC } from 'react';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
  IonButton, IonIcon, IonBadge, IonList, IonItem, IonLabel,
} from '@ionic/react';
import { closeOutline, receiptOutline, bicycleOutline } from 'ionicons/icons';
import './VieworderModel.css';
import { Order, OrderProduct, OrderStatus } from '../types/orders.types';
import { DSTATUS_COLOR, fmtINR, STATUS_COLOR, statusLabel } from '../orderHelpers';

interface ViewOrderModalProps {
  order:   Order | null;
  onClose: () => void;
}

// ── resolve item fields from API shape ────────────────────────────────────────
interface AnyItem {
  product_name?: string; name?: string; title?: string;
  product?: { name?: string; title?: string };
  qty?: number; quantity?: number;
  price?: number; unit_price?: number; sale_price?: number;
  product_price?: number; subtotal?: number;
}

const resolveItemName = (item: AnyItem): string =>
  item.product_name ?? item.name ?? item.title ?? item.product?.name ?? item.product?.title ?? '—';

const resolveItemQty = (item: AnyItem): number =>
  Number(item.qty ?? item.quantity ?? 1);

const resolveItemPrice = (item: AnyItem): number =>
  Number(item.price ?? item.unit_price ?? item.sale_price ?? item.product_price ?? 0);

// ─────────────────────────────────────────────────────────────────────────────

const ViewOrderModal: FC<ViewOrderModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  // ── field resolution: match actual API response keys ─────────────────────
  const o = order as any;

  const name    = o.customer_name   ?? o.billing_name  ?? o.name   ?? '—';
  const email   = o.customer_email  ?? o.billing_email ?? o.email  ?? '—';
  const phone   = o.customer_phone  ?? o.billing_phone ?? o.phone  ?? o.mobile ?? '—';
  const address = o.shipping_address ?? o.billing_address ?? o.address ?? '—';

  // items: API returns "items" array, fallback to order_products / orderProducts
  const items: AnyItem[] = o.items ?? o.order_products ?? o.orderProducts ?? [];

  const itemsTotal = items.reduce((sum, item) => sum + resolveItemPrice(item) * resolveItemQty(item), 0);

  // amounts: API only has vendor_subtotal; no tax/billing_total available
  const subtotal  = Number(o.vendor_subtotal ?? o.billing_subtotal ?? o.subtotal ?? 0);
  const tax       = Number(o.billing_tax ?? o.tax ?? 0);
  const total     = Number(o.billing_total ?? o.total ?? o.amount ?? o.vendor_subtotal ?? 0);

  const paymentMode = (o.payment_method ?? o.payment_gateway ?? o.payment_mode ?? 'COD').toUpperCase();

  const orderStatus = (o.status ?? o.payment_status ?? 'pending') as OrderStatus;
  const deliveryStatus = o.dstatus ?? o.delivery_status ?? '';

  return (
    <>
      <IonHeader>
        <IonToolbar color="warning">
          <IonTitle>
            <div className="vom-title">
              <IonIcon icon={receiptOutline} aria-hidden="true" />
              Order #{order.id} Details
            </div>
          </IonTitle>
          <IonButton slot="end" fill="clear" color="light" onClick={onClose} aria-label="Close">
            <IonIcon slot="icon-only" icon={closeOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="vom-content">

        {/* ── customer info ── */}
        <SectionLabel>Customer Info</SectionLabel>
        <IonList lines="none" className="vom-list">
          <InfoItem label="Name"    value={name} />
          <InfoItem label="Email"   value={email} />
          <InfoItem label="Phone"   value={phone} />
          <InfoItem label="Address" value={address} />
          <IonItem className="vom-item">
            <IonIcon icon={bicycleOutline} slot="start" className="vom-icon" aria-hidden="true" />
            <IonLabel>
              <p className="vom-key">Delivery Boy</p>
              {order.delivery_boy
                ? <IonBadge color="success">{order.delivery_boy.name}</IonBadge>
                : <span className="vom-muted">Not assigned</span>}
            </IonLabel>
          </IonItem>
        </IonList>
{/* ── items ordered ── */}
        <SectionLabel>
          Items Ordered <span className="vom-count">{items.length}</span>
        </SectionLabel>

        {items.length === 0 ? (
          <p className="vom-no-items">No items found for this order.</p>
        ) : (
          <div className="vom-items-wrap">
            <table className="vom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th className="tc">Qty</th>
                  <th className="tr">Price</th>
                  <th className="tr">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const pname = resolveItemName(item);
                  const qty   = resolveItemQty(item);
                  const price = resolveItemPrice(item);
                  const sub   = price * qty;
                  return (
                    <tr key={i}>
                      <td className="vom-num">{i + 1}</td>
                      <td className="vom-name">{pname}</td>
                      <td className="tc"><IonBadge color="medium">×{qty}</IonBadge></td>
                      <td className="tr vom-price">₹{fmtINR(price)}</td>
                      <td className="tr vom-subtotal">₹{fmtINR(sub)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="vom-ft-label">Grand Total</td>
                  <td className="tr vom-ft-total">₹{fmtINR(itemsTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {/* ── payment summary ── */}
        <SectionLabel>Payment Summary</SectionLabel>
        <div className="vom-summary-card">
          <SummaryRow label="Subtotal"     value={`₹${fmtINR(subtotal)}`} />
          <SummaryRow label="Tax"          value={`₹${fmtINR(tax)}`} />
          <SummaryRow label="Total"        value={`₹${fmtINR(total || itemsTotal)}`} bold green />
          <SummaryRow label="Payment mode" value={paymentMode} />

          <div className="vom-summary-row">
            <span className="vom-sum-label">Order status</span>
            <IonBadge color={STATUS_COLOR[orderStatus] ?? 'medium'}>
              {statusLabel(orderStatus)}
            </IonBadge>
          </div>

          {deliveryStatus.length > 0 && (
            <div className="vom-summary-row">
              <span className="vom-sum-label">Delivery status</span>
              <IonBadge color={DSTATUS_COLOR[deliveryStatus] ?? 'medium'}>
                {deliveryStatus.charAt(0).toUpperCase() + deliveryStatus.slice(1)}
              </IonBadge>
            </div>
          )}

          {o.picked_at    && <SummaryRow label="Picked at"    value={o.picked_at} />}
          {o.delivered_at && <SummaryRow label="Delivered at" value={o.delivered_at} />}
        </div>

        

      </IonContent>

      <IonFooter>
        <IonToolbar>
          <IonButton expand="block" fill="outline" onClick={onClose}>
            Close
          </IonButton>
        </IonToolbar>
      </IonFooter>
    </>
  );
};

export default ViewOrderModal;

// ── sub-components ────────────────────────────────────────────────────────────

const SectionLabel: FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="vom-section-label">{children}</p>
);

const InfoItem: FC<{ label: string; value: string }> = ({ label, value }) => (
  <IonItem className="vom-item">
    <IonLabel>
      <p className="vom-key">{label}</p>
      <p className="vom-val">{value || '—'}</p>
    </IonLabel>
  </IonItem>
);

interface SummaryRowProps {
  label: string; value: string; bold?: boolean; green?: boolean;
}
const SummaryRow: FC<SummaryRowProps> = ({ label, value, bold = false, green = false }) => (
  <div className="vom-summary-row">
    <span className="vom-sum-label">{label}</span>
    <span className={`vom-sum-val${bold ? ' vom-bold' : ''}${green ? ' vom-green' : ''}`}>
      {value}
    </span>
  </div>
);