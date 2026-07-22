/*
 * Rute: development
 * Terdaftar di routing.js (action: 'development').
 *
 * Contoh tabel berbasis Fluent (templates/helper/tableBuilder.js) — alternatif
 * ber-Fluent dari NXUI.NexaTables (templates/Components/tables.js) yang butuh
 * CSS eksternal (table.css, dst) tidak dimuat di index.html project ini.
 *
 * Data (tabel `ipkd`) di-fetch OLEH tableBuilder.js sendiri (mode `options.source`)
 * lewat NXUI.Storage().models("Office").executeOperation() (jalur resmi NX.BuildQuery,
 * lihat templates/helper/tableBuilder.js) — search & paginasi terhubung ke server,
 * bukan fetch-semua-lalu-slice-di-client. File ini cukup kasih `source` (hasil
 * NxStorage) + kolom yang mau ditampilkan.
 */

let _table = null;

export async function render(container) {
  container.innerHTML = `
    <div style="padding: 24px; max-width: 800px; margin: 0 auto;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">Development</h2>
      <p style="margin: 0 0 20px 0; color: var(--beranda-dv-text-muted);">Contoh tabel Fluent: cari, filter tahun, paginasi, dan kolom aksi (Lihat/Ubah/Hapus).</p>

      <div id="nx-generated-table-host"></div>
    </div>
  `;

  const host = container.querySelector('#nx-generated-table-host');
  const { mountGeneratedTable, columnsFromSchema } = await import('../helper/tableBuilder.js');

  const schemaData = await NxStorage('ipkd').catch((err) => {
    console.error('[development] gagal baca storage ipkd:', err.message);
    return null;
  });

  if (!schemaData?.production) {
    host.innerHTML = `<p style="color: var(--beranda-dv-text-muted); font-size: 13px;">Skema (storage/ipkd.json → production) tidak ditemukan.</p>`;
    return;
  }

  // Kolom otomatis dari skema production.from (sama field & label yang dipakai
  // formBuilder.js untuk generate form) — bukan daftar key manual, jadi otomatis
  // ikut berubah kalau skema ipkd.json ditambah/dikurangi field baru.
  const columns = columnsFromSchema(schemaData);

  _table = await mountGeneratedTable(host, {
    source: schemaData,
    columns,
    pageSize:10,
    // Dropdown filter tahun (exact-match, di-AND-kan dengan search di server) —
    // opsinya diambil dari production.from.tahun.select.data (2022-2030).
    filterField: "tahun",
    // Kolom actions (dropdown/icon Edit, Delete, dll) di kolom pertama — lihat
    // templates/Components/tables.js contoh #5 ("Kolom eksplisit + format sel").
    actions: {
      view: true,
      edit: true,
      delete: true,
    },
    onAction: (action, row) => {
      console.log("NexaTables row action:", action, row);
    },
    // Export (CSV/JSON/XLSX/PDF) — lihat templates/Components/tables.js contoh #1
    // (export.types/include/fileName), util-nya dipakai ulang dari
    // assets/modules/tables/NexaTablesExport.js.
    export: {
      enabled: true,
      types: ["csv", "json", "xlsx", "pdf"],
      fileName: "ipkd",
    },
  });
}
