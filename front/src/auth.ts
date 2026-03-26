import axios from 'axios';

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8181';
const REALM = 'video-conf';
const CLIENT_ID = 'video-conf-client';
const TOKEN_URL = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

export const isAuthenticated = () => !!getToken();

export const loginRequest = async (username: string, password: string) => {
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('client_id', CLIENT_ID);
  params.append('username', username);
  params.append('password', password);

  const res = await axios.post(TOKEN_URL, params);
  return {
    accessToken: res.data.access_token as string,
    refreshToken: res.data.refresh_token as string,
  };
};

export const refreshTokens = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('client_id', CLIENT_ID);
  params.append('refresh_token', refreshToken);

  const res = await axios.post(TOKEN_URL, params);
  setTokens(res.data.access_token, res.data.refresh_token);
  return res.data.access_token;
};

export const registerRequest = (data: {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) => axios.post('/api/auth/register', data);
