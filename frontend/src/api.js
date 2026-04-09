const BASE_URL = 'http://localhost:5000';

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
