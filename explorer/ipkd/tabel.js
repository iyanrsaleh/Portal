/*
 * Tampilan tabel dokumen "ipkd" — dipanggil oleh ../index.js (renderDocForView)
 * lewat import('./ipkd/tabel.js'), menerima `data` (hasil NxStorage('ipkd'))
 * yang sudah di-fetch di sana (tidak perlu fetch ulang di sini).
 *
 * File ini BERDIRI SENDIRI (bukan import balik dari ../index.js) — sengaja
 * mulai sebagai salinan logic generik (tableBuilder.js + columnsFromSchema),
 * supaya bisa diubah bebas kapan saja KHUSUS untuk ipkd (kolom, aksi, format
 * sel, filter, dll) tanpa menyentuh mscp atau dokumen lain sama sekali.
 */

export async function render(container, data) {
  const { mountGeneratedTable, columnsFromSchema } = await import('../../../helper/tableBuilder.js');
  const ICON_SRC = await import('../../../Icon.js');
  const { gotoExplorerDoc } = await import('../index.js');
  await window.NX.defineFluent(['fluentCard']);

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
      <div style="padding: 24px; max-width: 95%; margin: 0 auto;">
        <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">ipkd</h2>
        <fluent-card style="padding: 16px;">
          <p style="margin: 0; font-size: 13px; color: var(--beranda-dv-text-muted);">Skema tabel (storage/ipkd.json → production) tidak ditemukan.</p>
        </fluent-card>
      </div>
      ${backButtonHtml}
    `;
    container.querySelector('#nxv-explorer-back')?.addEventListener('click', () => gotoExplorerDoc(null));
    return;
  }

  container.innerHTML = `
    <div style="padding: 24px; max-width:  95%; margin: 0 auto;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">${data.appname || 'ipkd'}</h2>
      <p style="margin: 0 0 20px 0; color: var(--beranda-dv-text-muted);">${data.deskripsi || ''}</p>
      <div id="nx-generated-table-host"></div>
    </div>
    ${backButtonHtml}
  `;

  container.querySelector('#nxv-explorer-back')?.addEventListener('click', () => gotoExplorerDoc(null));

  const host = container.querySelector('#nx-generated-table-host');
  const columns = columnsFromSchema(data);

  await mountGeneratedTable(host, {
    source: data,
    columns,
    pageSize: 10,
    filterField: 'tahun',
    actions: { view: true, edit: true, delete: true },
    onAction: (action, row) => {
      console.log('[explorer/ipkd] row action:', action, row);
    },
    export: {
      enabled: true,
      types: ['csv', 'json', 'xlsx', 'pdf'],
      fileName: 'ipkd',
    },
  });
}
