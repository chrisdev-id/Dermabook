// Memastikan setiap referensi PubMed di content/references.yaml benar-benar ada
// dan judul/penulis pertama/tahunnya cocok dengan data PubMed.
//
//   npm run verify:references
//
// Variabel lingkungan opsional: NCBI_API_KEY, NCBI_EMAIL.
import { readYaml, norm, getJson, sleep, fail } from './lib.ts';

type Ref = { id: string; type: string; pmid?: string; title: string; first_author: string; year: number };

const refs = readYaml<Ref[]>('content/references.yaml');
const errors: string[] = [];

// Duplikat id / PMID
const seen = new Map<string, string>();
for (const r of refs) {
  if (seen.has(r.id)) errors.push(`id ganda: ${r.id}`);
  seen.set(r.id, r.id);
}
const pmids = refs.filter((r) => r.type === 'pubmed').map((r) => r.pmid!);
const dupPmid = pmids.filter((p, i) => pmids.indexOf(p) !== i);
for (const p of new Set(dupPmid)) errors.push(`PMID ganda: ${p}`);

const params = new URLSearchParams({ db: 'pubmed', retmode: 'json', tool: 'dermabook' });
if (process.env.NCBI_EMAIL) params.set('email', process.env.NCBI_EMAIL);
if (process.env.NCBI_API_KEY) params.set('api_key', process.env.NCBI_API_KEY);

const BATCH = 150;
const summaries: Record<string, any> = {};
for (let i = 0; i < pmids.length; i += BATCH) {
  const ids = pmids.slice(i, i + BATCH).join(',');
  const json = await getJson(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${params}&id=${ids}`);
  Object.assign(summaries, json?.result ?? {});
  await sleep(400);
}

for (const r of refs.filter((x) => x.type === 'pubmed')) {
  const s = summaries[r.pmid!];
  if (!s || s.error) {
    errors.push(`${r.id}: PMID ${r.pmid} tidak ditemukan di PubMed`);
    continue;
  }
  if (norm(s.title) !== norm(r.title)) {
    errors.push(`${r.id}: judul berbeda\n      di repo  : ${r.title}\n      di PubMed: ${s.title}`);
  }
  if (norm(s.sortfirstauthor ?? '') !== norm(r.first_author)) {
    errors.push(`${r.id}: penulis pertama berbeda (repo "${r.first_author}", PubMed "${s.sortfirstauthor}")`);
  }
  const year = Number(String(s.pubdate ?? '').slice(0, 4));
  if (year && year !== r.year) {
    errors.push(`${r.id}: tahun berbeda (repo ${r.year}, PubMed ${year})`);
  }
}

console.log(`Memeriksa ${pmids.length} referensi PubMed dari ${refs.length} referensi total`);
fail(errors, 'verify:references');
