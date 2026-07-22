/*
 * Rute: explorer
 * Terdaftar di routing.js (action: 'explorer', module: './explorer/index.js').
 *
 * Generik — TIDAK boleh hardcode nama dokumen (mis. "mscp"/"ipkd") satu-satu,
 * karena daftar storage bisa terus bertambah dari editor skema (production.js)
 * tanpa perlu sentuh file ini. Daftar didapat dari NxStorage.list() (endpoint
 * index.js GET /nexa-storage/:extension), form isinya di-generate otomatis dari
 * skema production tiap storage via templates/helper/formBuilder.js.
 *
 * Sub-view (dokumen yang dipilih) dibaca dari config.explorerDoc — pola sama
 * dengan oauth.js (config.oauthView), lihat templates/nxvisual/README.md
 * Section 3b. Tidak didaftarkan di routing.js/ROUTES karena bukan menu sidebar.
 */

export async function render(container, config) {
  const doc = config?.explorerDoc || null;
  if (doc) return renderDocumentForm(container, doc);
  return renderGateway(container);
}

/** Ganti sub-view tanpa reload seluruh panel — dipicu klik kartu atau link "kembali". */
export function gotoExplorerDoc(doc) {
  window.dispatchEvent(new CustomEvent('beranda:open-developer-tab', {
    detail: { viewId: 'nxvisual', contentType: 'explorer', explorerDoc: doc },
  }));
}

async function renderGateway(container) {
  await window.NX.defineFluent(['fluentCard']);

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
    <fluent-card data-doc="${c.name}" style="padding: 16px; cursor: pointer;">
      <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: var(--beranda-dv-text);">${c.appname}</h3>
      ${c.deskripsi ? `<p style="margin: 0; font-size: 12px; color: var(--beranda-dv-text-muted);">${c.deskripsi}</p>` : ''}
    </fluent-card>
  `).join('');

  cardsHost.querySelectorAll('[data-doc]').forEach((card) => {
    card.addEventListener('click', () => gotoExplorerDoc(card.dataset.doc));
  });
}

async function renderDocumentForm(container, doc) {
  const { mountGeneratedForm } = await import('../../helper/formBuilder.js');
  const ICON_SRC = await import('../../Icon.js');
  await window.NX.defineFluent(['fluentProgress', 'fluentButton', 'fluentCard']);

  const data = await NxStorage(doc).catch((err) => {
    console.error(`[explorer] gagal baca storage ${doc}:`, err.message);
    return null;
  });

  // Floating action button pojok kanan bawah panel — bukan di header, supaya
  // tidak bersaing dengan judul/deskripsi dokumen dan tetap terjangkau saat
  // form panjang di-scroll (position: fixed relatif ke area panel).
  const backButtonHtml = `
    <button
      type="button"
      id="nxv-explorer-back"
      title="Kembali ke Explorer"
      style="position: fixed; right: 24px; bottom: 24px; width: 52px; height: 52px; border-radius: 50%; border: none; background: transparent; box-shadow: none; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;"
    >
      <img src="${ICON_SRC.icon_folder}" alt="" style="width: 28px; height: 28px; object-fit: contain;" />
    </button>
  `;

  if (!data?.production) {
    container.innerHTML = `
      <div style="padding: 24px; max-width: 560px; margin: 0 auto;">
        <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">${doc}</h2>
        <fluent-card style="padding: 16px;">
          <p style="margin: 0; font-size: 13px; color: var(--beranda-dv-text-muted);">Skema form (storage/${doc}.json → production) tidak ditemukan.</p>
        </fluent-card>
      </div>
      ${backButtonHtml}
    `;
    container.querySelector('#nxv-explorer-back')?.addEventListener('click', () => gotoExplorerDoc(null));
    return;
  }

  container.innerHTML = `
    <div style="padding: 24px; max-width: 560px; margin: 0 auto;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">Explorer</h2>
      <p style="margin: 0 0 20px 0; color: var(--beranda-dv-text-muted);">${data.deskripsi || ''}</p>

      <div id="nx-upload-progress" hidden style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; color: var(--beranda-dv-text-muted);">
          <span id="nx-upload-progress-label">Mengunggah…</span>
          <span id="nx-upload-progress-percent">0%</span>
        </div>
        <fluent-progress id="nx-upload-progress-bar" value="0" min="0" max="100" style="width: 100%;"></fluent-progress>
      </div>

      <div id="nx-generated-form-host"></div>
    </div>
    ${backButtonHtml}
  `;

  container.querySelector('#nxv-explorer-back')?.addEventListener('click', () => gotoExplorerDoc(null));

  const formHost = container.querySelector('#nx-generated-form-host');
  const progressWrap = container.querySelector('#nx-upload-progress');
  const progressBar = container.querySelector('#nx-upload-progress-bar');
  const progressPercent = container.querySelector('#nx-upload-progress-percent');
  const progressLabel = container.querySelector('#nx-upload-progress-label');

  const generatedForm = await mountGeneratedForm(formHost, data, {
    onSubmit: (values) => {
      const Notif = new NXUI.Notifikasi({ autoHideDelay: 3000 });

      // file_path adalah field type:"file" di skema — sisanya (title, tgl_dokumen,
      // tgl_upload, tahun, dst) ikut sebagai kolom tambahan via `field`.
      const { file_path, ...rest } = values;

      progressWrap.hidden = false;
      progressBar.value = 0;
      progressPercent.textContent = '0%';
      progressLabel.textContent = 'Mengunggah…';

      NXUI.Storage().cloud().addBackground({
        tabel: data.production.tabel || doc,
        file: file_path,
        userid: 1,
        fieldupload: 'file_path',
        field: rest,
        onProgress: (pct, loaded, total) => {
          progressBar.value = pct;
          progressPercent.textContent = `${pct}%`;
          progressLabel.textContent = `Mengunggah… (${(loaded / 1024 / 1024).toFixed(1)}MB / ${(total / 1024 / 1024).toFixed(1)}MB)`;
        },
        onSuccess: (result) => {
          progressWrap.hidden = true;
          Notif.show({ type: 'success', title: 'Data berhasil disimpan', subtitle: result.url });
          generatedForm.reset();
        },
        onError: (err) => {
          progressWrap.hidden = true;
          Notif.show({ type: 'error', title: 'Gagal menyimpan', subtitle: err.message });
        },
      });
    },
    onReset: () => {
      console.log(`[explorer/${doc}] form direset`);
    },
  });
}
