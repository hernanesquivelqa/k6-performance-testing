import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración para spike test
export const options = {
  stages: [
    { duration: '10s', target: 0 },   // Calma inicial
    { duration: '10s', target: 100 }, // Pico repentino a 100 usuarios
    { duration: '10s', target: 0 },   // Vuelta a la calma
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% de respuestas < 500ms
    'http_req_failed': ['rate<0.05'],   // < 5% de errores
    'checks': ['rate>0.95'],            // > 95% de checks exitosos
  },
};

// Credenciales estáticas
const USER = 'eve.holt@reqres.in';
const PASSWORD = 'cityslicka';

export default function () {
  // Login
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

  const token = loginRes.json('token');

  // Endpoint protegido
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