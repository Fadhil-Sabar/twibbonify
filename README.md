# Twibbonify

Aplikasi web client-side untuk membuat banyak twibbon sekaligus. Template, foto, draft, preview, dan proses export tetap berada di perangkat pengguna.

## Menjalankan

```bash
bun install
bun run dev
```

## Verifikasi

```bash
bun run typecheck
bun run lint
bun test
bun run build
```

Arsitektur utama: React + TypeScript, Dexie/IndexedDB untuk aset lokal, Zustand untuk koordinasi state, OffscreenCanvas Web Worker untuk rendering berurutan, dan fflate untuk ZIP.
