/*
 * Tampilan form dokumen "mscp" — dipanggil oleh ../index.js (renderDocForView)
 * lewat import('./mscp/form.js'), menerima `data` (hasil NxStorage('mscp'))
 * yang sudah di-fetch di sana (tidak perlu fetch ulang di sini).
 *
 * File ini BERDIRI SENDIRI (bukan import balik dari ../index.js) — sengaja
 * mulai sebagai salinan logic generik (formBuilder.js + NXUI.Storage().cloud()
 * upload), supaya bisa diubah bebas kapan saja KHUSUS untuk mscp (validasi,
 * field tambahan, alur submit, dll) tanpa menyentuh ipkd atau dokumen lain.
 */

export async function render(container, data) {
  const { mountGeneratedForm } = await import('../../../helper/formBuilder.js');
  const ICON_SRC = await import('../../../Icon.js');
  const { gotoExplorerDoc } = await import('../index.js');
  await window.NX.defineFluent(['fluentProgress', 'fluentButton', 'fluentCard']);

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
        <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">mscp</h2>
        <fluent-card style="padding: 16px;">
          <p style="margin: 0; font-size: 13px; color: var(--beranda-dv-text-muted);">Skema form (storage/mscp.json → production) tidak ditemukan.</p>
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
        tabel: data.production.tabel || 'mscp',
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
      console.log('[explorer/mscp] form direset');
    },
  });
}
