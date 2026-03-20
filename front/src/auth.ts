import axios from 'axios';

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

export const loginRequest = (username: string, password: string) =>
  axios.post<{ accessToken: string; refreshToken: string; expiresIn: number }>(
    '/api/auth/login',
    { username, password },
  );

export const registerRequest = (data: {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) => axios.post('/api/auth/register', data);

export const refreshTokens = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');
  const res = await axios.post<{ accessToken: string; refreshToken: string; expiresIn: number }>(
    '/api/auth/refresh',
    { refreshToken },
  );
  setTokens(res.data.accessToken, res.data.refreshToken);
  return res.data.accessToken;
};
