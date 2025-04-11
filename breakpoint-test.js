import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración para break point test
export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Inicio suave
    { duration: '1m', target: 100 }, // Subo a 100
    { duration: '1m', target: 150 }, // Pruebo 150
    { duration: '1m', target: 200 }, // Empujo más
    { duration: '1m', target: 250 }, // Busco el quiebre
  ],
  thresholds: {
    'http_req_failed': [
      {
        threshold: 'rate<0.10', // <10% errores para aprobar
        abortOnFail: true,      // Aborto si >10% errores
        delayAbortEval: '5s',   // Espero 5s antes de abortar
      },
    ],
    'http_req_duration': ['p(95)<500'], // Fallo si >500ms 
    'checks': ['rate>0.95'],            // Fallo si <95% checks pasan
  },

};

// Credenciales
const USER = 'eve.holt@reqres.in';
const PASSWORD = 'cityslicka';

export default function () {
  const loginPayload = JSON.stringify({
    email: USER,
    password: PASSWORD,
  });

  const loginParams = {
    headers: { 'Content-Type': 'application/json' },
  };

  const loginRes = http.post('https://reqres.in/api/login', loginPayload, loginParams);

  check(loginRes, {
    'login status es 200': (r) => r.status === 200,
    'token recibido': (r) => r.json('token') !== undefined,
  });

  const token = loginRes.json('token') || 'no-token';

  const protectedParams = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const protectedRes = http.get('https://reqres.in/api/users/2', protectedParams);

  check(protectedRes, {
    'protected status es 200': (r) => r.status === 200,
    'datos recibidos': (r) => r.json('data.id') === 2,
  });

  sleep(1);
}