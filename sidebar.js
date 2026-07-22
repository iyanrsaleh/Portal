// Nama icon merujuk ke variabel export di templates/Icon.js (data URI base64) —
// di-render sebagai <img>, bukan lagi font-icon Material Symbols.
let ICON_SRC = null;

async function loadIconSrc() {
  if (!ICON_SRC) ICON_SRC = await import('../Icon.js');
  return ICON_SRC;
}

function iconImg(iconKey, extraClass = 'nxv-sidebar__item-icon') {
  const src = ICON_SRC?.[iconKey] || '';
  return `<img src="${src}" alt="" class="${extraClass}" />`;
}

function renderProfileFooter(oauth) {
  if (!oauth) {
    return `
      <div class="nxv-sidebar__profile nxv-sidebar__profile--empty">
        ${iconImg('icon_user', 'nxv-sidebar__profile-avatar nxv-sidebar__profile-avatar--placeholder')}
        <span class="nxv-sidebar__profile-name">Belum login</span>
      </div>
    `;
  }
  return `
    <div class="nxv-sidebar__profile">
      ${oauth.avatar ? `<img src="${oauth.avatar}" alt="" class="nxv-sidebar__profile-avatar" />` : iconImg('icon_user', 'nxv-sidebar__profile-avatar nxv-sidebar__profile-avatar--placeholder')}
      <div class="nxv-sidebar__profile-info">
        <span class="nxv-sidebar__profile-name">${oauth.nama || '-'}</span>
        <span class="nxv-sidebar__profile-email">${oauth.email || '-'}</span>
      </div>
    </div>
  `;
}

/**
 * Key localStorage yang sama dipakai templates/source.js (LAST_TAB_KEY_PREFIX)
 * untuk memulihkan tab panel aktif setelah refresh — dibaca di sini juga supaya
 * highlight menu sidebar konsisten dengan tab yang benar-benar sedang tampil.
 * `viewId` dioper dari index.js (this.id) — TIDAK di-hardcode 'nxvisual', karena
 * nama folder/id extension bisa berbeda (hasil clone lain, lihat
 * templates/.nexa-clone-meta.json).
 */
function getLastActiveAction(viewId, fallback) {
  try {
    return localStorage.getItem('nx-ext-shell-last-tab:' + viewId) || fallback;
  } catch {
    return fallback;
  }
}

export async function renderSidebar(container, viewId) {
  const { ROUTES, DEFAULT_ACTION } = await import('./routing.js');
  await window.NX.defineFluent(['fluentSearch']);
  await loadIconSrc();

  const activeAction = getLastActiveAction(viewId, DEFAULT_ACTION);
  const oauth = window.NXUI?.ref ? await window.NXUI.ref.get('bucketsStore', 'oauth') : null;

  // Tampilan bergaya Windows 11 Settings: search box + list flat dengan indikator
  // aktif pill aksen (bukan card per-item seperti sidebar app pada umumnya).
  // fluent-search sudah punya ikon kaca pembesar & tombol clear bawaan —
  // lihat referensi templates/fluent/Search.js.
  container.innerHTML = `
    <div class="nxv-sidebar">
    <div class="nxv-sidebar-item">

      <fluent-search id="nxv-search" placeholder="Cari pengaturan" aria-label="Cari menu" class="nxv-sidebar__search"></fluent-search>

      <div class="nxv-sidebar__list" id="nxv-list">
        ${ROUTES.map((item) => `
          <button
            type="button"
            class="nxv-sidebar__item${item.action === activeAction ? ' is-active' : ''}"
            data-action="${item.action}"
            data-label="${item.label.toLowerCase()}"
          >
            ${iconImg(item.icon)}
            <span class="nxv-sidebar__item-label">${item.label}</span>
          </button>
        `).join('')}
      </div>
      </div>
      <p class="nxv-sidebar__empty" id="nxv-empty" hidden>Tidak ada hasil.</p>

      <div class="nxv-sidebar__footer" id="nxv-footer">
        ${renderProfileFooter(oauth)}
      </div>
    </div>
  `;

  const list = container.querySelector('#nxv-list');
  const empty = container.querySelector('#nxv-empty');
  const search = container.querySelector('#nxv-search');
  const footer = container.querySelector('#nxv-footer');

  // oauth.js memancarkan event ini setelah login sukses (bucketsStore berubah) —
  // render ulang kartu profil saja, tanpa reload aplikasi atau sentuh search/list.
  const onOauthChanged = (ev) => {
    if (!footer.isConnected) {
      window.removeEventListener('nxvisual:oauth-changed', onOauthChanged);
      return;
    }
    footer.innerHTML = renderProfileFooter(ev.detail);
  };
  window.addEventListener('nxvisual:oauth-changed', onOauthChanged);

  container.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-action]');
    if (!btn) return;

    container.querySelectorAll('.nxv-sidebar__item').forEach((el) => el.classList.remove('is-active'));
    btn.classList.add('is-active');

    window.dispatchEvent(new CustomEvent('beranda:open-developer-tab', {
      detail: {
        viewId,
        contentType: btn.dataset.action,
      },
    }));
  });

  // Filter list saat mengetik — perilaku khas kotak pencarian Windows 11 Settings.
  search?.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    let visibleCount = 0;
    list.querySelectorAll('.nxv-sidebar__item').forEach((el) => {
      const match = !q || el.dataset.label.includes(q);
      el.hidden = !match;
      if (match) visibleCount += 1;
    });
    empty.hidden = visibleCount !== 0;
  });
}
