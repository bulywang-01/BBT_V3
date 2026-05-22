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

  const judges = [g.judges.PU, g.judges.U1, g.judges.U3].filter(Boolean);
  const records = [
    g.records.REC_MAIN,
    g.records.REC_TRAINEE,
    g.records.REC_VIDEO
  ].filter(Boolean);

  return `
  <div style="
    background:#fff;
    border-radius:12px;
    padding:14px;
    margin-bottom:12px;
    box-shadow:0 2px 6px rgba(0,0,0,0.08);
  ">

    <!-- ✅ 上層 -->
    <div style="
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      font-size:16px;
      font-weight:700;
    ">

      <!-- 日期（跟時間一樣尺寸） -->
      <div style="color:#2563eb;">
        ${g.date.slice(5)}（${weekday}）
      </div>

      <!-- 場地 -->
      <div style="color:#333;">
        ${g.field}
      </div>
    </div>

    <!-- ✅ 中央（時間 → 場次 → 組別） -->
    <div style="
      text-align:center;
      margin:6px 0 10px;
    ">

      <!-- 時間 -->
      <div style="
        font-size:20px;
        font-weight:800;
        color:#dc2626;
      ">
        ${g.time}
      </div>

      <!-- 場次 -->
      <div style="
        font-size:16px;
        font-weight:700;
        color:#2563eb;
        margin-top:2px;
      ">
        ${g.game_code}
      </div>

      <!-- 組別 -->
      <div style="
        font-size:20px;
        font-weight:700;
        margin-top:2px;
      ">
        ${g.category || ''}
      </div>

    </div>

    <!-- ✅ 對戰 -->
    <div style="
      display:flex;
      gap:10px;
      margin-bottom:10px;
    ">

      <div style="
        flex:1;
        background:#f0f2f6;
        border-radius:10px;
        padding:12px;
        text-align:center;
        font-size:18px;
        font-weight:700;
      ">
        ${g.home_team}
      </div>

      <div style="
        flex:1;
        background:#f0f2f6;
        border-radius:10px;
        padding:12px;
        text-align:center;
        font-size:18px;
        font-weight:700;
      ">
        ${g.away_team}
      </div>

    </div>

    <!-- ✅ 人員 -->
    ${
      (judges.length || records.length) ? `
      <div style="
        border-top:1px dashed #ccc;
        padding-top:8px;
        font-size:13px;
      ">

        <div style="display:flex;text-align:center;color:#777;">
          ${judges.length ? '<div style="flex:1;">主審</div><div style="flex:1;">一壘</div><div style="flex:1;">三壘</div>' : ''}
          ${records.length ? '<div style="flex:1;">記錄</div><div style="flex:1;">見習</div><div style="flex:1;">影像</div>' : ''}
        </div>

        <div style="display:flex;text-align:center;margin-top:4px;">
          ${judges.length ? `
            <div style="flex:1;">${g.judges.PU || ''}</div>
            <div style="flex:1;">${g.judges.U1 || ''}</div>
            <div style="flex:1;">${g.judges.U3 || ''}</div>
          ` : ''}

          ${records.length ? `
            <div style="flex:1;">${g.records.REC_MAIN || ''}</div>
            <div style="flex:1;">${g.records.REC_TRAINEE || ''}</div>
            <div style="flex:1;">${g.records.REC_VIDEO || ''}</div>
          ` : ''}
        </div>

      </div>
      ` : ''
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

