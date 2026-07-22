/*
 * Rute: explorer
 * Terdaftar di routing.js (action: 'explorer', module: './explorer/index.js').
 *
 * Gateway (daftar kartu) GENERIK — TIDAK boleh hardcode nama dokumen satu-satu,
 * karena daftar storage bisa terus bertambah dari editor skema (production.js)
 * tanpa perlu sentuh file ini. Daftar didapat dari NxStorage.list() (endpoint
 * index.js GET /nexa-storage/:extension).
 *
 * Tapi RENDER per-dokumen (form & tabel) SENGAJA dipisah per folder
 * (explorer/{doc}/form.js, explorer/{doc}/tabel.js) — bukan logic tunggal di
 * file ini untuk semua dokumen. Alasan: dua tabel data BISA kebetulan mirip
 * (mis. mscp & ipkd sekarang), tapi tidak ada jaminan itu berlaku selamanya —
 * dokumen baru bisa butuh validasi/aksi/layout yang beda total. Kalau semua
 * dipaksa lewat satu logic generik, itu akan berakhir jadi tumpukan
 * if/else per nama dokumen yang sulit dirawat.
 *
 * Kontrak tiap folder explorer/{doc}/:
 *   - form.js  → export async function render(container, data)
 *   - tabel.js → export async function render(container, data)
 * `data` adalah hasil `await NxStorage(doc)` (skema production sudah dibaca,
 * sudah divalidasi ada) — folder tidak perlu fetch ulang.
 *
 * Kalau folder/file belum ada (dokumen baru belum di-setup manual), FALLBACK ke
 * renderDocumentTable/renderDocumentForm — versi MINIMAL di file ini (bukan
 * salinan lengkap seperti explorer/mscp atau explorer/ipkd, sengaja tidak
 * dikembangkan lebih jauh dari sekadar formBuilder.js/tableBuilder.js polos) —
 * supaya dokumen baru tetap langsung jalan tanpa perlu bikin folder dulu.
 * Begitu dokumen butuh tampilan yang layak/kustom, buat folder explorer/{doc}/
 * (salin dari explorer/ipkd/ sebagai contoh) — JANGAN kembangkan fallback di
 * file ini jadi lengkap, itu justru mengulang masalah "satu file untuk semua
 * dokumen" yang pola ini coba hindari.
 *
 * Tiap kartu dokumen di gateway punya 2 aksi TERPISAH (bukan satu klik-kartu):
 * "Lihat Tabel" dan "+ Tambah Data" — satu paket per dokumen, tapi dua sub-view
 * berbeda yang dipilih eksplisit lewat tombol.
 *
 * Sub-view dibaca dari config.explorerDoc + config.explorerView ("table"|"form",
 * default "form") — pola sama dengan oauth.js (config.oauthView), lihat
 * templates/nxvisual/README.md Section 3b. Tidak didaftarkan di routing.js/ROUTES
 * karena bukan menu sidebar.
 */

