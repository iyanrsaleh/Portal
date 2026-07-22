/*
 * Sub-rute OAuth: Sign Up
 *
 * Tampilan pakai komponen Fluent, logic mengikuti referensi
 * templates/nxvisual/oauth/signup.js (versi SPA utama, dashboard_signup) —
 * disederhanakan tanpa NXUI.Form()/route.register karena arsitektur extension
 * berbeda (lihat catatan lengkap di ../oauth.js).
 *
 * - Daftar akun: window.NXUI.Storage().api('register', payload) — endpoint
 *   ORM internal (NexaStorage.js), bukan fetch() manual.
 * - Kirim email token aktivasi: fetch('/nexa-auth/send-activation', ...) —
 *   endpoint REST NYATA (index.js baris ~984), aman dipanggil langsung.
 * - Google Sign-In: window.electronAPI.googleSignin(clientId) — clientId
 *   diambil dari window.__NEXA_ENDPOINT__.googleClientId (disuntik server dari
 *   GOOGLE_CLIENT_ID di .env), BUKAN hardcode seperti referensi asli.
 * - Setelah sukses: TIDAK redirect (tidak ada halaman "workspace" di extension
 *   ini) — cukup tampilkan pesan sukses, simpan sesi ke bucketsStore, dan
 *   pancarkan event nxvisual:oauth-changed (sama pola ../oauth.js) supaya
 *   sidebar/home ikut update tanpa reload aplikasi.
 */

