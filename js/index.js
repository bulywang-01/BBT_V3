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
    action:'getSignableGames',   // ✅ 改這支（拿全資料）
    user_id: session.user_id
  }, res => {

    if (!res || res.result !== 'ok'){
      list.innerHTML = '載入失敗';
      return;
    }

    const games = res.games || [];

    // ✅ ✅ ✅ 只保留「有參與」的
    const myGames = games.filter(g => g.my_position);

    if (!myGames.length){
      list.innerHTML = '目前沒有班表';
      return;
    }

    // ✅ ✅ ✅ 統計
    let completed = 0;
    let upcoming = 0;

    const today = new Date();

    myGames.forEach(g=>{
      const gameDate = new Date(g.date || g.game_date || '');

      if (gameDate < today){
        completed++;
      }else{
        upcoming++;
      }
    });

    // ✅ ✅ ✅ UI render（完整）
    list.innerHTML = myGames.map(g => {

      const roleName = {
        'PU':'主審',
        'U1':'一壘審',
        'U2':'二壘審',
        'U3':'三壘審',
        'REC':'記錄'
      };

      return `
      <div class="weekly-card">

        <div class="game-code">${g.game_code || ''}</div>

        <div class="game-match">
          ${g.home || ''} <span>vs</span> ${g.away || ''}
        </div>

        <div class="game-time">
          ${g.date || g.game_date || ''}
        </div>

        <div class="game-field">
          📍 ${g.field || ''}
        </div>

        <div style="margin-top:6px;font-size:13px;color:#2563eb;font-weight:700;">
          👉 ${roleName[g.my_position] || g.my_position}
        </div>

      </div>
      `;

    }).join('') +
    
    // ✅ ✅ ✅ 底下統計（你要的）
    `
    <div style="
      text-align:center;
      margin-top:10px;
      font-size:14px;
      font-weight:700;
      color:#374151;
    ">
      生涯 ${completed}　預計 ${upcoming}
    </div>
    `;
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

    if (!games.length){
      content.innerHTML = '本週無賽事';
      return;
    }
      content.innerHTML = games.map(g => {
        return `
        <div class="weekly-card">
      
          <div class="game-code">${g.game_code || ''}</div>
          <div class="game-group">${g.group || ''}</div>
      
          <div class="game-match">
            ${g.teamA || ''} <span>vs</span> ${g.teamB || ''}
          </div>
      
          <div class="game-time">
            ${g.date || ''} ${g.time || ''}
          </div>
      
          <div class="game-field">
            📍 ${g.field || ''}
          </div>
      
        </div>
        `;
      }).join('');
  });
}
