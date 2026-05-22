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

  callApi({
    action:'getSignableGames',
    user_id: session.user_id
  }, res => {

    const games = res.games || [];
    const today = new Date();

    let judgeDone = 0;
    let judgeFuture = 0;
    let recordDone = 0;
    let recordFuture = 0;

    games.forEach(g => {

      if (!g.my_position) return;

      const d = new Date(g.date);

      const isRecord = g.my_position.startsWith('REC');

      if (d < today){
        isRecord ? recordDone++ : judgeDone++;
      } else {
        isRecord ? recordFuture++ : judgeFuture++;
      }
    });

    document.getElementById('stat-judge').textContent = judgeDone + judgeFuture;
    document.getElementById('stat-record').textContent = recordDone + recordFuture;
    document.getElementById('stat-total').textContent =
      judgeDone + judgeFuture + recordDone + recordFuture;

    document.getElementById('stat-judge-sub').textContent =
      `生涯 ${judgeDone}　預計 ${judgeFuture}`;

    document.getElementById('stat-record-sub').textContent =
      `生涯 ${recordDone}　預計 ${recordFuture}`;

    document.getElementById('stat-total-sub').textContent =
      `生涯 ${judgeDone + recordDone}　預計 ${judgeFuture + recordFuture}`;
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

  const d = new Date(g.date);
  const weekday = ['日','一','二','三','四','五','六'][d.getDay()];

  /************* ✅ 裁判（指派 + 報名） *************/
  const judgeList = [
    g.judges.PU,
    g.judges.U1,
    g.judges.U2,
    g.judges.U3
  ].filter(v => v && v !== '');

  /************* ✅ 紀錄（指派 + 報名） *************/
  const recordList = [
    g.records.REC_MAIN,
    g.records.REC_TRAINEE,
    g.records.REC_VIDEO
  ].filter(v => v && v !== '');

  return `
  <div class="card">

    <!-- ✅ 上層 -->
    <div class="top-bar">
      <div class="top-left">
        ${g.date.slice(5)}（${weekday}）
      </div>
      <div class="top-right">
        ${g.field || ''}
      </div>
    </div>

    <!-- ✅ 中央 -->
    <div class="center-info">
      <div class="game-time">${g.time}</div>
      <div class="game-code">${g.game_code}</div>
      <div class="game-category">${g.category || ''}</div>
    </div>

    <!-- ✅ 對戰 -->
    <div class="match-row">
      <div class="team-box">${g.home_team}</div>
      <div class="team-box">${g.away_team}</div>
    </div>

    <!-- ✅ 裁判（有才顯示） -->
    ${
      judgeList.length
      ? `
      <div class="line-header">
        <div>主審</div>
        <div>一壘</div>
        <div>三壘</div>
      </div>
      <div class="line-values">
        <div>${g.judges.PU || ''}</div>
        <div>${g.judges.U1 || ''}</div>
        <div>${g.judges.U3 || ''}</div>
      </div>
      `
      : ''
    }

    <!-- ✅ 紀錄 -->
    ${
      recordList.length
      ? `
      <div class="line-header">
        <div>記錄</div>
        <div>見習</div>
        <div>影像</div>
      </div>
      <div class="line-values">
        <div>${g.records.REC_MAIN || ''}</div>
        <div>${g.records.REC_TRAINEE || ''}</div>
        <div>${g.records.REC_VIDEO || ''}</div>
      </div>
      `
      : ''
    }

  </div>
  `;
}


/*********************************************************
 * ✅ ✅ ✅ 我的班表（補回你功能）
 *********************************************************/
function openMySchedule(){

  const overlay = document.getElementById('schedule-overlay');
  const list = document.getElementById('my-schedule-list');

  if (overlay) overlay.style.display = 'flex';
  if (!list) return;

  list.innerHTML = '載入中...';

  callApi({
    action:'getSignableGames',
    user_id: session.user_id
  }, res => {

    console.log('我的班表 API:', res);

    if (!res || res.result !== 'ok'){
      list.innerHTML = '載入失敗';
      return;
    }

    const games = res.games || [];
    const myName = session.name;

    /************* ✅ 真正安全的「我的班表」判斷 *************/
    const myGames = games.filter(g => {

      // ✅ 用 my_position（主判斷）
      if (g.my_position) return true;

      // ✅ fallback：看名字（避免漏資料）
      const judges = Object.values(g.judges || {});
      const records = Object.values(g.records || {});

      return [...judges, ...records].includes(myName);
    });

    if (!myGames.length){
      list.innerHTML = '目前沒有班表';
      return;
    }

    /************* ✅ 排序（時間） *************/
    myGames.sort((a,b)=>{
      return new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time);
    });

    /************* ✅ render *************/
    list.innerHTML = myGames.map(g => renderGameCard(g)).join('');
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

