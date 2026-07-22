/*
 * Entry point tab panel — resolve rute dari routing.js lalu render modulnya.
 * Tambah rute baru: daftarkan di routing.js, tidak perlu edit file ini.
 */

export async function renderPanel(container, config) {
  const { getRoute, DEFAULT_ACTION } = await import('./routing.js');

  const contentType = config?.contentType || DEFAULT_ACTION;
  const route = getRoute(contentType);

  const mod = await import(route.module);
  await mod.render(container, config);
}
