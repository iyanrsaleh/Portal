/*
 * Rute: settings
 * Terdaftar di routing.js (action: 'settings').
 *
 * Form ini mengganti urlApi, drive, dan NXAPI di config.js server —
 * lewat endpoint asli aplikasi POST /nexa-config/update (index.js baris ~1009),
 * bukan menulis file config.js secara manual. Endpoint ini menerima satu base
 * URL lalu menurunkan ketiga field (urlApi = base/api, drive = base/assets/drive,
 * NXAPI = base/nxapi) dan langsung diterapkan ke config server yang sedang
 * berjalan (tanpa restart). Ini mengubah konfigurasi SISTEM, bukan hanya
 * milik extension ini — dampaknya berlaku ke seluruh aplikasi.
 *
 * Nilai endpoint saat ini tidak ditulis sebagai value/teks info di UI —
 * hanya dipakai sebagai placeholder (hint pudar, hilang saat mulai mengetik)
 * supaya user tahu origin yang sedang aktif tanpa itu tampil sebagai info tetap.
 *
 * window.__NEXA_ENDPOINT__ TIDAK bisa dipakai untuk ini — nilainya selalu
 * dinormalisasi ke origin same-origin proxy (lihat buildClientEndpointPayload
 * di index.js), bukan origin asli. Origin asli diambil dari endpoint server
 * GET /nexa-config/current-origin (baca config.NXAPI langsung, tanpa normalisasi).
 */

export async function render(container) {
  await window.NX.defineFluent(['fluentCard', 'fluentTextField', 'fluentButton']);

  container.innerHTML = `
    <div style="padding: 24px; max-width: 800px; margin: 0 auto;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">Settings</h2>
      <p style="margin: 0 0 24px 0; color: var(--beranda-dv-text-muted);">
        Konfigurasi extension Anda.
      </p>

      <fluent-card style="padding: 16px; display: flex; flex-direction: column; gap: 12px; max-width: 480px;">
        <div>
          <label for="nxv-base-url" style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: var(--beranda-dv-text);">
            Base URL Backend
          </label>
          <fluent-text-field id="nxv-base-url" placeholder="https://domain.com" style="width: 100%;"></fluent-text-field>
        </div>

        <div style="display: flex; gap: 8px; align-items: center;">
          <fluent-button id="nxv-save-endpoint" appearance="accent">Simpan</fluent-button>
          <span id="nxv-endpoint-status" style="font-size: 12px; color: var(--beranda-dv-text-muted);"></span>
        </div>
      </fluent-card>
    </div>
  `;

  const input = container.querySelector('#nxv-base-url');
  const saveBtn = container.querySelector('#nxv-save-endpoint');
  const status = container.querySelector('#nxv-endpoint-status');

  fetch('/nexa-config/current-origin')
    .then((r) => r.json())
    .then((data) => {
      if (data?.origin) input.setAttribute('placeholder', data.origin);
    })
    .catch(() => {});

  function showStatus(text, isError) {
    status.textContent = text;
    status.style.color = isError ? '#d13438' : 'var(--beranda-dv-text-muted)';
  }

  saveBtn.addEventListener('click', async () => {
    const endpoint = input.value.trim();
    if (!endpoint) {
      showStatus('Base URL wajib diisi.', true);
      return;
    }

    saveBtn.disabled = true;
    showStatus('Menyimpan...', false);
    try {
      const res = await fetch('/nexa-config/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || `HTTP ${res.status}`);
      }

      input.value = '';
      showStatus('Tersimpan.', false);
    } catch (err) {
      showStatus('Gagal: ' + err.message, true);
    } finally {
      saveBtn.disabled = false;
    }
  });
}
