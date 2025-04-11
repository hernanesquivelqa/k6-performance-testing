export const BASE_URL = 'https://reqres.in/api';

export const HEADERS = {
  headers: {
    'Content-Type': 'application/json',
  },
};

export function getProtectedParams(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}