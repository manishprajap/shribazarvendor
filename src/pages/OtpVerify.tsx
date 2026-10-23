import React, { useState, useRef, useEffect } from 'react';
import { useIonRouter } from '@ionic/react';
import { apiPost } from '../api';
import './OtpVerify.css';

interface OtpVerifyProps {
  phone: string;
  roleId: number;  // ✅ 2=customer, 3=vendor, 4=delivery
  onBack: () => void; 
}

const OTP_LENGTH = 6;

const OtpVerify: React.FC<OtpVerifyProps> = ({ phone, roleId, onBack }) => {
  const router = useIonRouter();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (paste.length > 0) {
      const newOtp = Array(OTP_LENGTH).fill('');
      paste.split('').forEach((ch, i) => { newOtp[i] = ch; });
      setOtp(newOtp);
      inputRefs.current[Math.min(paste.length, OTP_LENGTH - 1)]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiPost('/verify-otp', {  // ✅ Fixed: /vendor/verify-otp → /verify-otp
        phone,
        otp: code,
        role_id: roleId,  // ✅ role_id add kiya
      });

      if (data.token) localStorage.setItem('auth_token', data.token);
      if (data.user)  localStorage.setItem('auth_user', JSON.stringify(data.user));

      router.push('/home', 'root', 'replace');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    try {
      await apiPost('/resend-otp', {  // ✅ Fixed: /vendor/resend-otp → /resend-otp
        phone,
        role_id: roleId,  // ✅ role_id add kiya
      });
      setResendTimer(30);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  const maskedPhone = phone.replace(/(\d{2})\d{6}(\d{2})/, '$1xxxxxx$2');

  return (
    <div className="otp-root">
      <button className="otp-back-btn" onClick={onBack} aria-label="Go back">
        ← Back
      </button>

      <div className="otp-icon">📱</div>
      <h2 className="otp-heading">Verify OTP</h2>
      <p className="otp-subtext">
        OTP sent to <strong>+91 {maskedPhone}</strong>
      </p>

      <div className="otp-boxes" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className={`otp-input ${digit ? 'otp-input--filled' : ''} ${error ? 'otp-input--error' : ''}`}
            aria-label={`OTP digit ${i + 1}`}
          />
        ))}
      </div>

      {error && <p className="otp-error">{error}</p>}

      <button
        className="otp-verify-btn"
        onClick={handleVerify}
        disabled={loading}
      >
        {loading ? <span className="btn-spinner" /> : null}
        {loading ? 'Verifying…' : 'Verify & Login'}
      </button>

      <div className="otp-resend">
        {resendTimer > 0 ? (
          <p>Resend OTP in <span className="otp-timer">{resendTimer}s</span></p>
        ) : (
          <button
            className="otp-resend-btn"
            onClick={handleResend}
            disabled={resendLoading}
          >
            {resendLoading ? 'Sending…' : 'Resend OTP'}
          </button>
        )}
      </div>
    </div>
  );
};

export default OtpVerify;