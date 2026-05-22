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

  // ✅ 載入本週出勤提醒
  loadWeeklyReminder();

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
 * ✅ 首頁歡迎及出勤提示
 *********************************************************/
function loadWeeklyReminder(){

  const el = document.getElementById('welcome-alert');
  if (!el || !session) return;

  callApi({
    action:'getSignableGames',
    user_id: session.user_id
  }, res => {

    if (!res || res.result !== 'ok') return;

    const games = res.games || [];
    const now = new Date();

    const day = now.getDay() === 0 ? 7 : now.getDay();

    const monday = new Date(now);
    monday.setDate(now.getDate() - (day - 1));
    monday.setHours(0,0,0,0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);

    const hasThisWeek = games.some(g => {
      if (!g.my_position) return false;
      const d = new Date(g.date);
      return d >= monday && d <= sunday;
    });

    // ✅ 只處理提醒（不碰 welcome）
    if (hasThisWeek){
      el.innerHTML = `
        <div class="week-alert" onclick="openMySchedule()">
          🔔 您本週有出勤哦，詳見我的班表
        </div>
      `;
    } else {
      el.innerHTML = '';
    }

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

    if (!res || res.result !== 'ok') return;

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

    /************* ✅ ✅ ✅ 核心修正 *************/
    // 👉 主數字 = 已完成（不是總數）

    document.getElementById('stat-judge').textContent = judgeDone;
    document.getElementById('stat-record').textContent = recordDone;
    document.getElementById('stat-total').textContent =
      judgeDone + recordDone;

    /************* ✅ 子數據 *************/
    document.getElementById('stat-judge-sub').textContent =
      `生 ${judgeDone}　預 ${judgeFuture}`;

    document.getElementById('stat-record-sub').textContent =
      `生 ${recordDone}　預 ${recordFuture}`;

    document.getElementById('stat-total-sub').textContent =
      `生 ${judgeDone + recordDone}　預 ${judgeFuture + recordFuture}`;
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
 * ✅ ✅ ✅ 我的班表（純顯示）
 *********************************************************/
function openMySchedule(){

  const overlay = document.getElementById('schedule-overlay');
  const list = document.getElementById('my-schedule-list');

  if (overlay) overlay.style.display = 'flex';
  if (!list) return;

  renderLoading(list);

  callApi({
    action:'getSignableGames',
    user_id: session.user_id
  }, res => {

    if (!res || res.result !== 'ok'){
      list.innerHTML = '載入失敗';
      return;
    }

    const games = (res.games || []).map(safeMerge);

    const now = new Date();
    now.setHours(23,59,59,999);

    const myGames = games.filter(g=>{
      if (!g.my_position) return false;
      return new Date(g.date + ' ' + g.time) > now;
    });

    if (!myGames.length){
      list.innerHTML = '目前沒有未來班表';
      return;
    }

    myGames.sort((a,b)=>
      new Date(a.date + ' ' + a.time) -
      new Date(b.date + ' ' + b.time)
    );

    list.innerHTML = myGames.map(renderGameCard).join('');
    setGameCache(myGames);
  });
}

/*********************************************************
 * ✅ ✅ ✅ 本週班表（純顯示）
 *********************************************************/
function openWeeklySchedule(){

  const overlay = document.getElementById('weekly-overlay');
  const content = document.getElementById('weeklyContent');

  if (overlay) overlay.style.display = 'flex';
  if (!content) return;

  renderLoading(content);

  callApi({
    action:'getSignableGames',
    user_id: session.user_id
  }, res => {

    if (!res || res.result !== 'ok'){
      content.innerHTML = '載入失敗';
      return;
    }

    const games = (res.games || []).map(safeMerge);

    const now = new Date();
    const day = now.getDay() === 0 ? 7 : now.getDay();

    const monday = new Date(now);
    monday.setDate(now.getDate() - (day - 1));

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const weekGames = games.filter(g=>{
      const d = new Date(g.date);
      return d >= monday && d <= sunday;
    });

    if (!weekGames.length){
      content.innerHTML = '本週沒有賽事';
      return;
    }

    weekGames.sort((a,b)=>
      new Date(a.date + ' ' + a.time) -
      new Date(b.date + ' ' + b.time)
    );

    content.innerHTML = weekGames.map(renderGameCard).join('');
    setGameCache(weekGames);
  });
}

/*********************************************************
 * ✅ ✅ ✅ 核心：指派 + 報名合併（前端保險版）
 *********************************************************/
function mergeAssignments(games){

  return games.map(g=>{

    g.judges = g.judges || {};
    g.records = g.records || {};

    // ✅ 防 undefined
    g.assignment_judges = g.assignment_judges || {};
    g.signup_judges = g.signup_judges || {};

    g.assignment_records = g.assignment_records || {};
    g.signup_records = g.signup_records || {};

    /** ✅ 裁判：指派優先 **/
    ['PU','U1','U2','U3'].forEach(r=>{
      g.judges[r] =
        g.assignment_judges[r] ||
        g.signup_judges[r] ||
        '';
    });

    /** ✅ 紀錄 **/
    ['REC_MAIN','REC_TRAINEE','REC_VIDEO'].forEach(r=>{
      g.records[r] =
        g.assignment_records[r] ||
        g.signup_records[r] ||
        '';
    });

    return g;
  });
}


/*********************************************************
 * ✅ Loading UI（共用）
 *********************************************************/
function renderLoading(target){
  target.innerHTML = `
    <div style="
      text-align:center;
      padding:20px;
      color:#6b7280;
      font-size:14px;
    ">
      ⏳ 載入中...
    </div>
  `;
}

/*********************************************************
 * ✅ ✅ ✅ 防呆合併（最關鍵）
 *********************************************************/
function safeMerge(g){

  // ✅ 如果後端已經有 judges → 直接用
  if (g.judges && Object.keys(g.judges).some(v => g.judges[v])){
    return g;
  }

  // ✅ 防呆初始化
  g.judges = {};
  g.records = {};

  // ✅ 裁判
  ['PU','U1','U2','U3'].forEach(r=>{
    g.judges[r] =
      g.assignment_judges?.[r] ||
      g.signup_judges?.[r] ||
      '';
  });

  // ✅ 紀錄
  ['REC_MAIN','REC_TRAINEE','REC_VIDEO'].forEach(r=>{
    g.records[r] =
      g.assignment_records?.[r] ||
      g.signup_records?.[r] ||
      '';
  });

  return g;
}
