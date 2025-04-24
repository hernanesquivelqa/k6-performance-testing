import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Métricas custom
let responseTimeTrend = new Trend('response_time');
let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '30s', target: 20 }, // calentar hasta 20 VUs
    { duration: '1m', target: 50 },  // subir a 50 VUs
    { duration: '30s', target: 0 },  // bajar a 0 VUs
  ],
  thresholds: {
    // < 500 ms en el 95% de las peticiones
    'response_time': ['p(95)<500'],
    // menos del 1% de errores
    'errors': ['rate<0.01'],
  },
};

// Generador de IDs aleatorios entre 1 y 898 (cantidad de Pokémon)
function randomPokemonId() {
  return Math.floor(Math.random() * 898) + 1;
}

export default function () {
  let id = randomPokemonId();
  let url = `https://pokeapi.co/api/v2/pokemon/${id}`;

  let res = http.get(url);

  // Medimos
  responseTimeTrend.add(res.timings.duration);
  let success = check(res, {
    'status 200': (r) => r.status === 200,
    'json tiene name': (r) => r.json('name') !== undefined,
  });

  errorRate.add(!success);

  sleep(1); // esperar 1 s entre iteraciones
}
