import React, { useState, useEffect, useCallback, useRef } from "react";
import Layout from "./Layout";
import { useHistory, useParams } from "react-router-dom";
import { apiPost, apiPut, apiGet, getUser } from "../api";

const responsiveStyles = `
  *, *::before, *::after { box-sizing: border-box; }

  .form-section-title {
    font-size: 13px;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 28px 0 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid #F0F0EA;
  }
  .form-section-title:first-child { margin-top: 0; }

  .form-grid-3 { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px; margin-bottom: 18px; }
  .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
  .form-grid-1 { display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 18px; }

  .field-group { display: flex; flex-direction: column; gap: 5px; }
  .field-label { font-size: 13px; font-weight: 500; color: #444; }
  .field-required { color: #e53e3e; margin-left: 2px; }
  .field-input {
    width: 100%; padding: 9px 12px; border: 1px solid #E0E0DA; border-radius: 8px;
    font-size: 14px; color: #222; background: #fff; outline: none; transition: border-color 0.2s;
  }
  .field-input:focus { border-color: #00B894; }
  .field-input:disabled { background: #FAFAF8; cursor: not-allowed; color: #999; }
  textarea.field-input { resize: vertical; min-height: 60px; font-family: inherit; }

  .field-error-banner {
    background: #FEF2F2; border: 1px solid #FCA5A5; color: #DC2626;
    padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 18px; white-space: pre-line;
  }
  .field-hint { font-size: 11.5px; color: #999; margin-top: 2px; }

  .password-input-wrapper, .otp-input-wrapper { position: relative; display: flex; align-items: center; gap: 8px; }
  .password-toggle-btn {
    position: absolute; right: 10px; background: none; border: none; cursor: pointer;
    color: #888; font-size: 12px; font-weight: 600; padding: 4px 6px;
  }
  .password-toggle-btn:hover { color: #444; }

  .otp-action-btn {
    white-space: nowrap; padding: 9px 14px; border-radius: 8px; border: 1px solid #00B894;
    background: #fff; color: #00B894; font-size: 13px; font-weight: 600; cursor: pointer;
  }
  .otp-action-btn:disabled { border-color: #ddd; color: #aaa; cursor: not-allowed; }
  .otp-verified-badge { font-size: 12px; font-weight: 600; color: #00B894; display: flex; align-items: center; gap: 4px; white-space: nowrap; }

  .day-selector { display: flex; flex-wrap: wrap; gap: 8px; }
  .day-chip {
    padding: 7px 14px; border-radius: 20px; border: 1px solid #E0E0DA; background: #fff;
    font-size: 13px; color: #555; cursor: pointer; transition: all 0.15s;
  }
  .day-chip.active { background: #00B894; border-color: #00B894; color: #fff; font-weight: 600; }

  .radio-row { display: flex; gap: 18px; align-items: center; padding-top: 4px; }
  .radio-option { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #444; cursor: pointer; }
  .radio-option input { accent-color: #00B894; cursor: pointer; }

  .checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #555; margin-top: -6px; margin-bottom: 14px; }
  .checkbox-row input { accent-color: #00B894; cursor: pointer; }

  .photo-upload-wrapper { display: flex; align-items: center; gap: 16px; }
  .photo-preview { width: 84px; height: 84px; border-radius: 10px; object-fit: cover; border: 1px solid #E0E0DA; background: #FAFAF8; }
  .photo-placeholder {
    width: 84px; height: 84px; border-radius: 10px; border: 1.5px dashed #D8D8D2; background: #FAFAF8;
    display: flex; align-items: center; justify-content: center; font-size: 11px; color: #aaa; text-align: center; padding: 4px;
  }
  .photo-upload-btn {
    padding: 8px 16px; border-radius: 6px; border: 1px solid #E0E0DA; background: #fff;
    color: #444; font-size: 13px; font-weight: 500; cursor: pointer;
  }
  .photo-upload-btn:hover { border-color: #00B894; color: #00B894; }

  /* ── Tabs / Stepper ── */
  .stepper {
    display: flex; align-items: center; margin-bottom: 26px;
  }
  .step-item { display: flex; align-items: center; flex: 1; }
  .step-circle {
    width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; border: 2px solid #E0E0DA; color: #999; background: #fff; flex-shrink: 0;
    transition: all 0.2s;
  }
  .step-circle.active { border-color: #00B894; color: #00B894; }
  .step-circle.done { border-color: #00B894; background: #00B894; color: #fff; }
  .step-label { font-size: 12.5px; color: #999; margin-left: 8px; font-weight: 500; white-space: nowrap; }
  .step-label.active { color: #222; font-weight: 600; }
  .step-connector { flex: 1; height: 2px; background: #E0E0DA; margin: 0 10px; }
  .step-connector.done { background: #00B894; }

  .wizard-actions {
    display: flex; align-items: center; justify-content: space-between; margin-top: 24px;
    padding-top: 18px; border-top: 1px solid #F0F0EA;
  }

  .page-loading-box {
    padding: 60px 0; text-align: center; color: #888; font-size: 14px;
  }

  @media (max-width: 768px) {
    .form-grid-3, .form-grid-2 { grid-template-columns: 1fr; }
    .step-label { display: none; }
  }

  .pp-back-btn {
    align-self: flex-start;
    background: none;
    border: none;
    color: #FF6B35;
    font-size: 14px;
    cursor: pointer;
    padding: 0;
    margin-bottom: 12px;
  }
`;

