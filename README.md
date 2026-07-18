# Twibbonify

Buat twibbon massal langsung di browser. 100% client-side — nggak ada foto yang dikirim ke server.

## Fitur

- **Wizard 5 langkah**: Upload template → Tentukan area foto → Upload foto → Atur posisi → Download
- **Frame editor interaktif**: Drag, resize, rotate, ganti bentuk (persegi/bundar/rounded), kontrol numerik
- **Magic Selection**: Klik warna di template untuk auto-detect area foto
- **Batch photo**: Upload sampai 100 foto, atur posisi masing-masing
- **Export fleksibel**: PNG/JPG/WebP, atur kualitas & resolusi, naming pattern dengan `{nama-file}` & `{index}`
- **Auto-save**: Draft tersimpan otomatis ke IndexedDB
- **PWA**: Bisa diinstal dan jalan offline
- **Privasi**: Semua proses di browser — nol server

## Cara Mulai

```bash
bun install
bun run dev
```

## Skrip

| Perintah | Fungsi |
|---|---|
| `bun run dev` | Jalankan dev server |
| `bun run build` | Build untuk production |
| `bun run preview` | Preview hasil build |
| `bun run typecheck` | Cek tipe TypeScript |
| `bun run lint` | Linting ESLint |
| `bun test` | Jalankan test |

## Tech Stack

React 19 · TypeScript · Vite · Zustand · Dexie (IndexedDB) · OffscreenCanvas Web Worker · fflate · PWA

## Lisensi

MIT — lihat [LICENSE](LICENSE).
