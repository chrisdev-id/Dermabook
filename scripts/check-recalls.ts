// Mencari recall FDA untuk setiap nomor 510(k) di katalog alat.
// Recall yang belum tercatat di content/recalls-reviewed.yaml ditulis ke
// recall-report.md agar workflow mingguan bisa membuat issue GitHub.
//
//   npm run check:recalls
//
// Catatan: pencarian berdasarkan nomor 510(k) yang tercantum di katalog. Recall
// yang terkait nomor 510(k) lain (mis. versi lama alat yang sama) tidak tercakup.
import { writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readCollection, readYaml, getJson, sleep } from './lib.ts';

type Device = { name: string; fda: { k_number: string }[] };
type Reviewed = { res_event_number: string; note?: string }[];

const devices = readCollection<Device>('content/devices');
const reviewed = new Set((readYaml<Reviewed>('content/recalls-reviewed.yaml') ?? []).map((r) => String(r.res_event_number)));
const key = process.env.OPENFDA_API_KEY ? `&api_key=${process.env.OPENFDA_API_KEY}` : '';
const reportPath = join(ROOT, 'recall-report.md');

const found: string[] = [];
for (const { file, data } of devices) {
  for (const { k_number } of data.fda) {
    const json = await getJson(`https://api.fda.gov/device/recall.json?search=k_numbers:${k_number}&limit=100${key}`);
    for (const r of json?.results ?? []) {
      if (reviewed.has(String(r.res_event_number))) continue;
      found.push(
        `### ${data.name} (${k_number})\n` +
          `- Event: ${r.res_event_number} · Status: ${r.recall_status} · Dimulai: ${r.event_date_initiated}\n` +
          `- Produk: ${(r.product_description ?? '').slice(0, 300)}\n` +
          `- Alasan: ${(r.reason_for_recall ?? '').slice(0, 500)}\n` +
          `- File konten: \`${file}\`\n` +
          `- Detail: https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfRES/res.cfm?id=${r.cfres_id}\n`,
      );
    }
    await sleep(300);
  }
}

rmSync(reportPath, { force: true });
if (found.length) {
  writeFileSync(
    reportPath,
    `Pemeriksaan mingguan menemukan **${found.length} recall FDA** yang belum ditinjau untuk alat di katalog.\n\n` +
      `Langkah: baca detailnya, perbarui halaman alat jika relevan, lalu tambahkan nomor event ke ` +
      `\`content/recalls-reviewed.yaml\`.\n\n${found.join('\n')}`,
  );
  console.log(`! ${found.length} recall baru, lihat recall-report.md`);
} else {
  console.log('✓ check:recalls: tidak ada recall baru');
}
