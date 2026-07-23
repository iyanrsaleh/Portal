/*
 * Rute: oauth
 * Terdaftar di routing.js (action: 'oauth').
 *
 * Entry point yang switch antar 3 sub-view: Sign In (default, di file ini),
 * Sign Up (./oauth/signup.js), Forgot Password (./oauth/forgot.js). Sub-view
 * tidak didaftarkan di routing.js/ROUTES karena bukan menu sidebar — cukup
 * dynamic-import dari sini, dipicu link internal (lihat renderSignIn).
 *
 * Tampilan pakai komponen Fluent (fluent-text-field, fluent-checkbox,
 * fluent-button) — bukan NexaWild/collectFormData, karena field itu custom
 * element yang menyimpan <input> asli di dalam SHADOW DOM sendiri;
 * querySelectorAll('input', ...) milik NexaWild tidak menembus shadow DOM
 * sehingga tidak akan menemukan value-nya. Validasi & ambil value dilakukan
 * manual lewat property .value tiap komponen Fluent.
 *
 * Logic login & penyimpanan sesi mengikuti templates/nxvisual/exsampel_signin.js
 * PERSIS (bukan fetch manual): NXUI.Storage().models('Oauth').signin(formData)
 * memanggil class PHP lewat endpoint models generik (lihat NexaStorage.js —
 * payload di-encrypt via nexaEncrypt sebelum dikirim), jadi tidak bisa
 * direimplementasikan dengan fetch() biasa tanpa merusak kontrak
 * enkripsi/format yang dipakai backend. Ekstensi ini jalan di window/document
 * yang sama dengan SPA utama sehingga window.NXUI tersedia di runtime yang sama.
 */

let _viewId = null;

export async function render(container, config) {
  _viewId = config?.viewId || _viewId;
  const view = config?.oauthView || 'signin';

  if (view === 'signup') {
    const { render: renderSignUp } = await import('./oauth/signup.js');
    return renderSignUp(container);
  }
  if (view === 'forgot') {
    const { render: renderForgot } = await import('./oauth/forgot.js');
    return renderForgot(container);
  }
  return renderSignIn(container);
}

/**
 * Ganti sub-view tanpa reload seluruh panel — dipicu link internal.
 * Diekspor supaya oauth/signup.js & oauth/forgot.js bisa pakai link
 * "kembali ke Sign In" / silang antar sub-view tanpa duplikasi logic.
 */
export function gotoOauthView(view) {
  if (!_viewId) return;
  window.dispatchEvent(new CustomEvent('beranda:open-developer-tab', {
    detail: { viewId: _viewId, contentType: 'oauth', oauthView: view },
  }));
}

async function renderSignIn(container) {
  await window.NX.defineFluent(['fluentCard', 'fluentTextField', 'fluentCheckbox', 'fluentButton']);
  container.innerHTML = `
    <div style="padding: 24px; max-width: 800px; margin: 0 auto;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">OAuth</h2>
      <p style="margin: 0 0 24px 0; color: var(--beranda-dv-text-muted);">
        Masuk ke akun Anda.
      </p>
      
      
      <fluent-card style="padding: 24px; max-width: 360px;">
        <form id="nxv-oauth-form">
          <h3 style="margin: 0 0 4px; color: var(--beranda-dv-text);">Masuk ke akun</h3>
          <p style="margin: 0 0 16px; font-size: 13px; color: var(--beranda-dv-text-muted);">
            Silakan masukkan email dan kata sandi Anda.
          </p>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            <fluent-text-field id="nxv-oauth-email" type="email" placeholder="Email" required></fluent-text-field>
            <fluent-text-field id="nxv-oauth-password" type="password" placeholder="Kata sandi" required></fluent-text-field> <div style="display: flex; align-items: center; justify-content: space-between;">
              <fluent-checkbox id="nxv-oauth-remember">Ingat saya</fluent-checkbox>
              <a href="#" id="nxv-oauth-goto-forgot" style="font-size: 13px; color: var(--beranda-dv-accent);">Lupa kata sandi?</a>
            </div>
            <fluent-button id="nxv-oauth-submit" type="submit" appearance="accent" style="width: 100%;">Sign In</fluent-button>
          </div>

          <p id="nxv-oauth-feedback" style="margin: 12px 0 0; font-size: 13px; color: #d13438; display: none;"></p>

          <p style="margin: 16px 0 0; font-size: 13px; color: var(--beranda-dv-text-muted); text-align: center;">
            Belum punya akun? <a href="#" id="nxv-oauth-goto-signup" style="color: var(--beranda-dv-accent);">Daftar</a>
          </p>
        </form>
      </fluent-card>
    </div>
    
  `;

  container.querySelector('#nxv-oauth-goto-forgot').addEventListener('click', (e) => {
    e.preventDefault();
    gotoOauthView('forgot');
  });
  container.querySelector('#nxv-oauth-goto-signup').addEventListener('click', (e) => {
    e.preventDefault();
    gotoOauthView('signup');
  });

  const form = container.querySelector('#nxv-oauth-form');
  const emailField = container.querySelector('#nxv-oauth-email');
  const passwordField = container.querySelector('#nxv-oauth-password');
  const submitBtn = container.querySelector('#nxv-oauth-submit');
  const feedback = container.querySelector('#nxv-oauth-feedback');

  function showError(message) {
    feedback.textContent = message;
    feedback.style.display = '';
  }

  function hideError() {
    feedback.style.display = 'none';
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = emailField.value?.trim();
    const password = passwordField.value?.trim();
    if (!email || !password) {
      showError('Email dan kata sandi wajib diisi.');
      return;
    }

    if (!window.NXUI?.Storage) {
      console.error('[nxvisual/oauth] window.NXUI.Storage tidak tersedia:', window.NXUI);
      showError('NXUI.Storage belum siap — buka dari SPA utama dahulu.');
      return;
    }

    submitBtn.disabled = true;
    try {
      // Sama persis exsampel_signin.js: nx.nexaFormSingINSubmit
      const result = await window.NXUI.Storage().models('Oauth').signin({ email, password });
      const user = result?.data ?? result;

      if (!user || !user.id) {
        showError('Email atau kata sandi salah.');
        return;
      }

      // Simpan credential ke IndexedDB — sama persis dengan exsampel_signin.js
      const avatarLocal = user.avatar
        ? user.avatar.startsWith('http')
          ? user.avatar
          : (window.NEXA?.publik || '') + user.avatar
        : '';
      const _oauthPayload = {
        id: 'oauth',
        key: user.id,
        nama: user.nama,
        avatar: avatarLocal,
        email: user.email,
        password: user.password,
        data: user,
      };
      if (!window.NXUI?.ref) {
        console.error('[nxvisual/oauth] window.NXUI.ref tidak tersedia:', window.NXUI);
        showError('NXUI.ref belum siap — buka dari SPA utama dahulu.');
        return;
      }
      await window.NXUI.ref.set('bucketsStore', _oauthPayload);

      // Beri tahu sidebar.js (kartu profil footer) & home.js supaya render ulang
      // dengan sesi terbaru — tanpa reload aplikasi.
      window.dispatchEvent(new CustomEvent('nxvisual:oauth-changed', { detail: _oauthPayload }));

      hideError();
    } catch (err) {
      console.error('[nxvisual/oauth] error saat submit:', err);
      showError('Error: ' + err.message);
    } finally {
      submitBtn.disabled = false;
    }
  });
}