export async function render(container, config) {
  const oauth = window.NXUI?.ref ? await window.NXUI.ref.get('bucketsStore', 'oauth') : null;
  if (!oauth) {
    const ICON_SRC = await import('../../Icon.js');
    container.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: calc(100vh - 140px);">
      <img src="${ICON_SRC.icon_user}" alt="" style="width: 64px; height: 64px; opacity: 0.4; margin-bottom: 16px;" />
      <p style="color: var(--beranda-dv-text-muted); font-size: 14px; margin: 0;">Belum login. Buka menu OAuth untuk masuk.</p>
    </div>`;
    return;
  }

  const doc = config?.explorerDoc || null;
  if (doc && config?.explorerView === 'table') return renderDocForView(container, doc, 'tabel', renderDocumentTable);
  if (doc) return renderDocForView(container, doc, 'form', renderDocumentForm);
  return renderGateway(container);
}

/**
 * Coba muat explorer/{doc}/{moduleName}.js (kontrak: export async function
 * render(container, data)) — kalau tidak ada/gagal, pakai fallback generik.
 * `data` (hasil NxStorage(doc)) di-fetch SEKALI di sini lalu diteruskan ke
 * keduanya, supaya folder per-dokumen tidak perlu fetch ulang.
 */
async function renderDocForView(container, doc, moduleName, fallbackFn) {
  const data = await NxStorage(doc).catch((err) => {
    console.error(`[explorer] gagal baca storage ${doc}:`, err.message);
    return null;
  });

  try {
    const mod = await import(`./${doc}/${moduleName}.js`);
    if (typeof mod.render === 'function') {
      return mod.render(container, data);
    }
  } catch (err) {
    // Folder/file belum ada — normal untuk dokumen baru, lanjut ke fallback generik.
  }

  return fallbackFn(container, doc, data);
}

/** Ganti sub-view tanpa reload seluruh panel — dipicu klik tombol kartu atau link "kembali". */
export function gotoExplorerDoc(doc, view = 'form') {
  window.dispatchEvent(new CustomEvent('beranda:open-developer-tab', {
    detail: { viewId: 'nxvisual', contentType: 'explorer', explorerDoc: doc, explorerView: view },
  }));
}

async function renderGateway(container) {
  const ICON_SRC = await import('../../Icon.js');
  await window.NX.defineFluent(['fluentCard', 'fluentButton']);

  container.innerHTML = `
    <div style="padding: 24px; max-width: 800px; margin: 0 auto;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">Explorer</h2>
      <p style="margin: 0 0 20px 0; color: var(--beranda-dv-text-muted);">Pilih dokumen yang ingin dikelola.</p>
      <div id="nxv-explorer-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
        <p style="color: var(--beranda-dv-text-muted); font-size: 13px;">Memuat daftar dokumen…</p>
      </div>
    </div>
  `;

  const cardsHost = container.querySelector('#nxv-explorer-cards');

  let names = [];
  try {
    names = await NxStorage.list();
  } catch (err) {
    console.error('[explorer] gagal baca daftar storage:', err.message);
    cardsHost.innerHTML = `<p style="color: var(--beranda-dv-text-muted); font-size: 13px;">Gagal memuat daftar dokumen: ${err.message}</p>`;
    return;
  }

  if (!names.length) {
    cardsHost.innerHTML = `<p style="color: var(--beranda-dv-text-muted); font-size: 13px;">Belum ada dokumen di storage/.</p>`;
    return;
  }

  // Ambil appname/deskripsi tiap dokumen (paralel) supaya kartu tampil rapi,
  // bukan cuma nama file mentah — fallback nama file kalau storage-nya kosong/rusak.
  const cards = await Promise.all(names.map(async (name) => {
    const data = await NxStorage(name).catch(() => null);
    return { name, appname: data?.appname || name, deskripsi: data?.deskripsi || '' };
  }));

  cardsHost.innerHTML = cards.map((c) => `
    <fluent-card data-doc="${c.name}" style="padding: 16px;">
      <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: var(--beranda-dv-text);">${c.appname}</h3>
      ${c.deskripsi ? `<p style="margin: 0 0 12px; font-size: 12px; color: var(--beranda-dv-text-muted);">${c.deskripsi}</p>` : '<div style="margin-bottom: 12px;"></div>'}
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <fluent-button appearance="stealth" size="small" data-doc-action="table" data-doc="${c.name}">
          <img slot="start" src="${ICON_SRC.icon_app_excel}" alt="" style="width: 16px; height: 16px; object-fit: contain;" />
          Lihat Tabel
        </fluent-button>
        <fluent-button appearance="accent" size="small" data-doc-action="form" data-doc="${c.name}">+ Tambah Data</fluent-button>
      </div>
    </fluent-card>
  `).join('');

  cardsHost.querySelectorAll('[data-doc-action]').forEach((btn) => {
    btn.addEventListener('click', () => gotoExplorerDoc(btn.dataset.doc, btn.dataset.docAction));
  });
}

/**
 * Fallback MINIMAL — dipakai HANYA kalau explorer/{doc}/tabel.js atau form.js
 * belum ada (dokumen baru yang belum di-setup folder khusus). Sengaja tidak
 * selengkap tampilan mscp/ipkd (tanpa export, tanpa upload progress bar, dll)
 * — begitu dokumen butuh tampilan yang layak, buat foldernya (lihat
 * explorer/ipkd/tabel.js atau explorer/ipkd/form.js sebagai contoh awal untuk
 * disalin & disesuaikan), jangan kembangkan fallback ini jadi lengkap lagi.
 */
const FALLBACK_BACK_BUTTON = `
  <button
    type="button"
    id="nxv-explorer-back"
    title="Kembali ke Explorer"
    style="position: fixed; right: 24px; bottom: 24px; width: 52px; height: 52px; border-radius: 50%; border: 1px solid var(--beranda-dv-border, #ccc); background: var(--beranda-dv-surface, #fff); cursor: pointer;"
  >←</button>
`;

async function renderDocumentTable(container, doc, data) {
  const { mountGeneratedTable, columnsFromSchema } = await import('../../helper/tableBuilder.js');

  if (!data?.production) {
    container.innerHTML = `<div style="padding: 24px;"><p style="color: var(--beranda-dv-text-muted); font-size: 13px;">Skema tabel (storage/${doc}.json → production) tidak ditemukan.</p></div>${FALLBACK_BACK_BUTTON}`;
    container.querySelector('#nxv-explorer-back')?.addEventListener('click', () => gotoExplorerDoc(null));
    return;
  }

  container.innerHTML = `
    <div style="padding: 24px; max-width: 800px; margin: 0 auto;">
      <h2 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">${data.appname || doc}</h2>
      <div id="nx-generated-table-host"></div>
    </div>
    ${FALLBACK_BACK_BUTTON}
  `;
  container.querySelector('#nxv-explorer-back')?.addEventListener('click', () => gotoExplorerDoc(null));

  await mountGeneratedTable(container.querySelector('#nx-generated-table-host'), {
    source: data,
    columns: columnsFromSchema(data),
    pageSize: 10,
    actions: { view: true, edit: true, delete: true },
  });
}

async function renderDocumentForm(container, doc, data) {
  const { mountGeneratedForm } = await import('../../helper/formBuilder.js');

  if (!data?.production) {
    container.innerHTML = `<div style="padding: 24px;"><p style="color: var(--beranda-dv-text-muted); font-size: 13px;">Skema form (storage/${doc}.json → production) tidak ditemukan.</p></div>${FALLBACK_BACK_BUTTON}`;
    container.querySelector('#nxv-explorer-back')?.addEventListener('click', () => gotoExplorerDoc(null));
    return;
  }

  container.innerHTML = `
    <div style="padding: 24px; max-width: 560px; margin: 0 auto;">
      <h2 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">${data.appname || doc}</h2>
      <div id="nx-generated-form-host"></div>
    </div>
    ${FALLBACK_BACK_BUTTON}
  `;
  container.querySelector('#nxv-explorer-back')?.addEventListener('click', () => gotoExplorerDoc(null));

  await mountGeneratedForm(container.querySelector('#nx-generated-form-host'), data, {
    onSubmit: (values) => console.log(`[explorer/${doc}] submit (fallback, belum ada folder khusus):`, values),
  });
}
