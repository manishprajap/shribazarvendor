import React, { useState, FC, useEffect, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonToast,
} from '@ionic/react';
import {
  personAddOutline,
  arrowBackOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  cardOutline,
  bicycleOutline,
  walletOutline,
  personOutline,
  callOutline,
  mailOutline,
  locationOutline,
  shieldCheckmarkOutline,
  calendarOutline,
  cameraOutline,
  trashOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Layout from './Layout';
import { apiPost, apiGet } from '../api'; // Assumes apiGet helper exists, matching apiPost

interface ToastState {
  open: boolean;
  message: string;
  color: string;
}

interface DropdownItem {
  id: number | string;
  name: string;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght=400;500;600;700;800&family=JetBrains+Mono:wght=600;700&display=swap');
  
  :root {
    --primary:        #FF6B2C;
    --primary-light:  #FFF0E8;
    --primary-dark:   #D94F10;
    --dark:           #1A1208;
    --dark2:          #2D2416;
    --mid:            #7A6A58;
    --muted:          #B0A090;
    --bg:             #FFFBEB;
    --card:           #FFFFFF;
    --border:         #EDE8E0;
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
    font-size: 18px;
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
  .btn-back {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--dark);
    padding: 6px 12px;
    border-radius: 8px;
    font-family: var(--font);
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-back:hover { background: var(--card); border-color: var(--primary); color: var(--primary); }
  
  .form-scroll-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px 20px 100px;
    background: var(--bg);
  }
  .form-max-width {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .form-section-card {
    background: var(--card);
    border-radius: var(--r);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(to right, #FEFCFA, #FFF8F5);
  }
  .section-header ion-icon {
    font-size: 16px;
    color: var(--primary);
  }
  .section-title {
    font-family: var(--font);
    font-size: 13px;
    font-weight: 800;
    color: var(--dark);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .section-body {
    padding: 16px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
  .full-width-field {
    grid-column: span 2;
  }
  
  .field-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .field-label {
    font-family: var(--font);
    font-size: 10px;
    font-weight: 700;
    color: var(--mid);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .input-wrapper ion-icon {
    position: absolute;
    left: 12px;
    font-size: 14px;
    color: var(--muted);
    pointer-events: none;
  }
  .custom-input {
    width: 100%;
    padding: 9px 12px 9px 36px;
    border-radius: 8px;
    border: 1.5px solid var(--border);
    font-family: var(--font);
    font-size: 13px;
    color: var(--dark);
    outline: none;
    background: #ffffff;
    transition: border-color 0.15s;
  }
  .custom-input:focus {
    border-color: var(--primary);
  }
  .custom-textarea {
    width: 100%;
    min-height: 70px;
    padding: 9px 12px;
    border-radius: 8px;
    border: 1.5px solid var(--border);
    font-family: var(--font);
    font-size: 13px;
    color: var(--dark);
    outline: none;
    background: #ffffff;
    resize: vertical;
  }
  .custom-textarea:focus {
    border-color: var(--primary);
  }

  /* 📸 Profile Image Upload */
  .avatar-upload-row {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 4px 0 8px;
  }
  .avatar-preview {
    width: 84px;
    height: 84px;
    border-radius: 50%;
    border: 2px dashed var(--border);
    background: var(--primary-light);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    position: relative;
  }
  .avatar-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .avatar-preview ion-icon {
    font-size: 30px;
    color: var(--primary);
  }
  .avatar-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .avatar-hint {
    font-family: var(--font);
    font-size: 11px;
    color: var(--muted);
  }
  .avatar-btn-group {
    display: flex;
    gap: 8px;
  }
  .btn-upload {
    background: var(--primary);
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-family: var(--font);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 0.15s;
  }
  .btn-upload:hover { background: var(--primary-dark); }
  .btn-remove-img {
    background: transparent;
    color: #C0392B;
    border: 1px solid #F0D5D0;
    padding: 8px 14px;
    border-radius: 8px;
    font-family: var(--font);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s;
  }
  .btn-remove-img:hover { background: #FDF0EF; }
  
  .submit-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 10px;
    padding-top: 10px;
  }
  .btn-submit-main {
    background: var(--primary);
    color: #fff;
    border: none;
    padding: 12px 28px;
    border-radius: 8px;
    font-family: var(--font);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(255,107,44,0.3);
    transition: background 0.15s;
  }
  .btn-submit-main:hover { background: var(--primary-dark); }
  .btn-submit-main:disabled { background: var(--muted); cursor: not-allowed; box-shadow: none; }
  
  @media (max-width: 768px) {
    .main-wrap { margin-left: 0; }
    .section-body { grid-template-columns: 1fr; }
    .full-width-field { grid-column: span 1; }
  }
`;

const MAX_IMAGE_SIZE_MB = 5;

const DeliveryPartnerRegister: FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // States to hold the dynamic geographical lists
  const [countries, setCountries] = useState<DropdownItem[]>([]);
  const [states, setStates] = useState<DropdownItem[]>([]);
  const [cities, setCities] = useState<DropdownItem[]>([]);

  // 📸 Profile image state
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    country: '', // Storing Country ID or Name
    city: '',    // Storing City ID or Name
    state: '',   // Storing State ID or Name
    pincode: '',
    aadhaar: '',
    pan: '',
    license: '',
    vehicleType: '',
    vehicleNumber: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    upi: '',
    emergencyContact: '',
    father_name: '',
    dob: '',
  });

  const [toast, setToast] = useState<ToastState>({ open: false, message: '', color: 'success' });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // 📸 Handle profile image selection
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ open: true, message: 'Please select a valid image file.', color: 'danger' });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setToast({ open: true, message: `Image must be under ${MAX_IMAGE_SIZE_MB}MB.`, color: 'danger' });
      return;
    }

    setProfileFile(file);
    const previewUrl = URL.createObjectURL(file);
    setProfilePreview(previewUrl);
  };

  const handleRemoveProfileImage = () => {
    if (profilePreview) {
      URL.revokeObjectURL(profilePreview);
    }
    setProfileFile(null);
    setProfilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (profilePreview) {
        URL.revokeObjectURL(profilePreview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch initial Country List
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await apiGet('/countries');
        if (res && (res.success || Array.isArray(res))) {
          const countryList = Array.isArray(res) ? res : res.data || [];
          setCountries(countryList);

          // Find India and auto-select it
          const india = countryList.find(
            (c: DropdownItem) => c.name.toLowerCase() === 'india'
          );
          if (india) {
            handleChange('country', india.id.toString());
            fetchStates(india.id);
          }
        }
      } catch (err) {
        console.error('Failed to load countries:', err);
      }
    };
    fetchCountries();
  }, []);

  // Fetch State List based on Selected Country ID
  const fetchStates = async (countryId: number | string) => {
    try {
      const res = await apiGet(`/states/${countryId}`);
      const stateList = Array.isArray(res) ? res : res.data || [];
      setStates(stateList);
      setCities([]); // Reset cities list on country change
      setForm(prev => ({ ...prev, state: '', city: '' }));
    } catch (err) {
      console.error('Failed to load states:', err);
    }
  };

  // Fetch City List based on Selected State ID
  const fetchCities = async (stateId: number | string) => {
    try {
      const res = await apiGet(`/cities/${stateId}`);
      const cityList = Array.isArray(res) ? res : res.data || [];
      setCities(cityList);
      setForm(prev => ({ ...prev, city: '' }));
    } catch (err) {
      console.error('Failed to load cities:', err);
    }
  };

  // Event handler for country selection change
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    handleChange('country', value);
    if (value) {
      fetchStates(value);
    } else {
      setStates([]);
      setCities([]);
    }
  };

  // Event handler for state selection change
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    handleChange('state', value);
    if (value) {
      fetchCities(value);
    } else {
      setCities([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!form.name || !form.phone || !form.father_name || !form.dob || !form.email || !form.password || !form.vehicleNumber || !form.vehicleType) {
    setToast({ open: true, message: 'Please fill in all mandatory fields.', color: 'danger' });
    return;
  }

  setLoading(true);

  const selectedCountry = countries.find(c => c.id.toString() === form.country)?.name || '';
  const selectedState = states.find(s => s.id.toString() === form.state)?.name || '';
  const selectedCity = cities.find(ci => ci.id.toString() === form.city)?.name || '';

  const formData = new FormData();
  formData.append('name', form.name);
  formData.append('email', form.email);
  formData.append('phone', form.phone);
  formData.append('password', form.password);
  formData.append('father_name', form.father_name);
  formData.append('dob', form.dob);
  formData.append('address', form.address || '');

  // ✅ FIX: ab IDs bhej rahe hain jo backend country_id/state_id/city_id
  // columns me directly store ho sakti hain — pehle 'country'/'state'/'city'
  // string names bhej rahe the jo backend 'warehouse_country' etc. expect
  // kar raha tha, isliye ye teeno column hamesha NULL save ho rahe the.
  formData.append('country_id', form.country || '');
  formData.append('state_id', form.state || '');
  formData.append('city_id', form.city || '');
  formData.append('country_name', selectedCountry);
  formData.append('state_name', selectedState);
  formData.append('city_name', selectedCity);

  formData.append('pincode', form.pincode || '');
  formData.append('idproof_type', 'Aadhar');
  formData.append('idproof_number', form.aadhaar || '');
  formData.append('vehicle_type', form.vehicleType);
  formData.append('vehicle_number', form.vehicleNumber.toUpperCase());
  formData.append('account_no', form.accountNumber || '');
  formData.append('ifsc', form.ifsc ? form.ifsc.toUpperCase() : '');
  formData.append('upi', form.upi ? form.upi.toLowerCase() : '');
  formData.append('shift', 'Full-time');
  formData.append('experience', '0');

  if (profileFile) {
    formData.append('profile', profileFile);
  }

  try {
    const response = await apiPost('/onboard-rider', formData);

    if (response && response.success) {
      setToast({ open: true, message: response.message || 'Rider onboarded successfully!', color: 'success' });
      setTimeout(() => { history.goBack(); }, 1500);
    } else {
      setToast({ open: true, message: response?.message || 'Something went wrong. Please try again.', color: 'danger' });
    }
  } catch (error: any) {
    console.error('Submit Error:', error);
    setToast({ open: true, message: error?.message || 'Something went wrong. Please try again.', color: 'danger' });
  } finally {
    setLoading(false);
  }
};

  return (
    <Layout title="Onboard Rider" activeNav="Riders">
      <style>{CSS}</style>

      <div className="main-wrap">

        <div className="topbar">
          <button className="btn-back" onClick={() => history.goBack()}>
            <IonIcon icon={arrowBackOutline} />
            Back
          </button>
        </div>

        <IonContent className="ion-no-padding" style={{ '--padding-top': '0px', '--padding-bottom': '0px' }}>
          <div className="form-scroll-content">
            <form className="form-max-width" onSubmit={handleSubmit}>

              {/* SECTION 1: Identity */}
              <div className="form-section-card">
                <div className="section-header">
                  <IonIcon icon={personOutline} />
                  <span className="section-title">Identity Coordinates</span>
                </div>
                <div className="section-body">

                  {/* 📸 Profile Image Upload - full width, first field */}
                  <div className="field-group full-width-field">
                    <label className="field-label">Profile Photo</label>
                    <div className="avatar-upload-row">
                      <div className="avatar-preview">
                        {profilePreview ? (
                          <img src={profilePreview} alt="Profile preview" />
                        ) : (
                          <IonIcon icon={personOutline} />
                        )}
                      </div>
                      <div className="avatar-actions">
                        <span className="avatar-hint">JPG or PNG, up to {MAX_IMAGE_SIZE_MB}MB</span>
                        <div className="avatar-btn-group">
                          <button
                            type="button"
                            className="btn-upload"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <IonIcon icon={cameraOutline} />
                            {profilePreview ? 'Change Photo' : 'Upload Photo'}
                          </button>
                          {profilePreview && (
                            <button
                              type="button"
                              className="btn-remove-img"
                              onClick={handleRemoveProfileImage}
                            >
                              <IonIcon icon={trashOutline} />
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleProfileImageChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Full Name *</label>
                    <div className="input-wrapper">
                      <IonIcon icon={personOutline} />
                      <input type="text" className="custom-input" placeholder="Enter registration name" value={form.name} onChange={e => handleChange('name', e.target.value)} />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Father's Name *</label>
                    <div className="input-wrapper">
                      <IonIcon icon={personOutline} />
                      <input type="text" className="custom-input" placeholder="Enter father's name" value={form.father_name} onChange={e => handleChange('father_name', e.target.value)} />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Mobile No. *</label>
                    <div className="input-wrapper">
                      <IonIcon icon={callOutline} />
                      <input type="tel" className="custom-input" placeholder="9876543210" value={form.phone} onChange={e => handleChange('phone', e.target.value)} />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Email Address *</label>
                    <div className="input-wrapper">
                      <IonIcon icon={mailOutline} />
                      <input type="email" className="custom-input" placeholder="courier@shribazar.com" value={form.email} onChange={e => handleChange('email', e.target.value)} />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">DOB *</label>
                    <div className="input-wrapper">
                      <IonIcon icon={calendarOutline} />
                      <input type="date" className="custom-input" value={form.dob} onChange={e => handleChange('dob', e.target.value)} />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Password *</label>
                    <div className="input-wrapper">
                      <IonIcon icon={shieldCheckmarkOutline} />
                      <input type="password" className="custom-input" placeholder="••••••••" value={form.password} onChange={e => handleChange('password', e.target.value)} />
                    </div>
                  </div>

                  {/* Country Dropdown */}
                  <div className="field-group">
                    <label className="field-label">Country *</label>
                    <div className="input-wrapper">
                      <IonIcon icon={locationOutline} style={{ zIndex: 10 }} />
                      <select className="custom-input" style={{ appearance: 'none', paddingLeft: '36px' }} value={form.country} onChange={handleCountryChange}>
                        <option value="">-- Select Country --</option>
                        {countries.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* State Dropdown */}
                  <div className="field-group">
                    <label className="field-label">State *</label>
                    <div className="input-wrapper">
                      <IonIcon icon={locationOutline} style={{ zIndex: 10 }} />
                      <select className="custom-input" style={{ appearance: 'none', paddingLeft: '36px' }} value={form.state} onChange={handleStateChange}>
                        <option value="">-- Select State --</option>
                        {states.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* City Dropdown */}
                  <div className="field-group">
                    <label className="field-label">City *</label>
                    <div className="input-wrapper">
                      <IonIcon icon={locationOutline} style={{ zIndex: 10 }} />
                      <select className="custom-input" style={{ appearance: 'none', paddingLeft: '36px' }} value={form.city} onChange={e => handleChange('city', e.target.value)}>
                        <option value="">-- Select City --</option>
                        {cities.map((ci) => (
                          <option key={ci.id} value={ci.id}>{ci.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Pincode</label>
                    <div className="input-wrapper">
                      <IonIcon icon={locationOutline} />
                      <input type="text" className="custom-input" placeholder="226001" value={form.pincode} onChange={e => handleChange('pincode', e.target.value)} />
                    </div>
                  </div>
                  <div className="field-group full-width-field">
                    <label className="field-label">Residential Address</label>
                    <textarea className="custom-textarea" placeholder="Enter full address..." value={form.address} onChange={e => handleChange('address', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Compliance */}
              <div className="form-section-card">
                <div className="section-header">
                  <IonIcon icon={shieldCheckmarkOutline} />
                  <span className="section-title">Compliance Registry Numbers</span>
                </div>
                <div className="section-body">
                  <div className="field-group">
                    <label className="field-label">Aadhaar Number</label>
                    <div className="input-wrapper">
                      <IonIcon icon={cardOutline} />
                      <input type="text" className="custom-input" placeholder="0000 0000 0000" value={form.aadhaar} onChange={e => handleChange('aadhaar', e.target.value)} />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">PAN Card</label>
                    <div className="input-wrapper">
                      <IonIcon icon={cardOutline} />
                      <input type="text" className="custom-input" placeholder="ABCDE1234F" value={form.pan} onChange={e => handleChange('pan', e.target.value.toUpperCase())} />
                    </div>
                  </div>
                  <div className="field-group full-width-field">
                    <label className="field-label">Driving License</label>
                    <div className="input-wrapper">
                      <IonIcon icon={shieldCheckmarkOutline} />
                      <input type="text" className="custom-input" placeholder="DL-32XXXXXXXXXXXXX" value={form.license} onChange={e => handleChange('license', e.target.value.toUpperCase())} />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Vehicle */}
              <div className="form-section-card">
                <div className="section-header">
                  <IonIcon icon={bicycleOutline} />
                  <span className="section-title">Fleet Allocation Asset Metrics</span>
                </div>
                <div className="section-body">
                  <div className="field-group">
                    <label className="field-label">Vehicle Type *</label>
                    <div className="input-wrapper">
                      <IonIcon icon={bicycleOutline} style={{ zIndex: 10 }} />
                      <select className="custom-input" style={{ appearance: 'none', paddingLeft: '36px' }} value={form.vehicleType} onChange={e => handleChange('vehicleType', e.target.value)}>
                        <option value="">Select vehicle type...</option>
                        <option value="Bike">Motorbike</option>
                        <option value="Scooter">Scooter</option>
                        <option value="Cycle">Bicycle</option>
                      </select>
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Vehicle Number *</label>
                    <div className="input-wrapper">
                      <IonIcon icon={cardOutline} />
                      <input type="text" className="custom-input" placeholder="UP32AB1234" value={form.vehicleNumber} onChange={e => handleChange('vehicleNumber', e.target.value.toUpperCase())} />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Bank */}
              <div className="form-section-card">
                <div className="section-header">
                  <IonIcon icon={walletOutline} />
                  <span className="section-title">Payout Clearing Interface</span>
                </div>
                <div className="section-body">
                  <div className="field-group">
                    <label className="field-label">Bank Name</label>
                    <div className="input-wrapper">
                      <IonIcon icon={walletOutline} />
                      <input type="text" className="custom-input" placeholder="State Bank of India" value={form.bankName} onChange={e => handleChange('bankName', e.target.value)} />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">IFSC Code</label>
                    <div className="input-wrapper">
                      <IonIcon icon={cardOutline} />
                      <input type="text" className="custom-input" placeholder="SBIN0001234" value={form.ifsc} onChange={e => handleChange('ifsc', e.target.value.toUpperCase())} />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Account Number</label>
                    <div className="input-wrapper">
                      <IonIcon icon={walletOutline} />
                      <input type="password" className="custom-input" placeholder="000000000000" value={form.accountNumber} onChange={e => handleChange('accountNumber', e.target.value)} />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">UPI ID</label>
                    <div className="input-wrapper">
                      <IonIcon icon={cardOutline} />
                      <input type="text" className="custom-input" placeholder="rider@ybl" value={form.upi} onChange={e => handleChange('upi', e.target.value.toLowerCase())} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="submit-bar">
                <button type="submit" className="btn-submit-main" disabled={loading}>
                  {loading ? 'Submitting...' : 'Register Delivery Partner'}
                </button>
              </div>

            </form>
          </div>
        </IonContent>
      </div>

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

export default DeliveryPartnerRegister;