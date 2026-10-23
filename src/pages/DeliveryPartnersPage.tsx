import React, { useState, useEffect, useCallback, FC } from 'react';
import {
  IonContent,
  IonIcon,
  IonAlert,
  IonToast,
  IonSpinner,
} from '@ionic/react';
import {
  personOutline,
  trashOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  timeOutline,
  bicycleOutline,
  callOutline,
  starOutline,
  personAddOutline,
  toggleOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Layout from './Layout';
import { apiGet } from '../api'; // Ensure your api utility handles endpoints correctly

// 1. Structural backend entity mapping contract updated to match your exact payload
export interface DeliveryPartner {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
  profile_image: string | null;
  experience: number;
  availability: string;  // 'Online' / 'Offline'
  shift: string;
  vehicle_type: string;  // e.g., "Bike"
  vehicle_number: string;
  pincode: string;
  city: {
    id: number;
    name: string;
    state_id: number;
  };
  state: {
    id: number;
    name: string;
    country_id: number;
  };
  total_completed_deliveries: number;
  total_orders: number;
  created_at: string;
  updated_at: string;
  rating?: number; // virtual fallback attribute
}

interface ToastState {
  open: boolean;
  message: string;
  color: string;
}

const STATUS_FILTERS = [
  { label: 'All Riders', value: '' },
  { label: 'Online 🟢', value: 'online' },
  { label: 'Offline 🔴', value: 'offline' },
];

const VEHICLE_FILTERS = [
  { label: 'All Vehicles', value: '' },
  { label: 'Motorbike', value: 'bike' },
  { label: 'Scooter', value: 'scooter' },
  { label: 'Bicycle', value: 'bicycle' },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap');
  
  :root {
    --primary:         #FF6B2C;
    --primary-light:  #FFF0E8;
    --primary-dark:   #D94F10;
    --dark:           #1A1208;
    --dark2:          #2D2416;
    --mid:            #7A6A58;
    --muted:          #B0A090;
    --bg:             #FFFBEB;
    --card:           #FFFFFF;
    --border:         #EDE8E0;
    --green:          #22C55E;
    --green-bg:       #F0FDF4;
    --amber:          #F59E0B;
    --amber-bg:       #FFFBEB;
    --blue:           #3B82F6;
    --blue-bg:        #EFF6FF;
    --red:            #EF4444;
    --red-bg:         #FEF2F2;
    --font:           'Plus Jakarta Sans', sans-serif;
    --mono:           'JetBrains Mono', monospace;
    --shadow-sm:      0 1px 4px rgba(26,18,8,0.06);
    --shadow-md:      0 4px 16px rgba(26,18,8,0.10);
    --r:              14px;
    --sidebar-w:      240px;
  }
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  .main-wrap {
    margin-left: var(--sidebar-w);
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    overflow: hidden;
    padding: 0px !important;
  }
  
  .topbar {
    background: #FFFBEB;
    border-bottom: 1px solid var(--border);
    padding: 0 16px;
    height: 58px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
  .topbar-title {
    font-family: var(--font);
    font-size: 16px;
    font-weight: 800;
    color: var(--dark);
    letter-spacing: -.3px;
  }
  .topbar-sub {
    font-family: var(--font);
    font-size: 12px;
    color: var(--muted);
    margin-left: 4px;
  }
  .topbar-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .topbar-btn {
    background: var(--primary);
    color: #fff;
    border: none;
    padding: 7px 14px;
    border-radius: 8px;
    font-family: var(--font);
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    box-shadow: 0 3px 8px rgba(255,107,44,0.3);
  }
  
  .stats-bar {
    background: #FFFBEB;
    border-bottom: 1px solid var(--border);
    padding: 10px 16px;
    display: flex;
    gap: 10px;
    flex-shrink: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .stats-bar::-webkit-scrollbar { display: none; }
  .stat-card {
    flex-shrink: 0;
    background: rgba(255,107,44,0.07);
    border: 1px solid rgba(255,107,44,0.15);
    border-radius: 12px;
    padding: 8px 16px;
    text-align: center;
    min-width: 90px;
  }
  .stat-num { font-family: var(--mono); font-size: 20px; font-weight: 700; color: var(--primary); }
  .stat-label { font-family: var(--font); font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .07em; margin-top: 2px; }
  
  .filters-bar {
    background: #FFFBEB;
    border-bottom: 1px solid var(--border);
    padding: 8px 16px 10px;
    flex-shrink: 0;
  }
  .filter-section { margin-bottom: 6px; }
  .filter-label { font-family: var(--font); font-size: 9px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 5px; }
  .chip-scroll { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
  .chip-scroll::-webkit-scrollbar { display: none; }
  .chip {
    flex-shrink: 0;
    padding: 5px 13px;
    border-radius: 20px;
    font-family: var(--font);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    border: 1.5px solid var(--border);
    color: var(--muted);
    background: var(--card);
    transition: all .15s;
    white-space: nowrap;
  }
  .chip:hover { border-color: var(--primary); color: var(--primary); }
  .chip-active-primary { background: var(--primary); color: #fff !important; border-color: var(--primary) !important; box-shadow: 0 3px 8px rgba(255,107,44,0.3); }
  .chip-active-amber   { background: var(--amber);  color: #fff !important; border-color: var(--amber) !important; }
  
  .orders-content { flex: 1; overflow-y: auto; padding: 16px 16px 80px; background: var(--bg); }
  .orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 12px; }
  
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 32px; gap: 12px; text-align: center; grid-column: 1 / -1; }
  .empty-icon-wrap { width: 72px; height: 72px; background: var(--primary-light); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
  .empty-title { font-family: var(--font); font-size: 17px; font-weight: 700; color: var(--dark); }
  .empty-sub   { font-family: var(--font); font-size: 13px; color: var(--muted); }
  
  .op-card { background: var(--card); border-radius: var(--r); overflow: hidden; border: 1px solid var(--border); box-shadow: var(--shadow-sm); transition: box-shadow .2s, transform .15s; }
  .op-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
  
  .op-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 14px 9px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(to right, #FEFCFA, #FFF8F5);
  }
  .op-order-id { display: flex; align-items: center; gap: 5px; font-family: var(--font); font-size: 13px; font-weight: 700; color: var(--dark); }
  .op-order-id-hash { color: var(--primary); font-family: var(--mono); font-size: 13px; }
  .op-head-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
  .op-rating-badge { display: flex; align-items: center; gap: 3px; font-family: var(--mono); font-size: 13px; font-weight: 700; color: #G75A14; background: #FFF0E6; padding: 2px 6px; border-radius: 6px; }
  .op-date { font-family: var(--font); font-size: 10px; color: var(--muted); }
  
  .op-status-section { padding: 8px 14px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 5px; }
  .op-status-row-inner { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .op-row-label { font-family: var(--font); font-size: 9px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; min-width: 52px; }
  
  .op-pill { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 20px; font-family: var(--font); font-size: 11px; font-weight: 700; white-space: nowrap; }
  .op-pill-green  { background: var(--green-bg); color: #166534; }
  .op-pill-grey   { background: #F3F4F6;          color: #374151; }
  
  .op-payment-pill { display: inline-flex; align-items: center; gap: 3px; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; background: var(--primary-light); color: var(--primary-dark); border: 1px solid #FFE0D1; text-transform: uppercase; }
  
  /* Modern Profile Layout */
  .op-card-body { padding: 12px 14px; display: flex; gap: 12px; align-items: flex-start; }
  .op-profile-container { position: relative; width: 48px; height: 48px; border-radius: 50%; border: 1.5px solid var(--border); background: var(--bg); overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .op-profile-img { width: 100%; height: 100%; object-fit: cover; }
  .op-profile-initials { font-family: var(--font); font-weight: 800; font-size: 14px; color: var(--primary); text-transform: uppercase; }
  
  .op-body-details { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .op-info-row { display: flex; align-items: center; gap: 6px; font-family: var(--font); font-size: 12px; color: var(--mid); }
  .op-info-row ion-icon { font-size: 13px; color: var(--muted); flex-shrink: 0; }
  .op-customer-name { font-size: 14px; font-weight: 700; color: var(--dark); line-height: 1.2; margin-bottom: 2px; }
  .op-location-txt { font-family: var(--font); font-size: 11px; color: var(--muted); }
  
  .op-db-row { margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--border); display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; }
  .op-db-info { display: flex; align-items: center; gap: 7px; flex: 1; min-width: 0; }
  .op-reference-txt { font-family: var(--font); font-size: 12px; color: var(--dark2); font-weight: 600; }
  .op-reference-num { font-family: var(--mono); font-weight: 700; color: var(--primary); }
  
  .op-card-footer { display: flex; border-top: 1px solid var(--border); background: #FAFAFA; }
  .op-footer-btn { flex: 1; padding: 10px 6px; border: none; background: transparent; display: flex; flex-direction: column; align-items: center; gap: 2px; cursor: pointer; font-family: var(--font); font-size: 11px; font-weight: 600; color: var(--mid); transition: all .15s; border-right: 1px solid var(--border); }
  .op-footer-btn:last-child { border-right: none; }
  .op-footer-btn:hover { background: var(--bg); }
  .op-footer-btn ion-icon { font-size: 16px; }
  .op-footer-btn.status-toggle { color: #D97706; }
  .op-footer-btn.del  { color: var(--red); }
  
  .center-loading { display: flex; justify-content: center; align-items: center; height: 300px; width: 100%; grid-column: 1 / -1;}

  @media (max-width: 768px) {
    .main-wrap { margin-left: 0; }
    .orders-grid { grid-template-columns: 1fr; }
  }
`;

const getStatusPillClass = (status: string): string => {
  return status?.toLowerCase() === 'online' ? 'op-pill-green' : 'op-pill-grey';
};

const getStatusText = (status: string): string => {
  return status?.toLowerCase() === 'online' ? 'Online' : 'Offline';
};

// Generates avatar text from rider's name
const getInitials = (name: string): string => {
  if (!name) return 'DP';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const DeliveryPartnersPage: FC = () => {
  const history = useHistory();
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeStatus, setActiveStatus] = useState<string>('');
  const [activeVehicle, setActiveVehicle] = useState<string>('');
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState>({ open: false, message: '', color: 'success' });

  const showToast = (message: string, color = 'success'): void =>
    setToast({ open: true, message, color });

  // Load backend payload safely
  const loadFleetData = async () => {
    setLoading(true);
    try {
      const response = await apiGet('/delivery-partners');
      const payload = response?.data;

      if (Array.isArray(payload?.data)) {
        setPartners(payload.data);
      } else if (Array.isArray(payload)) {
        setPartners(payload);
      } else {
        console.warn('Unexpected /delivery-partners response shape:', payload);
        setPartners([]);
      }
    } catch (error: any) {
      console.error(
        'Fleet load error:',
        error?.response?.status,
        error?.response?.data,
        error
      );

      if (error?.response?.status === 404) {
        setPartners([]);
      } else {
        // Option to display general network alerts
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFleetData();
  }, []);

  // Correct case-insensitive filter arrays
  const filteredPartners = useCallback((): DeliveryPartner[] => {
    return partners.filter((p) => {
      if (activeStatus && p.availability?.toLowerCase() !== activeStatus.toLowerCase()) return false;

      if (activeVehicle) {
        const structuralVehicleType = p.vehicle_type?.toLowerCase() || '';
        if (activeVehicle === 'bike' && structuralVehicleType !== 'bike' && structuralVehicleType !== 'motorbike') {
          return false;
        }
        if (activeVehicle !== 'bike' && structuralVehicleType !== activeVehicle.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [partners, activeStatus, activeVehicle]);

  const handleToggleStatus = (id: number): void => {
    setPartners((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nextStatus = p.availability?.toLowerCase() === 'offline' ? 'Online' : 'Offline';
        return { ...p, availability: nextStatus };
      })
    );
    showToast('Rider availability configuration updated');
  };

  const handleDeleteClick = (id: number): void => {
    setDeleteTargetId(id);
    setShowDeleteAlert(true);
  };

  const confirmDelete = (): void => {
    if (deleteTargetId == null) return;
    setPartners((prev) => prev.filter((p) => p.id !== deleteTargetId));
    showToast('Rider entry removed from fleet', 'danger');
    setShowDeleteAlert(false);
  };

  const filteredList = filteredPartners();

  // Metrics tracking
  const totalRiders = partners.length;
  const activeOnline = partners.filter(p => p.availability?.toLowerCase() === 'online').length;
  const activeOffline = partners.filter(p => p.availability?.toLowerCase() === 'offline').length;

  return (
    <Layout title="Riders" activeNav="Riders">
      <style>{CSS}</style>

      <div className="main-wrap">

        {/* Topbar Row */}
        <div className="topbar">
          <IonIcon icon={bicycleOutline} style={{ fontSize: 20, color: 'var(--primary)' }} />
          <span className="topbar-title">Deliver Rider</span>
          <div className="topbar-right">
            <button className="topbar-btn" onClick={() => history.push('/onboard-rider')}>
              <IonIcon icon={personAddOutline} style={{ fontSize: 14 }} />
              Add Partner
            </button>
          </div>
        </div>

        {/* Fleet Metrics Row Layer */}
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-num">{totalRiders}</div>
            <div className="stat-label">Total Fleet</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: '#22C55E' }}>{activeOnline}</div>
            <div className="stat-label">Online</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: '#EF4444' }}>{activeOffline}</div>
            <div className="stat-label">Offline</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="filter-section">
            <div className="filter-label">Availability Class</div>
            <div className="chip-scroll">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`chip ${activeStatus === f.value ? 'chip-active-primary' : ''}`}
                  onClick={() => setActiveStatus(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-section" style={{ marginTop: 6 }}>
            <div className="filter-label">Vehicle Segment</div>
            <div className="chip-scroll">
              {VEHICLE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`chip ${activeVehicle === f.value ? 'chip-active-amber' : ''}`}
                  onClick={() => setActiveVehicle(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fleet Grid Interior Content */}
        <IonContent className="ion-no-padding">
          <div className="orders-content">
            <div className="orders-grid">

              {loading ? (
                <div className="center-loading">
                  <IonSpinner name="crescent" color="primary" />
                </div>
              ) : filteredList.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon-wrap">
                    <IonIcon icon={personOutline} style={{ fontSize: 32, color: 'var(--primary)' }} />
                  </div>
                  <div className="empty-title">No riders match parameters</div>
                  <div className="empty-sub">
                    {activeStatus || activeVehicle
                      ? 'Try clearing your vehicle or status parameters'
                      : 'Onboarded delivery riders will be listed here'}
                  </div>
                </div>
              ) : (
                filteredList.map((partner) => {
                  return (
                    <div key={partner.id} className="op-card">

                      {/* Header */}
                      <div className="op-card-head">
                        <div className="op-order-id">
                          <IonIcon icon={personOutline} style={{ fontSize: 13, color: 'var(--muted)' }} />
                          RIDER ID&nbsp;
                          <span className="op-order-id-hash">#{partner.id}</span>
                        </div>
                        <div className="op-head-right">
                          <div className="op-rating-badge">
                            <IonIcon icon={starOutline} style={{ fontSize: 11, verticalAlign: 'middle' }} />
                            {partner.rating ? partner.rating.toFixed(1) : '5.0'}
                          </div>
                          <div className="op-date">
                            <IonIcon icon={timeOutline} style={{ fontSize: 10, verticalAlign: 'middle', marginRight: 3 }} />
                            Shift: {partner.shift || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Statuses */}
                      <div className="op-status-section">
                        <div className="op-status-row-inner">
                          <span className="op-row-label">Duty</span>
                          <span className={`op-pill ${getStatusPillClass(partner.availability)}`}>
                            • {getStatusText(partner.availability)}
                          </span>
                        </div>

                        <div className="op-status-row-inner">
                          <span className="op-row-label">Vehicle</span>
                          <span className="op-payment-pill">
                            <IonIcon icon={bicycleOutline} style={{ fontSize: 10 }} />
                            {partner.vehicle_type} ({partner.vehicle_number})
                          </span>
                        </div>
                      </div>

                      {/* Flex Card Body with Profile Picture & Details */}
                      <div className="op-card-body">
                        
                        {/* Profile Image Column */}
                        <div className="op-profile-container">
                          {partner.profile_image ? (
                            <img 
                              src={partner.profile_image} 
                              alt={partner.name} 
                              className="op-profile-img"
                              onError={(e) => {
                                // Graceful fallback if URL breaks
                                (e.target as HTMLImageElement).style.display = 'none';
                                const fallback = (e.target as HTMLImageElement).parentElement?.querySelector('.op-profile-initials');
                                if (fallback) (fallback as HTMLElement).style.display = 'block';
                              }}
                            />
                          ) : null}
                          <span 
                            className="op-profile-initials" 
                            style={{ display: partner.profile_image ? 'none' : 'block' }}
                          >
                            {getInitials(partner.name)}
                          </span>
                        </div>

                        {/* Text Details Column */}
                        <div className="op-body-details">
                          <span className="op-customer-name">{partner.name || 'Unnamed Rider'}</span>
                          
                          <div className="op-location-txt">
                            {partner.city?.name || 'N/A'}, {partner.state?.name || 'N/A'}
                          </div>

                          <div className="op-info-row" style={{ marginTop: 4 }}>
                            <span className="select-all">
                              <IonIcon icon={callOutline} style={{ verticalAlign: 'middle', marginRight: 4 }} /> 
                              {partner.phone || 'No Contact Number'}
                            </span>
                          </div>

                          <div className="op-db-row">
                            <div className="op-db-info">
                              <div className="op-db-avatar" style={{ fontSize: 11 }}>📦</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="op-reference-txt">
                                  Completed: <span className="op-reference-num">{partner.total_completed_deliveries || 0} orders</span>
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="op-card-footer">
                        <button className="op-footer-btn status-toggle" onClick={() => handleToggleStatus(partner.id)}>
                          <IonIcon icon={toggleOutline} />
                          Shift Status
                        </button>
                        <button className="op-footer-btn del" onClick={() => handleDeleteClick(partner.id)}>
                          <IonIcon icon={trashOutline} />
                          Terminate
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        </IonContent>
      </div>

      {/* Delete Alert */}
      <IonAlert
        isOpen={showDeleteAlert}
        header="Remove Partner Profile"
        message="Are you certain you want to remove this driver profile from active roster mappings? This cannot be undone."
        buttons={[
          { text: 'Cancel', role: 'cancel', handler: () => setShowDeleteAlert(false) },
          { text: 'Remove Profile', role: 'destructive', cssClass: 'alert-btn-danger', handler: confirmDelete },
        ]}
        onDidDismiss={() => setShowDeleteAlert(false)}
      />

      {/* Toast Notification */}
      <IonToast
        isOpen={toast.open}
        message={toast.message}
        color={toast.color}
        duration={2000}
        onDidDismiss={() => setToast((p) => ({ ...p, open: false }))}
        icon={toast.color === 'danger' ? closeCircleOutline : checkmarkCircleOutline}
      />

    </Layout>
  );
};

export default DeliveryPartnersPage;