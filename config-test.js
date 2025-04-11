import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración base
export const options = {
  scenarios: {
    config_a: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
      env: { CONFIG: 'A' }, // Configuración A
    },
    config_b: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
      startTime: '2m', // Corre después de A
      env: { CONFIG: 'B' }, // Configuración B
    },
  },
  thresholds: {
    'http_req_duration{config:A}': ['p(95)<300'],
    'http_req_duration{config:B}': ['p(95)<300'],
    'http_req_failed': ['rate<0.01'],
    'checks': ['rate>0.99'],
  },
};

const USER = 'eve.holt@reqres.in';
const PASSWORD = 'cityslicka';

export default function () {
  const config = __ENV.CONFIG;

  const loginPayload = JSON.stringify({
    email: USER,
    password: PASSWORD,
  });

  const loginParams = { headers: { 'Content-Type': 'application/json' } };
  const loginRes = http.post('https://reqres.in/api/login', loginPayload, loginParams);

  check(loginRes, {
    'login status es 200': (r) => r.status === 200,
  });

  const token = loginRes.json('token') || 'no-token';

  const protectedParams = {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    tags: { config }, // Etiqueto para separar métricas
  };

  // Configuración A: Más solicitudes por VU
  if (config === 'A') {
    http.get('https://reqres.in/api/users/2', protectedParams);
    http.get('https://reqres.in/api/users/3', protectedParams); // Doble solicitud
    sleep(1);
  }
  // Configuración B: Pausas cortas
  else if (config === 'B') {
    http.get('https://reqres.in/api/users/2', protectedParams);
    sleep(0.5); // Menos espera
  }
}