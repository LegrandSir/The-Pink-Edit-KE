// frontend/src/lib/api.js
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://the-pink-edit-ke.onrender.com';

export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=900&auto=format&fit=crop';

export const formatKsh = (amount) => {
  const num = Number(amount || 0);
  return `Ksh ${num.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
};

export async function apiFetch(path, options = {}) {
  const { auth = null, headers = {}, ...rest } = options;
  const finalHeaders = { ...headers };

  if (rest.body && typeof rest.body === 'string' && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  if (auth === 'admin') {
    const token = localStorage.getItem('adminToken');
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  } else if (auth === 'customer') {
    const token = localStorage.getItem('userToken');
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}