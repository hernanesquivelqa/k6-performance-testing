import http from 'k6/http';
import { sleep } from 'k6';
import { BASE_URL, getProtectedParams } from '../utils/constants.js';
import { loginAndGetToken } from '../utils/utils.js';
import { validateProtectedResponse } from '../utils/checks.js';

export const options = {
  stages: [
    { duration: '10s', target: 10 },

  ],
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.10', abortOnFail: true, delayAbortEval: '5s' }],
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.95'],
  },
};

const USER = __ENV.USER 
const PASSWORD = __ENV.PASSWORD 

export default function () {
  const token = loginAndGetToken(USER, PASSWORD);
  const protectedRes = http.get(`${BASE_URL}/users/2`, getProtectedParams(token));

  const valid = validateProtectedResponse(protectedRes);
  if (!valid) {
    console.error('❌ Datos protegidos no válidos:', protectedRes.body);
  }

  sleep(1);
}
