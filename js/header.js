// ✅ header.js（產品級乾淨版）

window.initHeader = function () {

  // ✅ 用統一入口（你剛修好的）
  const session = (typeof ensureLogin === 'function')
    ? ensureLogin()
    : null;

  if (!session) return;

  // ✅ body role 控制（跟 header.html CSS 配合）
  document.body.classList.remove(
    'role-admin',
    'role-judge',
    'role-record'
  );

  const roles = (session.role || '').split(',').map(r => r.trim());

  if (roles.includes('admin')) {
    document.body.classList.add('role-admin');
  }

  if (roles.includes('judge') || roles.includes('chief_judge')) {
    document.body.classList.add('role-judge');
  }

  if (roles.includes('record') || roles.includes('record_chief')) {
    document.body.classList.add('role-record');
  }

  // ✅ ✅ ✅ 顯示名字（修 undefined）
  const nameEl = document.getElementById('header-username');
  if (nameEl){
    nameEl.textContent = session.name || '';
  }
};
