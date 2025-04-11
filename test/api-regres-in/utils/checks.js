import { check } from 'k6';

export function validateLoginResponse(res) {
  return check(res, {
    '✅ login status es 200': (r) => r.status === 200,
    '✅ token recibido': (r) => r.json('token') !== undefined,
  });
}

export function validateProtectedResponse(res) {
  return check(res, {
    '✅ protected status es 200': (r) => r.status === 200,
    '✅ datos recibidos': (r) => r.json('data.id') === 2,
  });
}