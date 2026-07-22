# Example Extension

Template extension untuk Developer Extensions System.
Gunakan folder ini sebagai referensi saat membuat extension baru.

## Struktur File

```
example/
├── README.md      — dokumentasi extension (file ini)
├── package.json   — metadata: id, title, viewId, place, dll
├── index.js       — registrasi view (render & renderTab)
├── sidebar.js     — konten sidebar kiri
├── panel.js       — konten tab panel kanan
├── styles.css     — custom styles (opsional)
└── assets/        — gambar, SVG, icon kustom (opsional)
```

## Cara Membuat Extension Baru

1. Copy folder ini ke folder terpisah di repo Git Anda
2. Ubah `id`, `title`, `viewId`, dan `place` di `package.json`
3. Ubah `id` di `index.js` — harus sama dengan `viewId`
4. Edit `sidebar.js` dan `panel.js` sesuai kebutuhan
5. Install via Developer panel dengan paste URL repo

## Catatan

- `id` di `package.json` → kunci unik install state, format `dev_namaextension`
- `id` di `index.js` → harus sama dengan `viewId` di `package.json`
- `viewId` → harus sama dengan nama folder repo (tanpa prefix `developer/`)
- `place: "edge"` → tampil di panel kanan; `"activity-bar"` → tampil di sidebar kiri

Lihat `templates/developer/README.md` untuk dokumentasi lengkap.

---

## Aturan Baku — Icon

### Cara Pakai Icon Sistem (Direkomendasikan)

Aplikasi menyediakan ratusan icon siap pakai melalui class CSS. Gunakan ini sebelum membuat icon sendiri.

**Format:**
```html
<span class="icon icon-NAMA" aria-hidden="true"></span>
```

**Contoh di `sidebar.js`:**
```javascript
// Icon folder bawaan sistem
'<span class="icon icon-folder-src" aria-hidden="true"></span>'
'<span class="icon icon-folder-api" aria-hidden="true"></span>'
'<span class="icon icon-settings" aria-hidden="true"></span>'
'<span class="icon icon-delete" aria-hidden="true"></span>'
```

#### Pilihan Icon Folder (untuk item menu sidebar)

| Class | Tampilan |
|-------|---------|
| `icon-folder-src` | Folder source (default template) |
| `icon-folder-api` | Folder API |
| `icon-folder-config` | Folder config / settings |
| `icon-folder-components` | Folder components |
| `icon-folder-lib` | Folder library |
| `icon-folder-vendor` | Folder vendor / packages |
| `icon-folder-assets` | Folder assets / resources |
| `icon-folder-dist` | Folder dist / build |
| `icon-folder-node` | Folder node / runtime |
| `icon-folder-docs` | Folder dokumentasi |
| `icon-folder-database` | Folder database |
| `icon-folder-server` | Folder server |
| `icon-folder-store` | Folder store / state |
| `icon-folder-utils` | Folder utilities |
| `icon-folder-scripts` | Folder scripts |
| `icon-folder-hooks` | Folder hooks |
| `icon-folder-views` | Folder views |
| `icon-folder-routes` | Folder routes |
| `icon-folder-controller` | Folder controller |
| `icon-folder-middleware` | Folder middleware |
| `icon-folder-test` | Folder test |
| `icon-folder-docker` | Folder docker |
| `icon-folder-git` | Folder git |
| `icon-folder-github` | Folder github |
| `icon-folder-images` | Folder images |
| `icon-folder-css` | Folder CSS |
| `icon-folder-js` | Folder JavaScript |
| `icon-folder-public` | Folder public |
| `icon-folder-plugin` | Folder plugin / extension |
| `icon-folder-shared` | Folder shared |
| `icon-folder-tools` | Folder tools |
| `icon-folder-app` | Folder app |
| `icon-folder-audio` | Folder audio |

#### Pilihan Icon Umum

| Class | Tampilan |
|-------|---------|
| `icon-settings` | Gear / pengaturan |
| `icon-search` | Kaca pembesar |
| `icon-delete` | Hapus / trash |
| `icon-edit` | Edit / pensil |
| `icon-js` | JavaScript |
| `icon-ts` | TypeScript |
| `icon-json` | JSON |
| `icon-html` | HTML |
| `icon-css` | CSS |

#### Icon Material Symbols (alternatif)

```html
<span class="material-symbols-outlined" style="font-size:18px;">settings</span>
<span class="material-symbols-outlined" style="font-size:18px;">folder_open</span>
<span class="material-symbols-outlined" style="font-size:18px;">extension</span>
```

Daftar nama: `settings`, `folder_open`, `extension`, `code`, `widgets`, `database`,
`cloud`, `terminal`, `search`, `delete`, `edit`, `add`, `close`, `check`, `info`, dll.

### Icon Kustom dari Folder `assets/`

Jika tidak ada icon sistem yang sesuai, taruh file SVG/PNG di folder `assets/` extension Anda.

