import {
  IonPage, IonContent, IonInput, IonButton,
  IonHeader, IonToolbar, IonTitle
} from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
const Register: React.FC = () => {
  const [name, setname] = useState('');
  const [email, setEmail]           = useState('');
  const [mobile, setMobile]         = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [agreed, setAgreed]         = useState(false);
  const history = useHistory();
  const [loading, setLoading] = useState(false);

  const strengthLevel = password.length === 0 ? 0
    : password.length < 5 ? 1
    : password.length < 8 ? 2
    : password.length < 12 ? 3 : 4;

  const strengthLabel = ['', 'Weak', 'Fair', 'Strong', 'Very Strong'][strengthLevel];
  const strengthColor = ['', '#ef4444', '#f97316', '#84cc16', '#22c55e'][strengthLevel];

//   const handleRegister = () => {
//     console.log("Vendor Name:", name, "Email:", email, "Mobile:", mobile, "Password:", password);
//     // TODO: API call
//     alert("Registered Successfully");
//     history.push('/login');
//   };
const handleRegister = async () => {
  try {
    if (!name || !email || !mobile || !password || !confirm) {
      alert("All fields are required");
      return;
    }

    if (mobile.length !== 10) {
      alert("Enter valid 10-digit mobile number");
      return;
    }

    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    if (!agreed) {
      alert("Please accept Terms & Conditions");
      return;
    }

    setLoading(true);

    const response = await axios.post(
      "http://localhost:5000/api/vendor/register",
      {
        name: name,
        email: email,
        phone: mobile,
        password: password
      }
    );

    console.log("Register Response:", response.data);

    // ✅ FIXED CONDITION
    if (response.data.msg === "Vendor registered successfully") {
      alert("Registered Successfully ✅");
      history.push('/login');
    } else {
      alert(response.data.msg || "Registration failed");
    }

  } catch (error: any) {
    console.error("Register Error:", error);

    if (error.response) {
      alert(error.response.data.msg || "Server error");
    } else {
      alert("Network error");
    }

  } finally {
    setLoading(false);
  }
};
  return (
    <IonPage>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

        .shree-reg-page { font-family: 'Poppins', sans-serif; }
        .shree-reg-page ion-content { --background: #f5efe6; }

        /* Dotted bg */
        .reg-bg {
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(200,140,60,0.13) 1.5px, transparent 1.5px);
          background-size: 22px 22px;
          pointer-events: none; z-index: 0;
        }

        /* Top glow */
        .reg-glow {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 20%, rgba(245,166,35,0.16) 0%, transparent 58%);
          pointer-events: none; z-index: 0;
        }

        /* Wrapper */
        .reg-wrapper {
          position: relative; z-index: 2;
          min-height: 100%;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px 20px 56px;
        }

        /* Back */
        .reg-back {
          position: absolute; top: 20px; left: 20px;
          width: 40px; height: 40px; border-radius: 50%;
          border: 1.5px solid rgba(180,120,40,0.22);
          background: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          font-size: 16px; color: #5a3e1b; z-index: 10;
        }

        /* Logo */
        .reg-logo-wrap {
          display: flex; flex-direction: column; align-items: center;
          margin-bottom: 24px;
          animation: fadeDown 0.5s ease both;
        }
        .reg-logo-box {
          width: 72px; height: 72px; border-radius: 20px;
          background: linear-gradient(145deg, #f9b332, #e07310);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(224,115,16,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
          font-size: 36px; margin-bottom: 12px;
        }
        .reg-brand-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: white; border: 1px solid rgba(224,115,16,0.25);
          border-radius: 100px; padding: 4px 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .reg-brand-badge .badge-dot {
          width: 7px; height: 7px; background: #e07310; border-radius: 50%;
        }
        .reg-brand-badge span {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.16em; color: #c06010;
        }

        /* Card */
        .reg-card {
          width: 100%; max-width: 400px;
          background: #ffffff; border-radius: 28px;
          padding: 28px 26px 24px;
          box-shadow: 0 20px 56px rgba(160,100,20,0.13), 0 4px 14px rgba(0,0,0,0.06);
          animation: fadeUp 0.6s ease 0.1s both;
        }

        .reg-section-label {
          text-align: center; font-size: 12px; font-weight: 600;
          letter-spacing: 0.15em; color: #bbb; margin-bottom: 22px;
          display: flex; align-items: center; gap: 10px;
        }
        .reg-section-label::before, .reg-section-label::after {
          content: ''; flex: 1; height: 1px; background: #efefef;
        }

        /* Fields */
        .reg-field-group { margin-bottom: 16px; }
        .reg-field-label {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #aaa; margin-bottom: 7px; padding-left: 2px;
        }
        .reg-field-wrap {
          display: flex; align-items: center;
          background: #fdf8f1; border: 1.5px solid #eddfc6;
          border-radius: 14px; padding: 0 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .reg-field-wrap:focus-within {
          border-color: #e07310;
          box-shadow: 0 0 0 3px rgba(224,115,16,0.1);
        }
        .reg-field-icon { font-size: 15px; margin-right: 8px; opacity: 0.4; flex-shrink: 0; }
        .reg-field-wrap ion-input {
          --color: #3a2a10; --placeholder-color: #cdb899;
          --background: transparent;
          --padding-top: 13px; --padding-bottom: 13px; --padding-start: 0;
          font-size: 14px; font-family: 'Poppins', sans-serif;
        }
        .reg-eye-btn {
          background: none; border: none; cursor: pointer;
          font-size: 15px; opacity: 0.4; padding: 0; margin-left: 6px; flex-shrink: 0;
        }

        /* Two-column row */
        .reg-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
          margin-bottom: 16px;
        }
        .reg-row .reg-field-group { margin-bottom: 0; }

        /* Strength */
        .strength-bar { display: flex; gap: 4px; margin-top: 8px; }
        .strength-seg {
          flex: 1; height: 3px; border-radius: 4px;
          background: #eee; transition: background 0.3s;
        }
        .strength-text { font-size: 11px; margin-top: 4px; padding-left: 2px; }

        /* Terms */
        .reg-terms {
          display: flex; align-items: flex-start; gap: 10px;
          margin: 18px 0 20px; font-size: 12px; color: #aaa; line-height: 1.55;
        }
        .reg-checkbox {
          width: 18px; height: 18px; border-radius: 5px;
          border: 1.5px solid #ddd; background: #fdf8f1;
          flex-shrink: 0; margin-top: 1px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; transition: all 0.2s;
        }
        .reg-checkbox.checked { background: #e07310; border-color: #e07310; color: white; }
        .reg-terms a { color: #e07310; text-decoration: none; }

        /* CTA */
        .btn-shree-create {
          --background: linear-gradient(135deg, #f9b332 0%, #e07310 100%);
          --background-activated: #c96a0e;
          --border-radius: 14px; --color: #ffffff;
          --box-shadow: 0 8px 24px rgba(224,115,16,0.38);
          font-family: 'Poppins', sans-serif;
          font-weight: 600; font-size: 13px;
          letter-spacing: 0.12em; text-transform: uppercase;
          height: 52px;
        }
        .btn-shree-create:active { transform: scale(0.98); }

        /* Divider */
        .reg-divider {
          display: flex; align-items: center; gap: 10px;
          margin: 18px 0; font-size: 12px; color: #ddd;
        }
        .reg-divider::before, .reg-divider::after { content: ''; flex: 1; height: 1px; background: #eee; }

        /* Login link */
        .btn-shree-login-link {
          --color: #aaa; --background: transparent;
          --background-activated: rgba(0,0,0,0.03);
          --border-radius: 14px;
          font-size: 13px; font-family: 'Poppins', sans-serif; height: 44px;
        }
        .btn-shree-login-link strong { color: #e07310; font-weight: 600; margin-left: 4px; }

        /* Perks */
        .reg-perks {
          display: flex; justify-content: center; gap: 22px;
          margin-top: 26px;
          animation: fadeUp 0.7s ease 0.22s both;
        }
        .perk { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .perk-icon { font-size: 20px; }
        .perk-text { font-size: 10px; color: #c4aa80; letter-spacing: 0.03em; }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <IonHeader className="ion-no-border" style={{ display: 'none' }}>
        <IonToolbar><IonTitle>Vendor Register</IonTitle></IonToolbar>
      </IonHeader>

      <IonContent className="shree-reg-page">
        <div className="reg-bg" />
        <div className="reg-glow" />

        <div className="reg-wrapper">
          {/* Back */}
          <div className="reg-back" onClick={() => history.push('/login')}>←</div>

          {/* Logo */}
          <div className="reg-logo-wrap">
            <div className="reg-logo-box">🪴</div>
            <div className="reg-brand-badge">
              <div className="badge-dot" />
              <span>SHREE</span>
            </div>
          </div>

          {/* Card */}
          <div className="reg-card">
            <div className="reg-section-label">CREATE ACCOUNT</div>

               {/* Vendor Name */}
            <div className="reg-field-group">
              <div className="reg-field-label">Vendor Name</div>
              <div className="reg-field-wrap">
                <span className="reg-field-icon">🏢</span>
                <IonInput type="text" placeholder="Enter your vendor name"
                  value={name} onIonChange={(e) => setname(e.detail.value!)} />
              </div>
            </div>

           
             <div className="reg-row">
            {/* Email */}
            <div className="reg-field-group">
              <div className="reg-field-label">Email Address</div>
              <div className="reg-field-wrap">
                <span className="reg-field-icon">✉️</span>
                <IonInput type="email" placeholder="you@example.com"
                  value={email} onIonChange={(e) => setEmail(e.detail.value!)} />
              </div>
            </div>

            {/* Mobile */}
            <div className="reg-field-group">
              <div className="reg-field-label">Mobile Number</div>
              <div className="reg-field-wrap">
                <span className="reg-field-icon">📱</span>
                <IonInput type="tel" placeholder="+91 00000 00000"
                  value={mobile} onIonChange={(e) => setMobile(e.detail.value!)} />
              </div>
            </div>
            </div>

            {/* Password + Confirm */}
            <div className="reg-row">
              <div className="reg-field-group">
                <div className="reg-field-label">Password</div>
                <div className="reg-field-wrap">
                  <span className="reg-field-icon">🔒</span>
                  <IonInput type={showPass ? 'text' : 'password'} placeholder="Create"
                    value={password} onIonChange={(e) => setPassword(e.detail.value!)} />
                  <button className="reg-eye-btn" onClick={() => setShowPass(!showPass)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="reg-field-group">
                <div className="reg-field-label">Confirm</div>
                <div className="reg-field-wrap">
                  <span className="reg-field-icon">✅</span>
                  <IonInput type="password" placeholder="Repeat"
                    value={confirm} onIonChange={(e) => setConfirm(e.detail.value!)} />
                </div>
              </div>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <div className="strength-bar">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="strength-seg"
                      style={{ background: i <= strengthLevel ? strengthColor : '#eee' }} />
                  ))}
                </div>
                <div className="strength-text" style={{ color: strengthColor }}>{strengthLabel}</div>
              </div>
            )}

            {/* Terms */}
            <div className="reg-terms">
              <div className={`reg-checkbox ${agreed ? 'checked' : ''}`}
                onClick={() => setAgreed(!agreed)}>
                {agreed ? '✓' : ''}
              </div>
              <span>
                I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
              </span>
            </div>

            {/* CTA */}
              <IonButton expand="block"
              onClick={handleRegister}
              disabled={loading}
              className="btn-shree-create">

              {loading ? "Creating..." : "Create Account"}
            </IonButton>

            <div className="reg-divider">or</div>

            <IonButton fill="clear" expand="block"
              onClick={() => history.push('/login')} className="btn-shree-login-link">
              Already a vendor? <strong>Sign In</strong>
            </IonButton>
          </div>

      
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;