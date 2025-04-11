export function getLoginPayload(user, password) {
  return JSON.stringify({
    email: user,
    password: password,
  });
}

import http from 'k6/http';
import { BASE_URL, HEADERS } from './constants.js';
import { validateLoginResponse } from './checks.js';

export function loginAndGetToken(user, password) {
  const payload = getLoginPayload(user, password);
  const res = http.post(`${BASE_URL}/login`, payload, HEADERS);
  const valid = validateLoginResponse(res);
  if (!valid) {
    console.error('❌ Login fallido:', res.body);
  }
  return res.json('token') || 'no-token';
}