// src/api.ts
const BASE = 'https://shriecom.in/appapis/shreefood/public/api';

export const getToken = () => localStorage.getItem('auth_token') || '';
export const getUser  = () => {
  const u = localStorage.getItem('auth_user');
  return u ? JSON.parse(u) : null;
};

// ✅ FormData ke liye Content-Type set NAHI karna — browser khud boundary
// ke saath multipart/form-data set karega. Hardcode karne se request
// body empty chala jaata hai (isiliye "field required" errors aa rahe the).
const authHeaders = (isFormData = false) => ({
  'Authorization': `Bearer ${getToken()}`,
  'Accept': 'application/json',
  ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
});

// ✅ NEW: Session expire/invalid hone par ek hi jagah se handle karo.
// Token clear karo aur login page par bhej do — taaki confusing
// 404/redirect chain ke bajaye user ko clean "session expired" milے.
let sessionExpiredHandled = false;

const handleSessionExpired = () => {
  if (sessionExpiredHandled) return; // ek hi baar trigger ho, multiple parallel calls fail hone par bhi
  sessionExpiredHandled = true;

  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');

  // Thoda delay taaki current toast/error message dikh jaaye, phir redirect
  setTimeout(() => {
    window.location.href = '/login';
  }, 800);
};

// ✅ Response check helper — 401 (unauthenticated) ya 419 (session/csrf expired)
// dono ko session-expired treat karo
const isSessionExpiredStatus = (status: number) => status === 401 || status === 419;

// ✅ Kabhi kabhi backend galat config ki wajah se JSON ke bajaye HTML
// (login page redirect) bhej deta hai. Us case mein res.json() crash
// karega — isliye pehle content-type check karke safely handle karo.
const safeParseJson = async (res: Response) => {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // Backend ne HTML/redirect page bhej diya (auth issue ka sign)
    return null;
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
};

export const apiGet = async (endpoint: string) => {
  const res = await fetch(`${BASE}${endpoint}`, { headers: authHeaders() });

  if (isSessionExpiredStatus(res.status)) {
    handleSessionExpired();
    throw new Error('Your session has expired. Please login again.');
  }

  if (!res.ok) {
    const data = await safeParseJson(res);
    throw new Error(data?.message || `HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await safeParseJson(res);
  if (data === null) {
    throw new Error('Unexpected response from server. Please login again.');
  }
  return data;
};

export const apiPost = async (endpoint: string, body: object | FormData) => {
  const isFormData = body instanceof FormData;

  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: authHeaders(isFormData),
    // ✅ FormData ko stringify mat karo — waise hi bhejo,
    // JSON.stringify(FormData) hamesha "{}" deta hai
    body: isFormData ? body : JSON.stringify(body),
  });

  if (isSessionExpiredStatus(res.status)) {
    handleSessionExpired();
    throw new Error('Your session has expired. Please login again.');
  }

  const data = await safeParseJson(res);

  if (!res.ok) {
    // ✅ Server ka actual message error mein daal do
    const message =
      data?.errors?.[Object.keys(data?.errors || {})[0]]?.[0] || // validation errors
      data?.message ||                                             // general message
      `HTTP ${res.status}: ${res.statusText}`;                    // fallback
    throw new Error(message);
  }

  if (data === null) {
    // res.ok true hai lekin JSON parse nahi hua — server ne redirect/HTML bheja
    throw new Error('Unexpected response from server. Please login again.');
  }

  return data;
};

export const apiPut = async (endpoint: string, body: object | FormData) => {
  const isFormData = body instanceof FormData;

  // Laravel ke liye: multipart PUT request natively parse nahi hoti,
  // isliye FormData ke case mein POST + _method=PUT override use karo.
  if (isFormData) {
    (body as FormData).append('_method', 'PUT');
    const res = await fetch(`${BASE}${endpoint}`, {
      method: 'POST',
      headers: authHeaders(true),
      body,
    });

    if (isSessionExpiredStatus(res.status)) {
      handleSessionExpired();
      throw new Error('Your session has expired. Please login again.');
    }

    const data = await safeParseJson(res);

    if (!res.ok) {
      const message =
        data?.errors?.[Object.keys(data?.errors || {})[0]]?.[0] ||
        data?.message ||
        `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(message);
    }

    if (data === null) {
      throw new Error('Unexpected response from server. Please login again.');
    }

    return data;
  }

  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (isSessionExpiredStatus(res.status)) {
    handleSessionExpired();
    throw new Error('Your session has expired. Please login again.');
  }

  if (!res.ok) {
    const data = await safeParseJson(res);
    throw new Error(data?.message || `HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await safeParseJson(res);
  if (data === null) {
    throw new Error('Unexpected response from server. Please login again.');
  }
  return data;
};

export const apiDelete = async (endpoint: string) => {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (isSessionExpiredStatus(res.status)) {
    handleSessionExpired();
    throw new Error('Your session has expired. Please login again.');
  }

  if (!res.ok) {
    const data = await safeParseJson(res);
    throw new Error(data?.message || `HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await safeParseJson(res);
  if (data === null) {
    throw new Error('Unexpected response from server. Please login again.');
  }
  return data;
};