import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Cargar el CSV
const users = new SharedArray('users', function () {
  return open('./data/api-regres-in/users.csv').split('\n').slice(1).map(line => {
    const [email, password] = line.split(',');
    return { email, password };
  });
});

export const options = {
  stages: [
    { duration: '10s', target: 20 },
    { duration: '20s', target: 100 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['rate<0.02'],
    'checks': ['rate>0.95'],
  },
};

export default function () {
  const user = users[__VU % users.length];

  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const loginParams = {
    headers: { 'Content-Type': 'application/json' },
  };

  console.log(`VU ${__VU} intentando login con: ${user.email}`);

  const loginRes = http.post('https://reqres.in/api/login', loginPayload, loginParams);

  // Verificar y registrar fallos
  const loginOk = check(loginRes, {
    'login status es 200': (r) => r.status === 200,
    'token recibido': (r) => r.json('token') !== undefined,
  });

  if (!loginOk) {
    console.log(`VU ${__VU} falló con: ${user.email}, status: ${loginRes.status}`);
  }

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