type VendorUser = { id: number; name: string; role_id: number; role: string; };

type RouteParams = { id?: string };

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STEPS = ["Basic & Contact", "Address & ID Proof", "Employment & Security"];

type PackerFormData = {
  email: string;
  name: string;
  gender: string;
  dob: string;
  phone: string;
  altPhone: string;
  currentAddress: string;
  permanentAddress: string;
  sameAsCurrent: boolean;
  city: string;
  state: string;
  pincode: string;
  aadhaar: string;
  pan: string;
  otherIdType: string;
  otherIdNumber: string;
  joiningDate: string;
  workingDays: string[];
  shiftStart: string;
  shiftEnd: string;
  availabilityStatus: string;
  bankAccountHolder: string;
  bankAccountNumber: string;
  bankIFSC: string;
  upiId: string;
  password: string;
  confirmPassword: string;
  status: string;
};

const EMPTY_FORM: PackerFormData = {
  name: "", gender: "", dob: "", phone: "", altPhone: "",
  currentAddress: "", permanentAddress: "", sameAsCurrent: false,
  city: "", state: "", pincode: "",
  aadhaar: "", pan: "", otherIdType: "", otherIdNumber: "",
  joiningDate: "", workingDays: [], shiftStart: "", shiftEnd: "", availabilityStatus: "Active",
  bankAccountHolder: "", bankAccountNumber: "", bankIFSC: "", upiId: "",
  password: "", confirmPassword: "", status: "Active",
  email: "",
};

const Field: React.FC<{ label: string; required?: boolean; hint?: string; children: React.ReactNode }> = ({
  label, required, hint, children,
}) => (
  <div className="field-group">
    <label className="field-label">
      {label}
      {required && <span className="field-required">*</span>}
    </label>
    {children}
    {hint && <span className="field-hint">{hint}</span>}
  </div>
);

const Stepper: React.FC<{ current: number }> = ({ current }) => (
  <div className="stepper">
    {STEPS.map((label, idx) => (
      <React.Fragment key={label}>
        <div className="step-item">
          <div className={`step-circle ${idx === current ? "active" : ""} ${idx < current ? "done" : ""}`}>
            {idx < current ? "✓" : idx + 1}
          </div>
          <span className={`step-label ${idx === current ? "active" : ""}`}>{label}</span>
        </div>
        {idx < STEPS.length - 1 && <div className={`step-connector ${idx < current ? "done" : ""}`} />}
      </React.Fragment>
    ))}
  </div>
);

