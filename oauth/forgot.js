/*
 * Sub-rute OAuth: Forgot Password
 *
 * Tampilan pakai komponen Fluent, logic mengikuti referensi
 * templates/nxvisual/oauth/forgot.js (versi SPA utama, dashboard_forgot) —
 * disederhanakan tanpa NXUI.Form()/route.register karena arsitektur extension
 * berbeda (lihat catatan lengkap di ../oauth.js).
 *
 * - Cari email terdaftar & reset password: window.NXUI.Storage().api('forgot', { email })
 *   — endpoint ORM internal (NexaStorage.js), bukan fetch() manual.
 * - Kirim email berisi password sementara: fetch('/nexa-auth/send-reset', ...)
 *   — endpoint REST NYATA (index.js baris ~1015), aman dipanggil langsung.
 */

export async function render(container) {
  await window.NX.defineFluent(['fluentCard', 'fluentTextField', 'fluentButton']);

  container.innerHTML = `
    <div style="padding: 24px; max-width: 800px; margin: 0 auto;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">Lupa Kata Sandi</h2>
      <p style="margin: 0 0 24px 0; color: var(--beranda-dv-text-muted);">
        Masukkan email terdaftar Anda.
      </p>

      <fluent-card style="padding: 24px; max-width: 360px;">
        <form id="nxv-forgot-form">
          <h3 style="margin: 0 0 4px; color: var(--beranda-dv-text);">Reset kata sandi</h3>
          <p style="margin: 0 0 16px; font-size: 13px; color: var(--beranda-dv-text-muted);">
            Kami akan mengirim kata sandi sementara ke email Anda.
          </p>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            <fluent-text-field id="nxv-forgot-email" type="email" placeholder="Email terdaftar" required></fluent-text-field>
            <fluent-button id="nxv-forgot-submit" type="submit" appearance="accent" style="width: 100%;">Kirim kata sandi sementara</fluent-button>
          </div>

          <p id="nxv-forgot-feedback" style="margin: 12px 0 0; font-size: 13px; display: none;"></p>

          <p style="margin: 16px 0 0; font-size: 13px; color: var(--beranda-dv-text-muted); text-align: center;">
            Ingat kata sandi? <a href="#" id="nxv-forgot-goto-signin" style="color: var(--beranda-dv-accent);">Sign In</a>
          </p>
        </form>
      </fluent-card>
    </div>
  `;

  const { gotoOauthView } = await import('../oauth.js');
  container.querySelector('#nxv-forgot-goto-signin').addEventListener('click', (e) => {
    e.preventDefault();
    gotoOauthView('signin');
  });

  const form = container.querySelector('#nxv-forgot-form');
  const emailField = container.querySelector('#nxv-forgot-email');
  const submitBtn = container.querySelector('#nxv-forgot-submit');
  const feedback = container.querySelector('#nxv-forgot-feedback');

  function showFeedback(message, isError) {
    feedback.textContent = message;
    feedback.style.color = isError ? '#d13438' : '#1a7f37';
    feedback.style.display = '';
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback.style.display = 'none';

    const email = emailField.value?.trim();
    if (!email) {
      showFeedback('Email wajib diisi.', true);
      return;
    }

    if (!window.NXUI?.Storage) {
      console.error('[nxvisual/oauth/forgot] window.NXUI.Storage tidak tersedia:', window.NXUI);
      showFeedback('NXUI.Storage belum siap — buka dari SPA utama dahulu.', true);
      return;
    }

    submitBtn.disabled = true;
    try {
      const result = await window.NXUI.Storage().api('forgot', { email });
      if (!result?.success) {
        showFeedback(result?.message || 'Email tidak ditemukan.', true);
        return;
      }

      const targetEmail = result.email ?? email;
      showFeedback(`Mengirim kata sandi sementara ke ${targetEmail}…`, false);

      const mailRes = await fetch('/nexa-auth/send-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: result.nama ?? targetEmail,
          email: targetEmail,
          password: result.password,
        }),
      });
      const mailJson = await mailRes.json().catch(() => ({}));
      const mailOk = mailRes.ok && mailJson.success !== false;

      if (mailOk) {
        showFeedback(`Kata sandi sementara telah dikirim ke ${targetEmail}. Cek folder Spam/Promosi jika tidak ada di Inbox.`, false);
      } else {
        showFeedback(`Kata sandi direset, tapi email ke ${targetEmail} gagal terkirim. ${mailJson.message || ''}`.trim(), true);
      }
    } catch (err) {
      console.error('[nxvisual/oauth/forgot] error:', err);
      showFeedback('Error: ' + err.message, true);
    } finally {
      submitBtn.disabled = false;
    }
  });
}
