import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración mínima para smoke test
export const options = {
  vus: 1,          // Solo 1 usuario virtual
  duration: '10s', // 10 segundos de duración
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% de respuestas < 500ms
    'http_req_failed': ['rate<0.01'],   // < 1% de errores
    'checks': ['rate>0.99'],            // > 99% de checks exitosos
  },
};


const USER = __ENV.USER 
const PASSWORD = __ENV.PASSWORD 


export default function () {
  // Paso 1: Login
  const loginPayload = JSON.stringify({
    email: USER,
    password: PASSWORD,
  });

  const loginParams = {
    headers: { 'Content-Type': 'application/json' },
  };

  const loginRes = http.post('https://reqres.in/api/login', loginPayload, loginParams);

  // Verifico que el login funcione
  check(loginRes, {
    'login status es 200': (r) => r.status === 200,
    'token recibido': (r) => r.json('token') !== undefined,
  });

  // Extraigo el token
  const token = loginRes.json('token');

  // Paso 2: Accedo a un endpoint protegido
  const protectedParams = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const protectedRes = http.get('https://reqres.in/api/users/2', protectedParams);

  // Verifico que el acceso funcione
  check(protectedRes, {
    'protected status es 200': (r) => r.status === 200,
    'datos recibidos': (r) => r.json('data.id') === 2,
  });

  sleep(1); // Pausa breve
}