**Cara referensikan:**
```javascript
// Path aman — bekerja baik di browser maupun Electron
const base = new URL('.', import.meta.url).href;

container.innerHTML = `
  <span class="icon" style="background-image: url('${base}assets/my-icon.svg')" aria-hidden="true"></span>
`;
```

**Atau via CSS di `styles.css`:**
```css
.my-extension-icon {
  width: 18px;
  height: 18px;
  display: inline-block;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  background-image: url('./assets/my-icon.svg');
}
```

Lalu pakai di HTML:
```html
<span class="my-extension-icon" aria-hidden="true"></span>
```

**Format file yang disarankan:**
- SVG — paling fleksibel, skala sempurna, ukuran kecil
- PNG — jika icon punya detail warna kompleks (minimal 32×32 px)

> **Catatan:** Icon SVG monokrom dari `assets/` tidak otomatis mengikuti warna teks seperti icon sistem.
> Jika ingin icon warnanya ikut tema, embed SVG sebagai `mask` atau gunakan CSS `currentColor`.

**Contoh SVG ikut warna teks:**
```css
.my-extension-icon-mask {
  width: 18px;
  height: 18px;
  display: inline-block;
  background-color: currentColor;          /* ikuti warna teks / tema */
  -webkit-mask: url('./assets/my-icon.svg') no-repeat center / contain;
  mask: url('./assets/my-icon.svg') no-repeat center / contain;
}
```

---

## Aturan Baku — Tema Terang / Gelap

Extension **wajib** mengikuti sistem tema yang sudah berjalan di aplikasi. Jangan membuat logika tema sendiri.

### Deteksi Mode

```javascript
// Cek apakah sedang dark mode
const isDark = document.body.classList.contains('dark-mode-grid');
```

Atau pakai CSS `data-color-mode` di `<html>`:

```css
/* Otomatis mengikuti tema aktif */
[data-color-mode="dark"]  .my-element { ... }
[data-color-mode="light"] .my-element { ... }
```

### CSS Variables — Gunakan Ini, Bukan Hard-code Warna

Semua warna sudah tersedia sebagai CSS custom property. Selalu pakai variabel ini agar extension otomatis sesuai tema.

| Variable | Light | Dark | Kegunaan |
|----------|-------|------|----------|
| `--beranda-dv-bg` | `#ffffff` | `#1e1e1e` | Background utama panel |
| `--beranda-dv-header-bg` | `#f6f8fa` | `#1e1e1e` | Background header/toolbar |
| `--beranda-dv-content-bg` | `#f0f2f4` | `#252526` | Background konten sekunder |
| `--beranda-dv-surface` | `#ffffff` | `#32363f` | Card / surface elemen |
| `--beranda-dv-hover` | `#eaeef2` | `#383d48` | Warna hover item |
| `--beranda-dv-input-bg` | `#ffffff` | `#32363f` | Background input/textarea |
| `--beranda-dv-border` | `#d0d7de` | `#2d2d30` | Border standar (`--beranda-dv-header-border`) |
| `--beranda-dv-border-dark` | `#b7bec7` | `#4a505c` | Border tegas |
| `--beranda-dv-text` | `#1f2328` | `#cccccc` | Teks utama |
| `--beranda-dv-text-muted` | `#57606a` | `#888888` | Teks sekunder / label |
| `--beranda-dv-text-faint` | `#8c959f` | `#6e737c` | Teks sangat redup / placeholder |
| `--beranda-dv-code-bg` | `#f6f8fa` | `#1a1a1a` | Background blok kode |
| `--beranda-dv-accent` | `#0969da` | `#4d78cc` | Warna aksen / link / tombol aktif |

**Contoh pakai:**

```javascript
container.innerHTML = `
  <div style="
    background: var(--beranda-dv-bg);
    color: var(--beranda-dv-text);
    border: 1px solid var(--beranda-dv-header-border);
    padding: 16px;
    border-radius: 6px;
  ">
    Konten otomatis mengikuti tema
  </div>
`;
```

### Mendengarkan Perubahan Tema (Opsional)

Jika extension perlu bereaksi saat tema berubah (misal: update chart, canvas):

```javascript
// Berlangganan perubahan tema via storage event
window.addEventListener('storage', (e) => {
  if (e.key === 'darkMode') {
    const isDark = e.newValue === 'true';
    // update tampilan extension
  }
});

// Atau pantau class body lewat MutationObserver
const observer = new MutationObserver(() => {
  const isDark = document.body.classList.contains('dark-mode-grid');
  // update tampilan extension
});
observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
```

> Jangan lupa `observer.disconnect()` saat panel di-dispose untuk mencegah memory leak.

### Aturan Wajib

1. **Jangan hard-code warna** — selalu pakai `var(--beranda-dv-*)` agar otomatis mengikuti tema
2. **Jangan simpan preferensi tema sendiri** — satu sumber kebenaran: `localStorage.darkMode` dan class `dark-mode-grid` di `document.body`
3. **Jangan ubah class `dark-mode-grid`** pada `body` atau `html` — itu wewenang sistem utama
4. **Jangan set `data-color-mode`** secara manual — dikelola oleh `beranda.js`
