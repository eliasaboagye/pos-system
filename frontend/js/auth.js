function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
}

function isLoggedIn() {
  return !!getToken();
}

function redirectIfNotLoggedIn() {
  if (!isLoggedIn()) {
    window.location.href = './index.html';
  }
}

function getAuthHeaders() {
  return {
    Authorization: 'Bearer ' + getToken(),
    'Content-Type': 'application/json',
  };
}

function logout() {
  clearToken();
  window.location.href = './index.html';
}
