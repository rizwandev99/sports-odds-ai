const BASE_URL = import.meta.env.VITE_API_URL || 'https://sports-odds-backend-dh9w.onrender.com';

function getToken() {
    return localStorage.getItem('token');
}

export async function apiGet(path) {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
}

export async function apiPost(path, body, requiresAuth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (requiresAuth) {
        headers['Authorization'] = `Bearer ${getToken()}`;
    }
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });
    return res.json();
}

export async function apiDelete(path) {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
}
