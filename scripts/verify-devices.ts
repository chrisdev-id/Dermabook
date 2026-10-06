// Memastikan setiap nomor 510(k) di content/devices benar-benar ada di openFDA
// dan nama perangkat, pemohon, serta tanggal keputusannya cocok.
//
//   npm run verify:devices
//
// Variabel lingkungan opsional: OPENFDA_API_KEY.
import { readCollection, norm, getJson, sleep, fail } from './lib.ts';

type Fda = { k_number: string; decision_date: string | Date; device_name: string; applicant: string };
type Device = { name: string; fda: Fda[] };

const devices = readCollection<Device>('content/devices');
const key = process.env.OPENFDA_API_KEY ? `&api_key=${process.env.OPENFDA_API_KEY}` : '';
const errors: string[] = [];
let checked = 0;

const isoDate = (d: string | Date) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));

for (const { file, data } of devices) {
  for (const f of data.fda ?? []) {
    const json = await getJson(`https://api.fda.gov/device/510k.json?search=k_number:${f.k_number}${key}`);
    const r = json?.results?.[0];
    checked++;
    if (!r) {
      errors.push(`${file}: ${f.k_number} tidak ditemukan di openFDA`);
      continue;
    }
    if (norm(r.device_name) !== norm(f.device_name)) {
      errors.push(`${file}: ${f.k_number} nama perangkat berbeda (repo "${f.device_name}", FDA "${r.device_name}")`);
    }
    if (norm(r.applicant) !== norm(f.applicant)) {
      errors.push(`${file}: ${f.k_number} pemohon berbeda (repo "${f.applicant}", FDA "${r.applicant}")`);
    }
    if (r.decision_date !== isoDate(f.decision_date)) {
      errors.push(`${file}: ${f.k_number} tanggal berbeda (repo ${isoDate(f.decision_date)}, FDA ${r.decision_date})`);
    }
    await sleep(300);
  }
}

console.log(`Memeriksa ${checked} nomor 510(k) dari ${devices.length} alat`);
fail(errors, 'verify:devices');
