/*
 * Route registry — satu titik pendaftaran rute nxvisual.
 *
 * Tambah rute baru = tambah satu entry di ROUTES + satu file modul baru.
 * sidebar.js merender menu dari sini, panel.js me-resolve modul dari sini —
 * tidak perlu edit sidebar.js / panel.js secara manual lagi.
 *
 * `module` adalah path relatif ke file yang mengekspor:
 *   export async function render(container, config) { ... }
 *
 * Ikuti README Section 11: file ini tidak boleh punya `import` statis
 * top-level — semua konsumsi module lain harus dynamic import di dalam fungsi.
 */

export const ROUTES = [
  {
    action: 'home',
    label: 'Home',
    icon: 'icon_home_small',
    desc: 'Halaman utama extension',
    module: './home.js',
  },
  {
    action: 'explorer',
    label: 'Explorer',
    icon: 'icon_fileexplorer',
    desc: 'Jelajahi file dan folder',
    module: './explorer/index.js',
  },
  {
    action: 'oauth',
    label: 'OAuth',
    icon: 'icon_user',
    desc: 'Sign in / autentikasi',
    module: './oauth.js',
  },

  {
    action: 'settings',
    label: 'Settings',
    icon: 'icon_settings_large',
    desc: 'Konfigurasi extension',
    module: './settings.js',
  },
  {
    action: 'development',
    label: 'Development',
    icon: 'icon_cmd',
    desc: 'Perkakas dan informasi untuk developer',
    module: './development.js',
  },

];

export const DEFAULT_ACTION = 'home';

export function getRoute(action) {
  return ROUTES.find((r) => r.action === action) || ROUTES.find((r) => r.action === DEFAULT_ACTION);
}
