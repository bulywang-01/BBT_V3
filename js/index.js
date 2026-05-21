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

  callApi({ action:'getSignableGames' }, res => {

    if (!res || res.result !== 'ok') return;

    const games = res.games || [];
    const today = new Date();

    let judgeDone = 0;
    let judgeFuture = 0;

    let recordDone = 0;
    let recordFuture = 0;

    games.forEach(g => {

      if (!g.my_position) return;

      const d = parseDate(g.date);
      if (!d) return;

      const isRecord = ['REC','TRAINEE','VIDEO'].includes(g.my_position);

      if (d < today){
        isRecord ? recordDone++ : judgeDone++;
      } else {
        isRecord ? recordFuture++ : judgeFuture++;
      }
    });

    // ✅ 更新 UI
    document.getElementById('stat-judge').textContent = judgeDone + judgeFuture;
    document.getElementById('stat-record').textContent = recordDone + recordFuture;
    document.getElementById('stat-total').textContent =
      judgeDone + judgeFuture + recordDone + recordFuture;

    // ✅ ✅ ✅ 子文字（你要的 生涯 / 預計）
    document.getElementById('stat-judge-sub').innerHTML =
      `生涯 ${judgeDone}　預計 ${judgeFuture}`;

    document.getElementById('stat-record-sub').innerHTML =
      `生涯 ${recordDone}　預計 ${recordFuture}`;

    document.getElementById('stat-total-sub').innerHTML =
      `生涯 ${judgeDone+recordDone}　預計 ${judgeFuture+recordFuture}`;
  });
}

/*********************************************************
 * ✅ 時間格式
 *********************************************************/
function parseDate(str){
  if (!str) return null;

  // ✅ 統一 yyyy/mm/dd
  const s = str.replace(/-/g,'/');
  const d = new Date(s);

  return isNaN(d) ? null : d;
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

  // ✅ 排序（固定位置）
  const judgeOrder = ['PU','U1','U2','U3'];

  const judgeList = judgeOrder.map(r => g.judges?.[r] || '');

  const judgeCount = judgeList.filter(Boolean).length;

  let judgeHTML = '';

  if (judgeCount === 0){
    judgeHTML = `<div style="padding:6px 0;">本場不需要裁判</div>`;
  } else {

    const roleMap = {
      1: ['PU'],
      2: ['PU','U1'],
      3: ['PU','U1','U3'],
      4: ['PU','U1','U2','U3']
    };

    const roles = roleMap[judgeCount];

    judgeHTML = `
      <div class="row-line header">
        ${roles.map(r=>`<div class="col">${r === 'PU' ? '主審' : r}</div>`).join('')}
      </div>
      <div class="row-line values">
        ${roles.map(r=>`<div class="col">${g.judges[r] || ''}</div>`).join('')}
      </div>
    `;
  }

  // ✅ 紀錄（固定三格）
  const recordHTML = `
    <div class="row-line header">
      <div class="col">記錄</div>
      <div class="col">見習</div>
      <div class="col">影像</div>
    </div>
    <div class="row-line values">
      <div class="col">${g.records?.REC_MAIN || ''}</div>
      <div class="col">${g.records?.REC_TRAINEE || ''}</div>
      <div class="col">${g.records?.REC_VIDEO || ''}</div>
    </div>
  `;

  return `
  <div class="weekly-card">

    <div class="schedule-line-1">
      ${g.date} ${g.game_code}
    </div>

    <div class="schedule-line-2">
      ${g.home_team} <span>vs</span> ${g.away_team}
    </div>

    <div class="game-field">
      📍 ${g.field}
    </div>

    <div style="font-size:14px;margin-top:4px;">
      ⏰ ${g.time}
    </div>

    <div class="section">
      <div class="label">裁判</div>
      ${judgeHTML}
    </div>

    <div class="section">
      <div class="label">紀錄</div>
      ${recordHTML}
    </div>

  </div>
  `;
}


/*********************************************************
 * ✅ ✅ ✅ 我的班表（補回你功能）
 *********************************************************/
function openMySchedule(){

  const overlay = document.getElementById('schedule-overlay');
  const list = document.getElementById('my-schedule-list');

  overlay.style.display = 'flex';
  list.innerHTML = '載入中...';

  callApi({ action:'getSignableGames' }, res => {

    if (!res || res.result !== 'ok'){
      list.innerHTML = '載入失敗';
      return;
    }

    const today = new Date();

    const myGames = (res.games || []).filter(g => {

      if (!g.my_position) return false;

      const d = parseDate(g.date);
      if (!d) return false;

      return d >= today;   // ✅ 未來
    });

    if (!myGames.length){
      list.innerHTML = '目前沒有未來班表';
      return;
    }

    myGames.sort((a,b)=> parseDate(a.date) - parseDate(b.date));

    list.innerHTML = myGames.map(renderGameCard).join('');
  });
}


/*********************************************************
 * ✅ ✅ ✅ 本週聯盟班表（補回你功能）
 *********************************************************/
function openWeeklySchedule(){

  const overlay = document.getElementById('weekly-overlay');
  const content = document.getElementById('weeklyContent');

  overlay.style.display = 'flex';
  content.innerHTML = '載入中...';

  callApi({ action:'getSignableGames' }, res => {

    if (!res || res.result !== 'ok'){
      content.innerHTML = '載入失敗';
      return;
    }

    const now = new Date();
    const day = now.getDay() === 0 ? 7 : now.getDay();

    const monday = new Date(now);
    monday.setDate(now.getDate() - (day - 1));
    monday.setHours(0,0,0,0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);

    const weekGames = (res.games || []).filter(g => {
      const d = parseDate(g.date);
      return d && d >= monday && d <= sunday;
    });

    content.innerHTML = weekGames.map(renderGameCard).join('');
  });
}

