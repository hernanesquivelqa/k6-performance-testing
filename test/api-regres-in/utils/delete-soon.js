import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, HEADERS, getProtectedParams } from '../utils/constants.js';
import { getLoginPayload } from '../utils/utils.js';

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 150 },
    { duration: '1m', target: 200 },
    { duration: '1m', target: 250 },

  ],
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.10', abortOnFail: true, delayAbortEval: '5s' }],
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.95'],
  },
};

export default function () {
  const USER = 'eve.holt@reqres.in';
  const PASSWORD = 'cityslicka';

  const loginPayload = getLoginPayload(USER, PASSWORD);
  const loginRes = http.post(`${BASE_URL}/login`, loginPayload, HEADERS);

  check(loginRes, {
    'login status es 200': (r) => r.status === 200,
    'token recibido': (r) => r.json('token') !== undefined,
  });

  const token = loginRes.json('token') || 'no-token';
  const protectedRes = http.get(`${BASE_URL}/users/2`, getProtectedParams(token));

  check(protectedRes, {
    'protected status es 200': (r) => r.status === 200,
    'datos recibidos': (r) => r.json('data.id') === 2,
  });

  sleep(1);
}
