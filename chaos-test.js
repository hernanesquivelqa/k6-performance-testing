import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Configuración base
export const options = {
  scenarios: {
    chaos_a: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
      env: { CHAOS: 'A' }, // Caos A: Fallos intermitentes
    },
    chaos_b: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
      startTime: '2m', // Corre después de A
      env: { CHAOS: 'B' }, // Caos B: Retrasos aleatorios
    },
  },
  thresholds: {
    'http_req_duration{chaos:A}': ['p(95)<500'],
    'http_req_duration{chaos:B}': ['p(95)<500'],
    'http_req_failed{chaos:A}': ['rate<0.40'], // Toleramos más errores en caos
    'http_req_failed{chaos:B}': ['rate<0.10'],
    'checks': ['rate>0.90'], // Relajo el umbral por el caos
  },
};

const USER = 'eve.holt@reqres.in';
const PASSWORD = 'cityslicka';

export default function () {
  const chaos = __ENV.CHAOS;

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
    tags: { chaos }, // Etiqueto para separar métricas
  };

  // Caos A: Fallos intermitentes (30% de probabilidad)
  if (chaos === 'A') {
    if (Math.random() < 0.3) {
      // Simulo fallo con un endpoint inválido
      http.get('https://reqres.in/api/invalid', protectedParams);
    } else {
      http.get('https://reqres.in/api/users/2', protectedParams);
    }
    sleep(1);
  }
  // Caos B: Retrasos aleatorios (0-2s)
  else if (chaos === 'B') {
    const delay = randomIntBetween(0, 2000); // 0 a 2s en ms
    sleep(delay / 1000); // Convierto a segundos
    http.get('https://reqres.in/api/users/2', protectedParams);
  }
}