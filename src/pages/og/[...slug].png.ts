// Endpoint statis: membuat gambar pratinjau 1200x630 untuk setiap halaman saat build.
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { ogEntries, ogSlug, type OgEntry } from '../../lib/og';

export const getStaticPaths = (async () => {
  const entries = await ogEntries();
  return entries.map((entry) => ({ params: { slug: ogSlug(entry.path) }, props: { entry } }));
}) satisfies GetStaticPaths;

const fontDir = join(process.cwd(), 'node_modules/@fontsource/plus-jakarta-sans/files');
const font = (weight: 500 | 700 | 800) => ({
  name: 'Plus Jakarta Sans',
  data: readFileSync(join(fontDir, `plus-jakarta-sans-latin-${weight}-normal.woff`)),
  weight,
  style: 'normal' as const,
});
const fonts = [font(500), font(700), font(800)];

const logo = `data:image/svg+xml;base64,${Buffer.from(readFileSync(join(process.cwd(), 'public/favicon.svg'))).toString('base64')}`;

const C = { ink: '#0f172a', muted: '#475569', brand: '#4474eb', brandInk: '#2c56c9', soft: '#edf2fd', accent: '#f97316', line: '#e2e8f0' };

// Elemen ringkas untuk satori (tanpa JSX)
type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children, ...extra },
});

function titleSize(title: string) {
  if (title.length > 60) return 52;
  if (title.length > 36) return 60;
  return 70;
}

function card(e: OgEntry): Node {
  return h('div', { width: '100%', height: '100%', display: 'flex', background: '#ffffff', fontFamily: 'Plus Jakarta Sans' }, [
    // Aksen: garis biru di tepi kiri
    h('div', { position: 'absolute', left: 0, top: 0, width: 12, height: 630, background: C.brand, display: 'flex' }),
    h('div', { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 80px 56px 84px', width: '100%' }, [
      h('div', { display: 'flex', alignItems: 'center', gap: 18 }, [
        h('img', { width: 56, height: 56 }, undefined, { src: logo, width: 56, height: 56 }),
        h('div', { display: 'flex', fontSize: 34, fontWeight: 700, color: C.ink, letterSpacing: -0.5 }, [
          h('span', {}, 'Dermabook'),
          h('span', { color: C.accent }, '.id'),
        ]),
      ]),
      h('div', { display: 'flex', flexDirection: 'column', maxWidth: 1000 }, [
        h('div', { display: 'flex', fontSize: 28, fontWeight: 700, color: C.brandInk }, e.kicker),
        h('div', { display: 'block', marginTop: 16, fontSize: titleSize(e.title), fontWeight: 800, color: C.ink, lineHeight: 1.1, letterSpacing: -1.5, lineClamp: 2 }, e.title),
        e.subtitle
          ? h('div', { display: 'block', marginTop: 24, fontSize: 30, fontWeight: 500, color: C.muted, lineHeight: 1.4, lineClamp: 2 }, e.subtitle)
          : h('div', { display: 'flex' }),
      ]),
      h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `2px solid ${C.line}`, paddingTop: 24, fontSize: 24, fontWeight: 500, color: C.muted }, [
        h('span', {}, 'Edukasi bersumber untuk dokter dan tenaga medis'),
        h('span', { fontWeight: 700, color: C.brandInk }, 'Open source'),
      ]),
    ]),
  ]);
}

export const GET: APIRoute = async ({ props }) => {
  const svg = await satori(card(props.entry as OgEntry) as never, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