export async function render(container) {
  await window.NX.defineFluent(['fluentCard', 'fluentTextField', 'fluentButton']);

  let googleData = null; // data sementara dari Google OAuth, sebelum submit form

  container.innerHTML = `
    <div style="padding: 24px; max-width: 800px; margin: 0 auto;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">Daftar Akun</h2>
      <p style="margin: 0 0 24px 0; color: var(--beranda-dv-text-muted);">
        Lanjutkan dengan Google, atau isi form secara manual.
      </p>

      <fluent-card style="padding: 24px; max-width: 360px;">
        <form id="nxv-signup-form">
          <h3 style="margin: 0 0 4px; color: var(--beranda-dv-text);">Buat akun baru</h3>
          <p style="margin: 0 0 16px; font-size: 13px; color: var(--beranda-dv-text-muted);">
            Isi data diri Anda.
          </p>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            <fluent-text-field id="nxv-signup-nama" placeholder="Nama lengkap" required></fluent-text-field>
            <fluent-text-field id="nxv-signup-email" type="email" placeholder="Email" required></fluent-text-field>
            <fluent-text-field id="nxv-signup-password" type="password" placeholder="Kata sandi" required></fluent-text-field>
            <fluent-button id="nxv-signup-submit" type="submit" appearance="accent" style="width: 100%;">Daftar</fluent-button>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; margin: 16px 0;">
            <div style="flex: 1; height: 1px; background: var(--beranda-dv-header-border);"></div>
            <span style="font-size: 12px; color: var(--beranda-dv-text-faint);">atau</span>
            <div style="flex: 1; height: 1px; background: var(--beranda-dv-header-border);"></div>
          </div>

          <fluent-button id="nxv-signup-google" type="button" appearance="outline" style="width: 100%;">
            Lanjutkan dengan Google
          </fluent-button>

          <p id="nxv-signup-feedback" style="margin: 12px 0 0; font-size: 13px; display: none;"></p>

          <p style="margin: 16px 0 0; font-size: 13px; color: var(--beranda-dv-text-muted); text-align: center;">
            Sudah punya akun? <a href="#" id="nxv-signup-goto-signin" style="color: var(--beranda-dv-accent);">Sign In</a>
          </p>
        </form>
      </fluent-card>
    </div>
  `;

  const { gotoOauthView } = await import('../oauth.js');
  container.querySelector('#nxv-signup-goto-signin').addEventListener('click', (e) => {
    e.preventDefault();
    gotoOauthView('signin');
  });

  const form = container.querySelector('#nxv-signup-form');
  const namaField = container.querySelector('#nxv-signup-nama');
  const emailField = container.querySelector('#nxv-signup-email');
  const passwordField = container.querySelector('#nxv-signup-password');
  const submitBtn = container.querySelector('#nxv-signup-submit');
  const googleBtn = container.querySelector('#nxv-signup-google');
  const feedback = container.querySelector('#nxv-signup-feedback');

  function showFeedback(message, isError) {
    feedback.textContent = message;
    feedback.style.color = isError ? '#d13438' : '#1a7f37';
    feedback.style.display = '';
  }

  // Google Sign-In: pre-fill nama+email lalu kunci (readonly), sisa isi password manual.
  if (window.electronAPI?.googleSignin) {
    googleBtn.addEventListener('click', async () => {
      googleBtn.disabled = true;
      feedback.style.display = 'none';
      try {
        const clientId = window.__NEXA_ENDPOINT__?.googleClientId;
        if (!clientId) {
          showFeedback('Google Client ID belum dikonfigurasi di server.', true);
          return;
        }
        const result = await window.electronAPI.googleSignin(clientId);
        if (!result.ok || !result.user) {
          showFeedback(
            result.error === 'window-closed' ? 'Sign-in dibatalkan.' : `Google error: ${result.error || 'unknown'}`,
            true,
          );
          return;
        }

        const { name, email, picture } = result.user;
        googleData = result.user;

        namaField.value = name;
        namaField.readOnly = true;
        emailField.value = email;
        emailField.readOnly = true;

        showFeedback(`Akun Google dimuat: ${name} (${email}). Buat kata sandi untuk melanjutkan.`, false);
        passwordField.focus();
      } catch (err) {
        showFeedback('Error: ' + err.message, true);
      } finally {
        googleBtn.disabled = false;
      }
    });
  } else {
    // Tidak berjalan di Electron / preload tidak expose googleSignin — sembunyikan tombol.
    googleBtn.style.display = 'none';
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback.style.display = 'none';

    const nama = namaField.value?.trim();
    const email = emailField.value?.trim();
    const password = passwordField.value?.trim();
    if (!nama || !email || !password) {
      showFeedback('Nama, email, dan kata sandi wajib diisi.', true);
      return;
    }

    if (!window.NXUI?.Storage) {
      console.error('[nxvisual/oauth/signup] window.NXUI.Storage tidak tersedia:', window.NXUI);
      showFeedback('NXUI.Storage belum siap — buka dari SPA utama dahulu.', true);
      return;
    }

    submitBtn.disabled = true;
    try {
      const payload = { nama, email, password };
      if (googleData?.picture) payload.avatar = googleData.picture;

      const result = await window.NXUI.Storage().api('register', payload);
      if (!result?.success || !result?.user) {
        showFeedback(result?.message || 'Pendaftaran gagal. Email mungkin sudah terdaftar.', true);
        return;
      }

      const user = result.user;
      const activationToken = user.token || user.licenses || user.license_key || user.activation_token || '';

      showFeedback(`Pendaftaran berhasil! Cek email ${user.email} untuk token aktivasi.`, false);

      if (user.email && activationToken) {
        try {
          const mailRes = await fetch('/nexa-auth/send-activation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama: user.nama, email: user.email, token: activationToken }),
          });
          const mailJson = await mailRes.json().catch(() => ({}));
          if (!mailRes.ok || mailJson.success === false) {
            showFeedback(mailJson.message || 'Pendaftaran berhasil, tapi email aktivasi gagal terkirim.', true);
          }
        } catch (mailErr) {
          showFeedback('Pendaftaran berhasil, tapi server email tidak dapat dihubungi.', true);
        }
      }

      // Simpan sesi & beri tahu sidebar.js/home.js — tanpa redirect (lihat catatan
      // kepala file: tidak ada halaman "workspace" di extension ini).
      const avatarLocal = user.avatar
        ? user.avatar.startsWith('http')
          ? user.avatar
          : (window.NEXA?.publik || '') + user.avatar
        : (googleData?.picture ?? '');
      const _signupPayload = {
        id: 'oauth',
        key: user.id,
        nama: user.nama,
        avatar: avatarLocal,
        email: user.email,
        data: user,
      };
      if (window.NXUI?.ref) {
        await window.NXUI.ref.set('bucketsStore', _signupPayload);
        window.dispatchEvent(new CustomEvent('nxvisual:oauth-changed', { detail: _signupPayload }));
      }
    } catch (err) {
      console.error('[nxvisual/oauth/signup] error:', err);
      showFeedback('Error: ' + err.message, true);
    } finally {
      submitBtn.disabled = false;
    }
  });
}
