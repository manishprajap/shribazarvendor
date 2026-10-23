import React, { FC, useState } from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { closeOutline, saveOutline, createOutline } from 'ionicons/icons';



import { Order, OrderStatus } from '../types/orders.types';
import { STATUS_OPTIONS } from '../orderHelpers';

// ─── form state type ──────────────────────────────────────────────────────────

interface EditFormState {
  billing_name:  string;
  billing_phone: string;
  billing_email: string;
  billing_city:  string;
  amount:        number | string;
  status:        OrderStatus;
}

// ─── props ────────────────────────────────────────────────────────────────────

interface EditOrderModalProps {
  order:   Order | null;
  onSave:  (updated: Order) => void;
  onClose: () => void;
}

// ─── component ────────────────────────────────────────────────────────────────

const EditOrderModal: FC<EditOrderModalProps> = ({ order, onSave, onClose }) => {
  const [form, setForm] = useState<EditFormState>({
    billing_name:  order?.billing_name  ?? '',
    billing_phone: order?.billing_phone ?? '',
    billing_email: order?.billing_email ?? '',
    billing_city:  order?.billing_city  ?? '',
    amount:        order?.amount        ?? 0,
    status:        order?.status        ?? 'new',
  });

  const set = <K extends keyof EditFormState>(key: K, val: EditFormState[K]): void =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = (): void => {
    if (!form.billing_name.trim())  { alert('Name is required');   return; }
    if (!form.billing_phone.trim()) { alert('Phone is required');  return; }
    if (!form.amount)               { alert('Amount is required'); return; }
    if (!order) return;

    onSave({
      ...order,
      ...form,
      amount: parseFloat(String(form.amount)) || order.amount,
    });
  };

  return (
    <>
      <IonHeader>
        <IonToolbar color="warning">
          <IonTitle>
            <div className="eom-title">
              <IonIcon icon={createOutline} aria-hidden="true" />
              Edit Order #{order?.id}
            </div>
          </IonTitle>
          <IonButton slot="end" fill="clear" color="light" onClick={onClose} aria-label="Close">
            <IonIcon slot="icon-only" icon={closeOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="eom-content">
        <IonGrid className="eom-grid">

          <IonRow>
            <IonCol size="12" sizeMd="6">
              <FormField label="Name *">
                <IonInput
                  value={form.billing_name}
                  onIonInput={(e) => set('billing_name', e.detail.value ?? '')}
                  placeholder="Customer name"
                  clearInput
                />
              </FormField>
            </IonCol>
            <IonCol size="12" sizeMd="6">
              <FormField label="Phone *">
                <IonInput
                  value={form.billing_phone}
                  onIonInput={(e) => set('billing_phone', e.detail.value ?? '')}
                  type="tel"
                  placeholder="Mobile number"
                  clearInput
                />
              </FormField>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12" sizeMd="6">
              <FormField label="Email">
                <IonInput
                  value={form.billing_email}
                  onIonInput={(e) => set('billing_email', e.detail.value ?? '')}
                  type="email"
                  placeholder="Email address"
                  clearInput
                />
              </FormField>
            </IonCol>
            <IonCol size="12" sizeMd="6">
              <FormField label="City">
                <IonInput
                  value={form.billing_city}
                  onIonInput={(e) => set('billing_city', e.detail.value ?? '')}
                  placeholder="City"
                  clearInput
                />
              </FormField>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12" sizeMd="6">
              <FormField label="Amount (₹) *">
                <IonInput
                  value={form.amount}
                  onIonInput={(e) => set('amount', e.detail.value ?? 0)}
                  type="number"
                  min={0}
                  placeholder="0"
                />
              </FormField>
            </IonCol>
            <IonCol size="12" sizeMd="6">
              <FormField label="Order Status *">
                <IonSelect
                  value={form.status}
                  onIonChange={(e) => set('status', e.detail.value as OrderStatus)}
                  interface="action-sheet"
                  placeholder="Select status"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <IonSelectOption key={s.value} value={s.value}>
                      {s.label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </FormField>
            </IonCol>
          </IonRow>

        </IonGrid>
      </IonContent>

      <IonFooter>
        <IonToolbar className="eom-footer-toolbar">
          <IonButton fill="outline" color="medium" onClick={onClose} slot="start" className="eom-footer-btn">
            Cancel
          </IonButton>
          <IonButton color="warning" onClick={handleSave} slot="end" className="eom-footer-btn">
            <IonIcon slot="start" icon={saveOutline} aria-hidden="true" />
            Update Order
          </IonButton>
        </IonToolbar>
      </IonFooter>
    </>
  );
};

export default EditOrderModal;

// ── reusable field wrapper ────────────────────────────────────────────────────

const FormField: FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <IonItem lines="full" className="eom-field">
    <IonLabel position="stacked" className="eom-label">{label}</IonLabel>
    {children}
  </IonItem>
);