const PackerRegister: React.FC = () => {
  const history = useHistory();
 const { id } = useParams<RouteParams>();
const isEditMode = !!id && id !== "new" && id !== "register"; 

  const vendor = getUser() as VendorUser | null;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PackerFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  const [loadingPacker, setLoadingPacker] = useState(isEditMode);

  useEffect(() => {
    if (!vendor) {
      history.replace("/login");
    }
  }, [vendor, history]);

  // ✅ Tab change hote hi error banner clear — purana error naye tab pe confusing lagta hai
  useEffect(() => {
    setFormError("");
  }, [step]);

  // ✅ EDIT MODE: packer ka existing data fetch karke form fill karo
  useEffect(() => {
    if (!isEditMode || !id) return;

    (async () => {
      setLoadingPacker(true);
      setFormError("");
      try {
        const res = await apiGet(`/vendor/packers/${id}`);
        const p = res.data ?? res;

        let workingDaysArr: string[] = [];
        if (Array.isArray(p.working_days)) {
          workingDaysArr = p.working_days;
        } else if (typeof p.working_days === "string" && p.working_days.trim()) {
          try {
            workingDaysArr = JSON.parse(p.working_days);
          } catch {
            workingDaysArr = [];
          }
        }

        setForm({
          ...EMPTY_FORM,
          name: p.name ?? "",
          email: p.email ?? "",
          gender: p.gender ?? "",
          dob: p.dob ?? "",
          phone: p.phone ?? "",
          altPhone: p.alt_phone ?? "",
          currentAddress: p.current_address ?? "",
          permanentAddress: p.permanent_address ?? "",
          sameAsCurrent:
            !!p.current_address &&
            !!p.permanent_address &&
            p.current_address === p.permanent_address,
          city: p.city ?? "",
          state: p.state ?? "",
          pincode: p.pincode ?? "",
          aadhaar: p.aadhaar ?? "",
          pan: p.pan ?? "",
          otherIdType: p.other_id_type ?? "",
          otherIdNumber: p.other_id_number ?? "",
          joiningDate: p.joining_date ?? "",
          workingDays: workingDaysArr,
          shiftStart: p.shift_start ?? "",
          shiftEnd: p.shift_end ?? "",
          availabilityStatus: p.availability_status ?? "Active",
          bankAccountHolder: p.bank_account_holder ?? "",
          bankAccountNumber: p.bank_account_number ?? "",
          bankIFSC: p.bank_ifsc ?? "",
          upiId: p.upi_id ?? "",
          password: "",
          confirmPassword: "",
          status: p.status ?? "Active",
        });

        if (p.photo_url) setPhotoPreview(p.photo_url);
        else if (p.photo) setPhotoPreview(p.photo);

        // Phone already registered & verified earlier — skip OTP re-verification in edit mode
        setOtpVerified(true);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Failed to load packer details");
      } finally {
        setLoadingPacker(false);
      }
    })();
  }, [id, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "phone" || name === "altPhone") {
      setForm((prev) => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, 10) }));
      if (name === "phone" && !isEditMode) {
        setOtpSent(false);
        setOtpVerified(false);
        setOtp("");
      }
      return;
    }
    if (name === "aadhaar") {
      setForm((prev) => ({ ...prev, aadhaar: value.replace(/\D/g, "").slice(0, 12) }));
      return;
    }
    if (name === "pincode") {
      setForm((prev) => ({ ...prev, pincode: value.replace(/\D/g, "").slice(0, 6) }));
      return;
    }
    if (name === "pan") {
      setForm((prev) => ({ ...prev, pan: value.toUpperCase().slice(0, 10) }));
      return;
    }
    if (name === "sameAsCurrent") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({
        ...prev,
        sameAsCurrent: checked,
        permanentAddress: checked ? prev.currentAddress : prev.permanentAddress,
      }));
      return;
    }

    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "currentAddress" && prev.sameAsCurrent) {
        updated.permanentAddress = value;
      }
      return updated;
    });
  };

  const toggleWorkingDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file for photo.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setFormError("Photo size should be under 3MB.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(form.phone.trim())) {
      setFormError("Enter a valid 10-digit phone number before sending OTP.");
      return;
    }
    setFormError("");
    setOtpSending(true);
    try {
      await apiPost("/vendor/packers/send-otp", { phone: form.phone.trim() });
      setOtpSent(true);
      alert("OTP sent to " + form.phone);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setFormError("Enter the OTP you received.");
      return;
    }
    setFormError("");
    setOtpVerifying(true);
    try {
      await apiPost("/vendor/packers/verify-otp", { phone: form.phone.trim(), otp: otp.trim() });
      setOtpVerified(true);
      alert("Phone number verified successfully!");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setOtpVerifying(false);
    }
  };

  // ✅ Har tab ka apna validation — jab tak sab required fields sahi nahi, "Next" aage nahi jaane dega
  const validateStep1 = (): string | null => {
    if (!form.name.trim()) return "Full Name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.dob) return "Date of Birth is required.";
    // In edit mode an existing photo already counts, new upload is optional
    if (!isEditMode && !photoFile) return "Please upload a photo (ID/Profile).";
    if (!photoFile && !photoPreview) return "Please upload a photo (ID/Profile).";
    if (!/^\d{10}$/.test(form.phone.trim())) return "Enter a valid 10-digit mobile number.";
    // OTP re-verification skipped in edit mode (number already verified earlier)
    if (!isEditMode && !otpVerified) return "Please verify the mobile number via OTP before proceeding.";
    if (form.altPhone && !/^\d{10}$/.test(form.altPhone.trim())) return "Enter a valid alternate number.";
    return null;
  };

  const validateStep2 = (): string | null => {
    if (!form.currentAddress.trim()) return "Current Address is required.";
    if (!form.sameAsCurrent && !form.permanentAddress.trim()) return "Permanent Address is required.";
    if (!form.city.trim() || !form.state.trim()) return "City and State are required.";
    if (!/^\d{6}$/.test(form.pincode.trim())) return "Enter a valid 6-digit pincode.";
    if (!/^\d{12}$/.test(form.aadhaar.trim())) return "Enter a valid 12-digit Aadhaar number.";
    if (form.pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(form.pan.trim())) return "Enter a valid PAN number.";
    if (form.otherIdType.trim() && !form.otherIdNumber.trim()) return `Enter the ${form.otherIdType} number.`;
    return null;
  };

  const validateStep3 = (): string | null => {
    if (!form.joiningDate) return "Joining Date is required.";
    if (form.workingDays.length === 0) return "Select at least one working day.";
    if (!form.shiftStart || !form.shiftEnd) return "Shift start and end time are required.";

    // Password required only for new registration; optional (change) in edit mode
    if (!isEditMode) {
      if (form.password.length < 6) return "Password must be at least 6 characters.";
      if (form.password !== form.confirmPassword) return "Password and Confirm Password do not match.";
    } else if (form.password || form.confirmPassword) {
      if (form.password.length < 6) return "Password must be at least 6 characters.";
      if (form.password !== form.confirmPassword) return "Password and Confirm Password do not match.";
    }
    return null;
  };

  const goNext = () => {
    const err = step === 0 ? validateStep1() : step === 1 ? validateStep2() : null;
    if (err) {
      setFormError(err);
      return;
    }
    setFormError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setFormError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = useCallback(async () => {
    setFormError("");

    if (!vendor) {
      setFormError("Vendor session not found. Please log in again.");
      return;
    }

    // ✅ Final submit se pehle teeno steps ek baar aur check — direct URL/back-forward se bypass na ho paaye
    const err = validateStep1() || validateStep2() || validateStep3();
    if (err) {
      setFormError(err);
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("vendor_id", String(vendor.id));
      payload.append("name", form.name.trim());
      payload.append("email", form.email.trim());
      payload.append("gender", form.gender);
      payload.append("dob", form.dob);
      payload.append("phone", form.phone.trim());
      payload.append("alt_phone", form.altPhone.trim());
      payload.append("phone_verified", "1");
      payload.append("current_address", form.currentAddress.trim());
      payload.append("permanent_address", form.permanentAddress.trim());
      payload.append("city", form.city.trim());
      payload.append("state", form.state.trim());
      payload.append("pincode", form.pincode.trim());
      payload.append("aadhaar", form.aadhaar.trim());
      payload.append("pan", form.pan.trim());
      payload.append("other_id_type", form.otherIdType.trim());
      payload.append("other_id_number", form.otherIdNumber.trim());
      payload.append("joining_date", form.joiningDate);
      payload.append("working_days", JSON.stringify(form.workingDays));
      payload.append("shift_start", form.shiftStart);
      payload.append("shift_end", form.shiftEnd);
      payload.append("availability_status", form.availabilityStatus);
      payload.append("bank_account_holder", form.bankAccountHolder.trim());
      payload.append("bank_account_number", form.bankAccountNumber.trim());
      payload.append("bank_ifsc", form.bankIFSC.trim());
      payload.append("upi_id", form.upiId.trim());
      payload.append("status", form.status);
      if (photoFile) payload.append("photo", photoFile);

      if (isEditMode) {
        // Password optional on edit — only send if the user actually typed a new one
        if (form.password) payload.append("password", form.password);

        // ✅ FIXED: backend route is POST /vendor/packers/update/{id}
        // (pehle yahan apiPut(`/vendor/packers/${id}`) call ho raha tha,
        // jo kisi bhi defined route se match nahi karta tha — isliye edit
        // save karte waqt 404 aa raha tha)
        const res = await apiPost(`/vendor/packers/update/${id}`, payload);
        alert(res.message || "Packer updated successfully!");
      } else {
        payload.append("password", form.password);

        const res = await apiPost("/vendor/packers/register", payload);
        alert(res.message || "Packer registered successfully!");
      }

      setForm(EMPTY_FORM);
      setPhotoFile(null);
      setPhotoPreview("");
      setOtp("");
      setOtpSent(false);
      setOtpVerified(false);
      setStep(0);
      history.replace("/packers");
    } catch (err2) {
      setFormError(err2 instanceof Error ? err2.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }, [vendor, form, photoFile, otpVerified, history, isEditMode, id]);

  const pageTitle = isEditMode ? "Edit Packer" : "Add Packer";

  if (isEditMode && loadingPacker) {
    return (
      <Layout title={pageTitle} activeNav="Packers">
        <style>{responsiveStyles}</style>
        <div style={{ background: "#fff", padding: 24, borderRadius: 10 }}>
          <div className="page-loading-box">Loading packer details…</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={pageTitle} activeNav="Packers">
      <style>{responsiveStyles}</style>
      <button className="pp-back-btn" onClick={() => history.replace("/packers")} aria-label="Go back">
        ← Back
      </button>
      <h2 style={{ marginBottom: 20 }}>{pageTitle}</h2>

      <div style={{ background: "#fff", padding: 24, borderRadius: 10 }}>
        {vendor && (
          <p style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>
            {isEditMode ? "Editing packer under vendor: " : "Registering under vendor: "}
            <strong>{vendor.name}</strong>
          </p>
        )}

        <Stepper current={step} />

        {formError && <div className="field-error-banner">{formError}</div>}

        {/* ═══════════════ STEP 1 — Basic & Contact ═══════════════ */}
        {step === 0 && (
          <>
            <p className="form-section-title">Basic Information</p>
            <div className="form-grid-3">
              <Field label="Full Name" required>
                <input className="field-input" name="name" value={form.name}
                  onChange={handleChange} placeholder="e.g. Ramesh Kumar" />
              </Field>
              <Field label="Date of Birth" required>
                <input className="field-input" name="dob" type="date" value={form.dob}
                  onChange={handleChange} />
              </Field>
              <Field label="Email" required>
                <input className="field-input" name="email" value={form.email}
                  onChange={handleChange} placeholder="e.g. ramesh@example.com" />
              </Field>
            </div>

            <div className="form-grid-2">
              <Field label="Gender">
                <div className="radio-row">
                  {["Male", "Female", "Other"].map((g) => (
                    <label className="radio-option" key={g}>
                      <input type="radio" name="gender" value={g}
                        checked={form.gender === g} onChange={handleChange} />
                      {g}
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Live Photo  " required={!isEditMode}>
                <div className="photo-upload-wrapper">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Packer" className="photo-preview" />
                  ) : (
                    <div className="photo-placeholder">No Photo</div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*"
                    style={{ display: "none" }} onChange={handlePhotoSelect} />
                  <button type="button" className="photo-upload-btn"
                    onClick={() => fileInputRef.current?.click()}>
                    {photoFile || photoPreview ? "Change Photo" : "Upload Photo"}
                  </button>
                </div>
              </Field>
            </div>

            <p className="form-section-title">Contact Details</p>
            <div className="form-grid-2">
              <Field label="Mobile Number" required>
                <div className="otp-input-wrapper">
                  <input className="field-input" name="phone" value={form.phone}
                    onChange={handleChange} placeholder="10-digit number" type="tel"
                    inputMode="numeric" maxLength={10} disabled={otpVerified && !isEditMode} />
                  {!isEditMode && !otpVerified && (
                    <button type="button" className="otp-action-btn"
                      disabled={otpSending || !/^\d{10}$/.test(form.phone.trim())}
                      onClick={handleSendOtp}>
                      {otpSending ? "Sending…" : otpSent ? "Resend OTP" : "Send OTP"}
                    </button>
                  )}
                  {otpVerified && <span className="otp-verified-badge">✓ Verified</span>}
                </div>

                {!isEditMode && otpSent && !otpVerified && (
                  <div className="otp-input-wrapper" style={{ marginTop: 8 }}>
                    <input className="field-input" placeholder="Enter OTP" value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric" maxLength={6} />
                    <button type="button" className="otp-action-btn" onClick={handleVerifyOtp}
                      disabled={otpVerifying}>
                      {otpVerifying ? "Verifying…" : "Verify"}
                    </button>
                  </div>
                )}
              </Field>

              <Field label="Alternate Number (optional)">
                <input className="field-input" name="altPhone" value={form.altPhone}
                  onChange={handleChange} placeholder="10-digit number" type="tel"
                  inputMode="numeric" maxLength={10} />
              </Field>
            </div>
          </>
        )}

        {/* ═══════════════ STEP 2 — Address & ID Proof ═══════════════ */}
        {step === 1 && (
          <>
            <p className="form-section-title">Address</p>
            <div className="form-grid-1">
              <Field label="Current Address" required>
                <textarea className="field-input" name="currentAddress" value={form.currentAddress}
                  onChange={handleChange} placeholder="House no, street, landmark" rows={2} />
              </Field>
            </div>

            <label className="checkbox-row">
              <input type="checkbox" name="sameAsCurrent" checked={form.sameAsCurrent}
                onChange={handleChange} />
              Permanent address same as current address
            </label>

            {!form.sameAsCurrent && (
              <div className="form-grid-1">
                <Field label="Permanent Address" required>
                  <textarea className="field-input" name="permanentAddress" value={form.permanentAddress}
                    onChange={handleChange} placeholder="House no, street, landmark" rows={2} />
                </Field>
              </div>
            )}

            <div className="form-grid-3">
              <Field label="City" required>
                <input className="field-input" name="city" value={form.city}
                  onChange={handleChange} placeholder="e.g. Lucknow" />
              </Field>
              <Field label="State" required>
                <input className="field-input" name="state" value={form.state}
                  onChange={handleChange} placeholder="e.g. Uttar Pradesh" />
              </Field>
              <Field label="Pincode" required>
                <input className="field-input" name="pincode" value={form.pincode}
                  onChange={handleChange} placeholder="6-digit pincode" inputMode="numeric" />
              </Field>
            </div>

            <p className="form-section-title">ID Proofs</p>
            <div className="form-grid-3">
              <Field label="Aadhaar Card" required>
                <input className="field-input" name="aadhaar" value={form.aadhaar}
                  onChange={handleChange} placeholder="12-digit Aadhaar number" inputMode="numeric" />
              </Field>
              <Field label="PAN Card (optional)" hint="Useful for payments">
                <input className="field-input" name="pan" value={form.pan}
                  onChange={handleChange} placeholder="ABCDE1234F" maxLength={10} />
              </Field>
              <Field label="Any Other ID (optional)">
                <input className="field-input" name="otherIdType" value={form.otherIdType}
                  onChange={handleChange} placeholder="ID type e.g. Voter ID" />
              </Field>
            </div>
            {form.otherIdType.trim() && (
              <div className="form-grid-1">
                <Field label={`${form.otherIdType} Number`} required>
                  <input className="field-input" name="otherIdNumber" value={form.otherIdNumber}
                    onChange={handleChange} placeholder="ID number" />
                </Field>
              </div>
            )}
          </>
        )}

        {/* ═══════════════ STEP 3 — Employment, Bank & Security ═══════════════ */}
        {step === 2 && (
          <>
            <p className="form-section-title">Employment Details</p>
            <div className="form-grid-3">
              <Field label="Joining Date" required>
                <input className="field-input" name="joiningDate" type="date" value={form.joiningDate}
                  onChange={handleChange} />
              </Field>
              <Field label="Shift Start Time" required>
                <input className="field-input" name="shiftStart" type="time" value={form.shiftStart}
                  onChange={handleChange} />
              </Field>
              <Field label="Shift End Time" required>
                <input className="field-input" name="shiftEnd" type="time" value={form.shiftEnd}
                  onChange={handleChange} />
              </Field>
            </div>

            <div className="form-grid-1">
              <Field label="Working Days" required>
                <div className="day-selector">
                  {WEEK_DAYS.map((day) => (
                    <div key={day} className={`day-chip ${form.workingDays.includes(day) ? "active" : ""}`}
                      onClick={() => toggleWorkingDay(day)}>
                      {day}
                    </div>
                  ))}
                </div>
              </Field>
            </div>

            <div className="form-grid-2">
              <Field label="Availability Status">
                <select className="field-input" name="availabilityStatus" value={form.availabilityStatus}
                  onChange={handleChange}>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </Field>
              <Field label="Account Status">
                <select className="field-input" name="status" value={form.status}
                  onChange={handleChange}>
                  <option value="Active">Active</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </Field>
            </div>

            <p className="form-section-title">Bank Details (Optional)</p>
            <div className="form-grid-3">
              <Field label="Account Holder Name">
                <input className="field-input" name="bankAccountHolder" value={form.bankAccountHolder}
                  onChange={handleChange} placeholder="As per bank records" />
              </Field>
              <Field label="Account Number">
                <input className="field-input" name="bankAccountNumber" value={form.bankAccountNumber}
                  onChange={handleChange} placeholder="Bank account number" />
              </Field>
              <Field label="IFSC Code">
                <input className="field-input" name="bankIFSC" value={form.bankIFSC}
                  onChange={(e) => setForm((p) => ({ ...p, bankIFSC: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SBIN0001234" maxLength={11} />
              </Field>
            </div>
            <div className="form-grid-1">
              <Field label="UPI ID" hint="For easy payments">
                <input className="field-input" name="upiId" value={form.upiId}
                  onChange={handleChange} placeholder="e.g. ramesh@ybl" />
              </Field>
            </div>

            <p className="form-section-title">Account Security</p>
            <div className="form-grid-2">
              <Field label="Password / PIN" required={!isEditMode} hint={isEditMode ? "Leave blank to keep current password" : undefined}>
                <div className="password-input-wrapper">
                  <input className="field-input" name="password" value={form.password}
                    onChange={handleChange}
                    placeholder={isEditMode ? "Leave blank to keep unchanged" : "Minimum 6 characters"}
                    type={showPassword ? "text" : "password"} />
                  <button type="button" className="password-toggle-btn"
                    onClick={() => setShowPassword((s) => !s)} tabIndex={-1}>
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </Field>

              <Field label="Confirm Password / PIN" required={!isEditMode}>
                <div className="password-input-wrapper">
                  <input className="field-input" name="confirmPassword" value={form.confirmPassword}
                    onChange={handleChange} placeholder="Re-enter password"
                    type={showConfirm ? "text" : "password"} />
                  <button type="button" className="password-toggle-btn"
                    onClick={() => setShowConfirm((s) => !s)} tabIndex={-1}>
                    {showConfirm ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </Field>
            </div>
          </>
        )}

        {/* ── Wizard Actions ── */}
        <div className="wizard-actions">
          <div>
            {step > 0 && (
              <button onClick={goBack} disabled={saving}
                style={{
                  padding: "10px 20px", background: "#fff", color: "#555",
                  border: "1px solid #E0E0DA", borderRadius: 6, fontWeight: 500,
                  fontSize: 15, cursor: "pointer",
                }}>
                ← Back
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => history.replace("/packers")}
              disabled={saving}
              style={{
                padding: "10px 20px", background: "#fff", color: "#555",
                border: "1px solid #E0E0DA", borderRadius: 6, fontWeight: 500,
                fontSize: 15, cursor: "pointer",
              }}>
              Cancel
            </button>

            {step < STEPS.length - 1 ? (
              <button onClick={goNext}
                style={{
                  padding: "10px 28px", background: "#00B894", color: "#fff",
                  border: "none", borderRadius: 6, fontWeight: 600, fontSize: 15,
                  cursor: "pointer",
                }}>
                Save & Next →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={saving}
                style={{
                  padding: "10px 28px", background: saving ? "#ccc" : "#00B894",
                  color: "#fff", border: "none", borderRadius: 6, fontWeight: 600,
                  fontSize: 15, cursor: saving ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}>
                {saving
                  ? isEditMode ? "Updating…" : "Submitting…"
                  : isEditMode ? "Update Packer" : "Submit & Register"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PackerRegister;