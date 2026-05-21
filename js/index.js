/*********************************************************
 * ✅ Index Page（最終整合版）
 *********************************************************/

let session = null;


/*********************************************************
 * ✅ 主入口
 *********************************************************/
document.addEventListener('DOMContentLoaded', () => {

  // ✅ API 檢查
  if (typeof API_BASE === 'undefined'){
    alert('系統錯誤：API設定未載入');
    return;
  }

  // ✅ 登入
  session = initAuth();
  if (!session) return;

  // ✅ Header
  if (window.initHeader){
    initHeader();
  }

  // ✅ Welcome（你原本的）
  renderWelcome();

  // ✅ 綁按鈕（🔥 修你紅框沒反應）
  bindButtons();

  // ✅ 載入統計
  loadDashboard();
});


/*********************************************************
 * ✅ Welcome（保留你原本）
 *********************************************************/
function renderWelcome(){

  const roleMap = {
    admin:'系統管理員',
    chief_judge:'裁判長',
    record_chief:'紀錄長',
    judge:'裁判員',
    record:'紀錄員'
  };

  const nameEl = document.getElementById('welcome-name');
  const roleEl = document.getElementById('welcome-role');

  if (nameEl){
    nameEl.textContent =
      session.name + ' 您好，歡迎使用出勤管理系統';
  }

  if (roleEl){
    roleEl.textContent =
      (session.role || '')
        .split(',')
        .map(r => roleMap[r])
        .filter(Boolean)
        .join('／');
  }
}


/*********************************************************
 * ✅ 綁按鈕（🔥 你壞掉的關鍵）
 *********************************************************/
function bindButtons(){

  document.getElementById('open-schedule')?.addEventListener('click', openMySchedule);
  document.getElementById('open-weekly')?.addEventListener('click', openWeeklySchedule);

  document.getElementById('open-league')?.addEventListener('click', () => {
    document.getElementById('league-overlay').style.display = 'flex';
  });

  document.getElementById('open-rules')?.addEventListener('click', () => {
    document.getElementById('rules-overlay').style.display = 'flex';
  });
}


/*********************************************************
 * ✅ Dashboard
 *********************************************************/
function loadDashboard(){

  loadJudgeCount();
  loadRecordCount();
  loadYearStats();
}


/*********************************************************
 * ✅ 裁判統計
 *********************************************************/
function loadJudgeCount(){

  callApi({
    action: 'getJudgeGamesByMonth',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    user_id: session.user_id
  }, res => {

    console.log('裁判API:', res);   // ✅ debug

    const el = document.getElementById('stat-judge');

    if (!res || res.result !== 'ok'){
      el.textContent = '--';
      return;
    }

    el.textContent = (res.games || []).length;
  });
}


/*********************************************************
 * ✅ 紀錄統計
 *********************************************************/
function loadRecordCount(){

  callApi({
    action: 'getRecordGamesByMonth',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    user_id: session.user_id
  }, res => {

    const el = document.getElementById('stat-record');

    if (!res || res.result !== 'ok'){
      el.textContent = '--';
      return;
    }

    el.textContent = (res.games || []).length;
  });
}


/*********************************************************
 * ✅ 年度統計
 *********************************************************/
function loadYearStats(){

  callApi({
    action: 'getSignableGames',
    user_id: session.user_id
  }, res => {

    const el = document.getElementById('stat-total');

    if (!res || res.result !== 'ok'){
      el.textContent = '--';
      return;
    }

    let count = 0;

    (res.games || []).forEach(g=>{
      if (g.my_position) count++;
    });

    el.textContent = count;
  });
}

/*********************************************************
 * ✅ ✅ ✅ 班表共用核心
 *********************************************************/
function renderGameCard(g){

  // ✅ 安全日期
  const dateText = (g.date || '').replace(/-/g,'/');

  // ✅ 裁判欄位（你要自己對你的 API）
  const judges = [
    g.PU || g.judge1,
    g.U1 || g.judge2,
    g.U2 || g.judge3,
    g.U3 || g.judge4
  ].filter(Boolean);

  let judgeRow = '';

  if (judges.length === 0){
    judgeRow = `<div style="padding:6px 0;">本場不需要裁判</div>`;
  } else {

    const roleOrder = [
      ['PU'],
      ['PU','U1'],
      ['PU','U1','U3'],
      ['PU','U1','U2','U3']
    ][judges.length - 1];

    judgeRow = `
      <div class="row-line header">
        ${roleOrder.map(r=>`<div class="col">${r}</div>`).join('')}
      </div>
      <div class="row-line values">
        ${roleOrder.map((r,i)=>`<div class="col">${judges[i] || ''}</div>`).join('')}
      </div>
    `;
  }

  // ✅ 記錄（固定3格）
  const recordRow = `
    <div class="row-line header">
      <div class="col">記錄</div>
      <div class="col">見習</div>
      <div class="col">影像</div>
    </div>
    <div class="row-line values">
      <div class="col">${g.REC || ''}</div>
      <div class="col">${g.TRAINEE || ''}</div>
      <div class="col">${g.VIDEO || ''}</div>
    </div>
  `;

  return `
  <div class="weekly-card">

    <div class="schedule-line-1">
      ${dateText} ${g.game_code}
    </div>

    <div class="schedule-line-2">
      ${g.home || ''} <span>vs</span> ${g.away || ''}
    </div>

    <div class="game-field">
      📍 ${g.field || ''}
    </div>

    <div class="section">
      <div class="label">裁判</div>
      ${judgeRow}
    </div>

    <div class="section">
      <div class="label">紀錄</div>
      ${recordRow}
    </div>

  </div>
  `;
}


/*********************************************************
 * ✅ ✅ ✅ 我的班表（補回你功能）
 *********************************************************/
function openMySchedule(){

  const list = document.getElementById('my-schedule-list');
  list.innerHTML = '載入中...';

  callApi({ action:'getSignableGames' }, res => {

    const today = new Date();

    const myGames = (res.games || []).filter(g => {

      if (!g.my_position) return false;

      const d = parseDate(g.date);
      return d >= today;

    });

    list.innerHTML = myGames.map(renderGameCard).join('');
  });
}

/*********************************************************
 * ✅ ✅ ✅ 本週聯盟班表（補回你功能）
 *********************************************************/
function openWeeklySchedule(){

  const content = document.getElementById('weeklyContent');
  content.innerHTML = '載入中...';

  callApi({ action:'getSignableGames' }, res => {

    const now = new Date();
    const day = now.getDay() === 0 ? 7 : now.getDay();

    const monday = new Date(now);
    monday.setDate(now.getDate() - (day - 1));

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const weekGames = (res.games || []).filter(g => {
      const d = parseDate(g.date);
      return d >= monday && d <= sunday;
    });

    content.innerHTML = weekGames.map(renderGameCard).join('');
  });
}
