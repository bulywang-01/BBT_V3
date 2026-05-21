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
 * ✅ ✅ ✅ 我的班表（補回你功能）
 *********************************************************/
function openMySchedule(){

  const overlay = document.getElementById('schedule-overlay');
  const list = document.getElementById('my-schedule-list');

  overlay.style.display = 'flex';
  list.innerHTML = '載入中...';

  callApi({
    action:'getSignableGames'
  }, res => {

    if (!res || res.result !== 'ok'){
      list.innerHTML = '載入失敗';
      return;
    }

    const games = res.games || [];
    const today = new Date();

    // ✅ ✅ ✅ 我的 + 未來
    const myGames = games.filter(g => {
      if (!g.my_position) return false;

      const d = new Date(g.date);
      return d >= today;
    });

    if (!myGames.length){
      list.innerHTML = '目前沒有未來班表';
      return;
    }

    // ✅ 排序（最近的在前）
    myGames.sort((a,b)=> new Date(a.date) - new Date(b.date));

    list.innerHTML = myGames.map(g => {

      const roleMap = {
        PU:'主審',
        U1:'一壘審',
        U2:'二壘審',
        U3:'三壘審',
        REC:'記錄'
      };

      return `
      <div class="weekly-card">

        <div class="game-line-1">
          <span class="date">${g.date}</span>
          <span class="code">${g.game_code}</span>
        </div>

        <div class="game-line-2">
          ${g.home || ''} <span>vs</span> ${g.away || ''}
        </div>

        <div class="game-field">
          📍 ${g.field || ''}
        </div>

        <div style="margin-top:6px;color:#2563eb;font-weight:700;">
          👉 ${roleMap[g.my_position] || g.my_position}
        </div>

      </div>
      `;
    }).join('');
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

  callApi({
    action:'getSignableGames'
  }, res => {

    if (!res || res.result !== 'ok'){
      content.innerHTML = '載入失敗';
      return;
    }

    const games = res.games || [];

    /************* ✅ 本週（星期一～星期日） *************/
    const now = new Date();
    const day = now.getDay() === 0 ? 7 : now.getDay();

    const monday = new Date(now);
    monday.setDate(now.getDate() - (day - 1));
    monday.setHours(0,0,0,0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);

    const weekGames = games.filter(g=>{
      const d = new Date(g.date);
      return d >= monday && d <= sunday;
    });

    if (!weekGames.length){
      content.innerHTML = '本週無賽事';
      return;
    }

    /************* ✅ render *************/
    content.innerHTML = weekGames.map(g => {

      // ✅ 裁判（依人數決定）
      const judges = [
        g.PU,
        g.U1,
        g.U2,
        g.U3
      ].filter(Boolean);

      let judgeText = '';

      if (judges.length === 0){
        judgeText = '<div class="no-judge">本場不需要裁判</div>';
      }else{

        const orderMap = {
          1: ['PU'],
          2: ['PU','U1'],
          3: ['PU','U1','U3'],
          4: ['PU','U1','U2','U3']
        };

        const order = orderMap[judges.length];

        judgeText = `
          <div class="row-line header">
            ${order.map(r=>`<div class="col">${r}</div>`).join('')}
          </div>
          <div class="row-line values">
            ${order.map(r=>`<div class="col">${g[r] || ''}</div>`).join('')}
          </div>
        `;
      }

      // ✅ 紀錄（固定3格）
      const recordText = `
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

        <div class="game-line-1">
          <span class="date">${g.date}</span>
          <span class="code">${g.game_code}</span>
        </div>

        <div class="game-line-2">
          ${g.home || ''} <span>vs</span> ${g.away || ''}
        </div>

        <div class="game-field">
          📍 ${g.field || ''}
        </div>

        <div class="section">
          <div class="label">裁判</div>
          ${judgeText}
        </div>

        <div class="section">
          <div class="label">紀錄</div>
          ${recordText}
        </div>

      </div>
      `;
    }).join('');
  });
}
