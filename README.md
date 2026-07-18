# Twibbonify

Buat twibbon massal langsung di browser. 100% client-side, nggak ada foto yang dikirim ke server.

## Fitur

- **Wizard 5 langkah**: Upload template, Tentukan area foto, Upload foto, Atur posisi, Download ZIP
- **Frame editor interaktif**: Drag, resize, rotate, ganti bentuk (persegi/bundar/rounded), kontrol numerik
- **Magic Selection**: Klik warna atau area transparan di template, tolerance bisa diatur, mode add/subtract, auto-detect area foto
- **Batch photo**: Upload sampai 100 foto, atur posisi dan scale masing-masing
- **Export fleksibel**: PNG/JPG/WebP, atur kualitas & resolusi, naming pattern dengan `{nama-file}` dan `{index}`
- **Auto-save**: Draft tersimpan otomatis ke IndexedDB
- **PWA**: Bisa diinstal dan jalan offline
- **Privasi**: Semua proses di browser, nol server

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

## Arsitektur

### Magic Selection

Magic Select menggunakan flood fill RGBA berdasarkan toleransi warna yang berjalan di Web Worker. Pengguna mengklik area kosong pada template, worker menjalankan flood fill pada working image (maksimal 2048 px). Hasil selection disimpan sebagai mask PNG alpha di IndexedDB lalu di-render ulang di preview dan export worker. Selection order: replace, add, subtract. Dilengkapi invert, expand, contract, dan feather.

Pipeline: `klik → image scaling → worker flood fill → merge mask → store mask Blob → render → export`

### Frame Detection

Untuk template dengan area transparan atau warna seragam, auto detection mencari connected component terbesar yang tidak menyentuh tepi canvas. Region yang terfragmentasi oleh banner atau ornamen akan digabung berdasarkan overlap dan jarak pusat. Bounding box kemudian dipetakan ke resolusi asli template.

### Image Rendering

- **Preview**: CompositionCanvas membaca mask Blob dari IndexedDB lalu merender foto di belakang template dengan alpha mask.
- **Export Worker**: OffscreenCanvas menerima template, foto, dan mask; render foto dengan `destination-in` composite, overlay template dengan `destination-out`, lalu encode ke PNG/JPG/WebP.
- **Flexible Mask**: Jika maskColor tersimpan (hasil Magic Select), template di-copy ke canvas sementara dan piksel yang cocok dengan warna target dihapus (alpha=0), sehingga ornamen template tetap utuh di atas foto.

### State & Persistence

- Zustand untuk koordinasi state UI dan project metadata.
- Dexie/IndexedDB untuk penyimpanan Blob (template, foto, mask).
- Autosave debounce 500ms untuk perubahan frame dan transform.
- Object URL dan ImageBitmap selalu di-revoke/close setelah digunakan.

## Tech Stack

React 19 · TypeScript · Vite · Zustand · Dexie (IndexedDB) · OffscreenCanvas Web Worker · fflate · Canvas 2D API · PWA

## Lisensi

MIT, lihat [LICENSE](LICENSE).
