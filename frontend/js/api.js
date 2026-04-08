const BASE_URL = 'http://localhost:5000';

async function handleResponse(response, isProtectedRequest = false) {
  if (response.status === 401 && isProtectedRequest) {
    logout();
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

async function apiGet(path) {
  try {
    const headers = {};
    const isProtectedRequest = !!getToken();

    if (isProtectedRequest) {
      headers.Authorization = 'Bearer ' + getToken();
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      headers,
    });
    return await handleResponse(response, isProtectedRequest);
  } catch (error) {
    throw error;
  }
}

async function apiPost(path, body) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    return await handleResponse(response, true);
  } catch (error) {
    throw error;
  }
}

async function apiPut(path, body) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    return await handleResponse(response, true);
  } catch (error) {
    throw error;
  }
}

async function apiDelete(path) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, true);
  } catch (error) {
    throw error;
  }
}
