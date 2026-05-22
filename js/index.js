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
 * ✅ ✅ ✅ 班表共用核心
 *********************************************************/
function renderGameCard(g){

  const d = new Date(g.date);
  const w = ['日','一','二','三','四','五','六'][d.getDay()];

  const isMine = g.my_position && g.my_position !== '';
  const myName = session.name;

  /************* ✅ 名字高亮 *************/
  function highlight(name){
    if (!name) return '';

    if (name === myName){
      return `
        <span style="
          background:#dbeafe;
          color:#1d4ed8;
          padding:3px 6px;
          border-radius:6px;
          white-space:nowrap;
        ">
          ${name}
        </span>
      `;
    }

    return `<span style="white-space:nowrap;">${name}</span>`;
  }

  /************* ✅ 裁判角色 *************/
  const roleMap = {
    1: ['PU'],
    2: ['PU','U1'],
    3: ['PU','U1','U3'],
    4: ['PU','U1','U2','U3']
  };

  const roles = roleMap[g.need_count || 0] || [];

  const hasJudge = roles.some(r => g.judges?.[r]);
  const hasRecord = Object.values(g.records || {}).some(v => v);

  /************* ✅ 組合項目 *************/
  const items = [];

  roles.forEach(r=>{
    const label =
      r === 'PU' ? '主審' :
      r === 'U1' ? '一壘' :
      r === 'U2' ? '二壘' : '三壘';

    items.push({
      label,
      value: highlight(g.judges?.[r])
    });
  });

  if (hasRecord){
    items.push(
      { label:'記錄', value:highlight(g.records.REC_MAIN) },
      { label:'見習', value:highlight(g.records.REC_TRAINEE) },
      { label:'影像', value:highlight(g.records.REC_VIDEO) }
    );
  }

  return `
  <div style="
    background:${isMine ? '#eef6ff' : '#fff'};
    border-radius:14px;
    padding:16px;
    margin-bottom:14px;
    box-shadow:0 3px 10px rgba(0,0,0,0.08);
  ">

    <!-- ✅ 第一區 -->
    <div style="
      display:grid;
      grid-template-columns:1fr 1fr 1fr;
      align-items:center;
      font-weight:700;
      margin-bottom:8px;
    ">
      <div style="color:#2563eb;text-align:left;">
        ${g.date.slice(5)}（${w}）
      </div>

      <div style="text-align:center;font-size:14px;">
        ${g.category || ''}
      </div>

      <div style="text-align:right;">
        ${g.field || ''}
      </div>
    </div>

    <!-- ✅ 第二區 -->
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:12px 0;">

      <!-- 主隊 -->
      <div style="
        flex:1;
        background:#f0f2f6;
        border-radius:12px;
        padding:12px;
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        <span style="
          font-size:clamp(14px, 1.8vw, 18px);
          font-weight:700;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        ">
          ${g.home_team}
        </span>
      </div>

      <!-- 中間 -->
      <div style="flex:0 0 110px;text-align:center;">
        <div style="
          display:inline-block;
          padding:3px 12px;
          background:#e8f0ff;
          color:#2563eb;
          border-radius:999px;
          font-weight:700;
        ">
          ${g.game_code}
        </div>

        <div style="
          margin-top:6px;
          color:#dc2626;
          font-size:20px;
          font-weight:800;
        ">
          ${g.time}
        </div>
      </div>

      <!-- 客隊 -->
      <div style="
        flex:1;
        background:#f0f2f6;
        border-radius:12px;
        padding:12px;
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        <span style="
          font-size:clamp(14px, 1.8vw, 18px);
          font-weight:700;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        ">
          ${g.away_team}
        </span>
      </div>

    </div>

    <!-- ✅ 第三區（✅ 完整修正：無 scroll） -->
    ${
      (hasJudge || hasRecord) ? `
      <div style="
        border-top:1px dashed #ccc;
        padding-top:10px;
        font-size:13px;
        text-align:center;
      ">

        <!-- 標題 -->
        <div style="display:flex;text-align:center;color:#777;">
          ${
            items.map(i => `
              <div style="flex:1;font-size:12px;">
                ${i.label}
              </div>
            `).join('')
          }
        </div>

        <!-- 名字 -->
        <div style="
          display:flex;
          text-align:center;
          margin-top:6px;
        ">
          ${
            items.map(i => `
              <div style="
                flex:1;
                font-size:clamp(12px, 1.6vw, 15px);
                white-space:nowrap;
              ">
                ${i.value || ''}
              </div>
            `).join('')
          }
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

    if (!res || res.result !== 'ok'){
      list.innerHTML = '載入失敗';
      return;
    }

    const games = res.games || [];

    const now = new Date();
    now.setHours(23,59,59,999);  
    // ✅ 今天結束前都算未來（避免誤判）

    const myGames = games.filter(g => {

      // ✅ 必須是我的場
      if (!g.my_position) return false;

      // ✅ 只取未來
      const d = new Date(g.date + ' ' + g.time);
      return d > now;
    });

    if (!myGames.length){
      list.innerHTML = '目前沒有未來班表';
      return;
    }

    // ✅ 排序
    myGames.sort((a,b)=>{
      return new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time);
    });

    list.innerHTML = myGames.map(renderGameCard).join('');
  });
}

/*********************************************************
 * ✅ ✅ ✅ 本週聯盟班表（補回你功能）
 *********************************************************/
function openWeeklySchedule(){

  const overlay = document.getElementById('weekly-overlay');
  const content = document.getElementById('weeklyContent');

  if (overlay) overlay.style.display = 'flex';
  if (!content) return;

  content.innerHTML = '載入中...';

  callApi({
    action:'getSignableGames',
    user_id: session.user_id
  }, res => {

    if (!res || res.result !== 'ok'){
      content.innerHTML = '載入失敗';
      return;
    }

    const games = res.games || [];

    /************* ✅ 本週 *************/
    const now = new Date();
    const day = now.getDay() === 0 ? 7 : now.getDay();

    const monday = new Date(now);
    monday.setDate(now.getDate() - (day - 1));

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const weekGames = games.filter(g => {
      const d = new Date(g.date);
      return d >= monday && d <= sunday;
    });

    /************* ✅ ✅ ✅ 關鍵：先 group 再攤平 *************/
    const grouped = {};

    weekGames.forEach(g=>{
      const key = g.category || '未分類';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(g);
    });

    // ✅ 👉 重點：攤平成「一排卡片」，但順序維持 group
    const finalList = [];

    Object.values(grouped).forEach(list=>{
      list.sort((a,b)=>{
        return new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time);
      });
      finalList.push(...list);
    });

    /************* ✅ render *************/
    content.innerHTML = finalList.map(g => renderGameCard(g)).join('');
  });
}
