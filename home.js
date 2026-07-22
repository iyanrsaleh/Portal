/*
 * Rute: home
 * Terdaftar di routing.js (action: 'home').
 *
 * Menampilkan sesi oauth aktif (tersimpan lewat oauth.js via
 * NXUI.ref.set('bucketsStore', ...)) jika user sudah login — data lengkap
 * dari oauth.data (backend), dipisah jadi beberapa card per kelompok info
 * (gaya halaman Account Windows 11 Settings), bukan satu blok panjang.
 */

function row(label, value) {
  if (!value) return '';
  return `
    <div style="display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--beranda-dv-header-border);">
      <span style="font-size: 12px; color: var(--beranda-dv-text-faint);">${label}</span>
      <span style="font-size: 12px; color: var(--beranda-dv-text); text-align: right;">${value}</span>
    </div>
  `;
}

function sectionLabel(text, iconSrc) {
  return `
    <p style="display: flex; align-items: center; gap: 6px; margin: 0 0 8px 2px; font-size: 12px; font-weight: 600; color: var(--beranda-dv-text-faint); text-transform: uppercase; letter-spacing: 0.03em;">
      ${iconSrc ? `<img src="${iconSrc}" alt="" style="width: 14px; height: 14px; object-fit: contain; opacity: 0.8;" />` : ''}
      ${text}
    </p>
  `;
}

let ICON_SRC = null;

async function readPackageInfo() {
  try {
    const base = new URL('.', import.meta.url).href;
    const res = await fetch(base + 'package.json', { cache: 'no-store' });
    return await res.json();
  } catch {
    return {};
  }
}

export async function render(container) {
  await window.NX.defineFluent(['fluentCard', 'fluentButton']);
  if (!ICON_SRC) ICON_SRC = await import('../Icon.js');

  const pkg = await readPackageInfo();
  const oauth = window.NXUI?.ref ? await window.NXUI.ref.get('bucketsStore', 'oauth') : null;
  const data = oauth?.data || {};

  const lokasi = [data.desa, data.kecamatan, data.kabupaten, data.provinsi].filter(Boolean).join(', ');

  const identitasRows = [
    row('Role', data.role),
    row('Jabatan', data.jabatan),
    row('Instansi', data.instansi),
    row('Telepon', data.telepon),
  ].join('');

  const lokasiRows = [
    row('Alamat', data.alamat),
    row('Lokasi', lokasi),
  ].join('');

  const akunRows = [
    row('Paket', data.package),
    row('Login terakhir', data.login_time),
    row('Aktivitas terakhir', data.last_activity),
    row('User ID', data.id),
    row('Token', data.token),
  ].join('');

  container.innerHTML = `
    <div style="padding: 24px; max-width: 800px; margin: 0 auto;">
      <div style="display: flex; align-items: center; gap: 10px; margin: 0 0 8px 0;">
        <img src="${ICON_SRC.icon_home_small}" alt="" style="width: 24px; height: 24px; object-fit: contain;" />
        <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">${pkg.title || 'nxvisual'}</h2>
        ${pkg.version ? `<span style="font-size: 12px; color: var(--beranda-dv-text-faint);">v${pkg.version}</span>` : ''}
      </div>
      <p style="margin: 0 0 20px 0; color: var(--beranda-dv-text-muted);">
        ${oauth ? 'Ringkasan akun yang sedang masuk.' : 'Masuk untuk melihat ringkasan akun Anda di sini.'}
      </p>

      ${oauth ? `
        <!-- Card 1: header profil -->
        <fluent-card style="padding: 16px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            ${oauth.avatar ? `<img src="${oauth.avatar}" alt="" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; flex: 0 0 auto;" />` : `<img src="${ICON_SRC.icon_user}" alt="" style="width: 56px; height: 56px; border-radius: 50%; object-fit: contain; padding: 8px; background: var(--beranda-dv-hover); flex: 0 0 auto;" />`}
            <div style="min-width: 0;">
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: var(--beranda-dv-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${oauth.nama || '-'}</p>
              <p style="margin: 0; font-size: 12px; color: var(--beranda-dv-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${oauth.email || '-'}</p>
            </div>
          </div>
        </fluent-card>

        ${identitasRows ? `
          <!-- Card 2: identitas -->
          ${sectionLabel('Identitas', ICON_SRC.icon_user)}
          <fluent-card style="padding: 4px 16px; margin-bottom: 20px;">
            ${identitasRows}
          </fluent-card>
        ` : ''}

        ${lokasiRows ? `
          <!-- Card 3: lokasi -->
          ${sectionLabel('Lokasi', ICON_SRC.icon_network_small)}
          <fluent-card style="padding: 4px 16px; margin-bottom: 20px;">
            ${lokasiRows}
          </fluent-card>
        ` : ''}

        <!-- Card 4: akun -->
        ${sectionLabel('Akun', ICON_SRC.icon_settings_about)}
        <fluent-card style="padding: 4px 16px; margin-bottom: 20px;">
          ${akunRows}
        </fluent-card>

        <!-- Card 5: aksi -->

      ` : `
        <fluent-card style="padding: 32px 16px; display: flex; flex-direction: column; align-items: center; gap: 12px;">
          <img src="${ICON_SRC.icon_user}" alt="" style="width: 48px; height: 48px; object-fit: contain; padding: 10px; border-radius: 50%; background: var(--beranda-dv-hover); opacity: 0.8;" />
          <p style="margin: 0; font-size: 13px; color: var(--beranda-dv-text-muted); text-align: center;">
            Belum login. Buka menu OAuth untuk masuk.
          </p>
        </fluent-card>
      `}

   
    </div>
  `;

  container.querySelector('#nxv-home-logout')?.addEventListener('click', async () => {
    if (!window.NXUI?.ref) return;
    await window.NXUI.ref.delete('bucketsStore', 'oauth');
    window.dispatchEvent(new CustomEvent('nxvisual:oauth-changed', { detail: null }));
    await render(container);
  });
}
