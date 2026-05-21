// =============================
// ✅ Session 取得（純 function，不做跳轉）
// =============================
function getSession(){

  try{
    const raw = localStorage.getItem('session_user');

    if (!raw) return null;

    const s = JSON.parse(raw);

    // ✅ user_id 不存在 → 當作無效
    if (!s || !s.user_id){
      localStorage.removeItem('session_user');
      return null;
    }

    return s;

  }catch(e){
    localStorage.removeItem('session_user');
    return null;
  }
}


// =============================
// ✅ 安全檢查（只會跳一次）
// =============================
function ensureLogin(){

  const session = getSession();

  if (!session){

    if (!window.__LOGIN_ALERT_SHOWN){
      window.__LOGIN_ALERT_SHOWN = true;

      alert('登入狀態已失效，請重新登入');

      location.replace('login.html');
    }

    return null;
  }

  return session;
}


// =============================
// ✅ 角色解析
// =============================
function getRoles(session){
  if (!session || !session.role) return [];
  return session.role.split(',').map(r => r.trim());
}


// =============================
// ✅ 管理頁門禁
// =============================
function guardAdminPage(){

  const session = ensureLogin();
  if (!session) return;

  const roles = getRoles(session);

  const allowed =
    roles.includes('admin') ||
    roles.includes('chief_judge') ||
    roles.includes('record_chief');

  if (!allowed){
    alert('您沒有管理權限');
    location.replace('index.html');
  }
}


// =============================
// ✅ Header 初始化（顯示名字＋功能）
// =============================
function initHeaderVisibility(){

  const session = ensureLogin();
  if (!session) return;

  const roles = getRoles(session);

  // ✅ 顯示名字（修掉 undefined）
  const nameEl = document.getElementById('u_name');
  if (nameEl){
    nameEl.textContent = session.name || '';
  }

  // ✅ 裁判
  if (
    roles.includes('admin') ||
    roles.includes('judge') ||
    roles.includes('chief_judge')
  ){
    document.querySelectorAll('.nav-judge')
      .forEach(el => el.style.display = 'inline-flex');
  }

  // ✅ 紀錄
  if (
    roles.includes('admin') ||
    roles.includes('record') ||
    roles.includes('record_chief')
  ){
    document.querySelectorAll('.nav-record')
      .forEach(el => el.style.display = 'inline-flex');
  }

  // ✅ 管理
  if (
    roles.includes('admin') ||
    roles.includes('chief_judge') ||
    roles.includes('record_chief')
  ){
    document.querySelectorAll('.nav-admin')
      .forEach(el => el.style.display = 'inline-flex');
  }
}


// =============================
// ✅ 登出
// =============================
function logout(){
  if (!confirm('確定要登出？')) return;

  localStorage.removeItem('session_user'); // ✅ 精準清掉
  location.replace('login.html');
}
