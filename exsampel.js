export async function render(container) {
  await window.NX.defineFluent(['fluentCard']);
  const data = await NxStorage('ipkd').catch((err) => {
    console.error('[development] gagal baca storage mscp:', err.message);
    return null;
  });

  container.innerHTML = `
    <div style="padding: 24px; max-width: 800px; margin: 0 auto;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">Development</h2>
      <p style="margin: 0 0 20px 0; color: var(--beranda-dv-text-muted);">Contoh form: teks, file upload, dan textarea.</p>

      <fluent-card style="padding: 16px;">
        <p style="margin: 0; font-size: 13px; color: var(--beranda-dv-text-muted);">Belum ada konten.</p>
      </fluent-card>
    </div>
  `;
}
