import React, { useState } from 'react';
import './Login.css';
import { useIonRouter } from '@ionic/react';
import { apiPost } from '../api';
import OtpVerify from './OtpVerify';

const Login: React.FC = () => {
  const router = useIonRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP step state
  const [otpStep, setOtpStep] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'dev-' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!login || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      // ✅ FIXED: fcm_token/fcm_platform yahan bhejne ka koi fayda nahi tha —
      // ye pre-OTP step hai (auth:sanctum ke bahar), user abhi authenticated
      // nahi hota. FCM token save ab OTP verify success ke baad hota hai
      // (OtpVerify.tsx me), jahan authenticated route /save-fcm-token use
      // hota hai. Wahi asli fix hai.
      const data = await apiPost('/vendor/login', {
        login: login,
        password: password,
        device_id: getDeviceId(),
      });

      setOtpPhone(data.phone || login);
      setOtpStep(true);

    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (otpStep) {
    return (
      <OtpVerify
        phone={otpPhone}
        onBack={() => { setOtpStep(false); setError(''); }}
        roleId={3}
      />
    );
  }

  return (
    <div className="login-root">

      <div className="login-brand">
        <div className="login-logo">
          <img src="/shrilogo.jpeg" alt="Shree logo" />
        </div>
        <p className="login-title">Shri Bazar</p>
        <p className="login-subtitle">Sign in to your account</p>
      </div>

      <div className="login-card">
        <form className="login-form" onSubmit={handleSubmit} noValidate>

          <div className="form-group">
            <label htmlFor="login" className="form-label">
              Email or Mobile
            </label>
            <div className="input-wrapper">
              <input
                id="login"
                type="text"
                className="form-input"
                placeholder="Enter email or mobile"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="field-footer">
              <button type="button" className="forgot-link">Forgot password?</button>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading && <span className="btn-spinner" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

        </form>
      </div>

    </div>
  );
};

export default Login;