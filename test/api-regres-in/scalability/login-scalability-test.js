import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración para scalability test
export const options = {
  stages: [
    { duration: '2m', target: 50 },  // 50 usuarios por 2 minutos
    { duration: '2m', target: 100 }, // 100 usuarios por 2 minutos
    { duration: '2m', target: 200 }, // 200 usuarios por 2 minutos
  ],
  thresholds: {
    'http_req_duration': ['p(95)<400', 'p(99)<500'], // Respuesta rápida en todos los niveles
    'http_req_failed': ['rate<0.01'],                // < 1% de errores
    'checks': ['rate>0.99'],                         // > 99% de checks exitosos
  },
};

// Credenciales

const USER = __ENV.USER 
const PASSWORD = __ENV.PASSWORD 


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

  const token = loginRes.json('token') || 'no-token';

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