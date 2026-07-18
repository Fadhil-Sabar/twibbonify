# Contributing

Terima kasih tertarik berkontribusi! Berikut panduannya.

## Cara Berkontribusi

1. Fork repo ini
2. Buat branch: `git checkout -b fitur-keren`
3. Commit perubahan
4. Push: `git push origin fitur-keren`
5. Buat Pull Request

## Sebelum Pull Request

Pastikan menjalankan semua verifikasi:

```bash
bun run typecheck
bun run lint
bun test
bun run build
```

## Pedoman

- Ikuti struktur kode yang sudah ada
- Gunakan TypeScript strict
- Tes untuk fitur baru
- Jangan commit file build (`dist/`)
