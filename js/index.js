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
  const w = ['日','一','二','三','四','五','六'][d.getDay()];

  const isMine = g.my_position && g.my_position !== '';
  const myName = session.name;

  /************* ✅ 高亮（名字） *************/
  function highlight(name){
    if (!name) return '';

    if (name === myName){
      return `
        <span style="
          background:#dbeafe;
          color:#1d4ed8;
          padding:3px 8px;
          border-radius:6px;
          font-weight:700;
          display:inline-block;
        ">
          ${name}
        </span>
      `;
    }

    return name;
  }

  /************* ✅ 裁判角色依人數 *************/
  const roleMap = {
    1: ['PU'],
    2: ['PU','U1'],
    3: ['PU','U1','U3'],
    4: ['PU','U1','U2','U3']
  };

  const roles = roleMap[g.need_count || 0] || [];

  const hasJudge = roles.some(r => g.judges?.[r]);
  const hasRecord = Object.values(g.records || {}).some(v => v);

  return `
  <div style="
    background:${isMine ? '#eef6ff' : '#fff'};
    border-radius:12px;
    padding:14px;
    margin-bottom:12px;
    box-shadow:0 2px 6px rgba(0,0,0,0.08);
  ">

    <!-- ✅ ✅ ✅ 第一區 -->
    <div style="
      display:grid;
      grid-template-columns:1fr 1fr 1fr;
      align-items:center;
      font-weight:700;
      margin-bottom:6px;
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

    <!-- ✅ ✅ ✅ 第二區 -->
    <div style="
      display:flex;
      align-items:center;
      gap:10px;
      margin:10px 0;
    ">

      <!-- 主隊 -->
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

      <!-- 中間 -->
      <div style="
        flex:0 0 90px;
        text-align:center;
      ">

        <!-- ✅ 場次（上） -->
        <div style="
          display:inline-block;
          padding:2px 10px;
          background:#e8f0ff;
          color:#2563eb;
          border-radius:999px;
          font-weight:700;
        ">
          ${g.game_code}
        </div>

        <!-- ✅ 時間（下） -->
        <div style="
          margin-top:4px;
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
        border-radius:10px;
        padding:12px;
        text-align:center;
        font-size:18px;
        font-weight:700;
      ">
        ${g.away_team}
      </div>

    </div>

    <!-- ✅ ✅ ✅ 第三區 -->
    ${
      (hasJudge || hasRecord) ? `
      <div style="
        border-top:1px dashed #ccc;
        padding-top:8px;
        font-size:13px;
      ">

        <!-- ✅ 裁判 -->
        ${
          hasJudge ? `
          <div style="display:flex;text-align:center;color:#777;">
            ${
              roles.map(r=>{
                const label =
                  r === 'PU' ? '主審' :
                  r === 'U1' ? '一壘' :
                  r === 'U2' ? '二壘' : '三壘';
                return `<div style="flex:1;">${label}</div>`;
              }).join('')
            }
          </div>

          <div style="display:flex;text-align:center;margin-top:4px;">
            ${
              roles.map(r =>
                `<div style="flex:1;">${highlight(g.judges?.[r])}</div>`
              ).join('')
            }
          </div>
          ` : ''
        }

        <!-- ✅ 紀錄（淡底） -->
        ${
          hasRecord ? `
          <div style="
            margin-top:8px;
            background:#f5f7fb;
            border-radius:8px;
            padding:6px 0;
          ">

            <div style="display:flex;text-align:center;color:#777;">
              <div style="flex:1;">記錄</div>
              <div style="flex:1;">見習</div>
              <div style="flex:1;">影像</div>
            </div>

            <div style="display:flex;text-align:center;margin-top:4px;">
              <div style="flex:1;">${highlight(g.records?.REC_MAIN)}</div>
              <div style="flex:1;">${highlight(g.records?.REC_TRAINEE)}</div>
              <div style="flex:1;">${highlight(g.records?.REC_VIDEO)}</div>
            </div>

          </div>
          ` : ''
        }

      </div>
      ` : ''
    }

  </div>
  `;
}


/*********************************************************
 * ✅ ✅ ✅ 班表（第三區 - 裁判及紀錄名單）
 *********************************************************/
function renderJudgeRecordSection(g){

  const myName = session.name;

  const roleMap = {
    1: ['PU'],
    2: ['PU','U1'],
    3: ['PU','U1','U3'],
    4: ['PU','U1','U2','U3']
  };

  const roles = roleMap[g.need_count || 0] || [];

  const hasJudge = roles.some(r => g.judges?.[r]);
  const hasRecord = Object.values(g.records || {}).some(v => v);

  if (!hasJudge && !hasRecord) return '';

  /************* ✅ 高亮樣式（進階版） *************/
  function highlight(name){

    if (!name) return '';

    if (name === myName){
      return `
        <span style="
          background:#dbeafe;
          color:#1d4ed8;
          padding:3px 8px;
          border-radius:6px;
          font-weight:700;
          display:inline-block;
        ">
          ${name}
        </span>
      `;
    }

    return name;
  }

  return `
  <div style="
    border-top:1px dashed #ccc;
    padding-top:8px;
    font-size:13px;
  ">

    <!-- ✅ 裁判 -->
    ${
      hasJudge ? `
      <div style="display:flex;text-align:center;color:#777;">
        ${
          roles.map(r => {
            const label =
              r === 'PU' ? '主審' :
              r === 'U1' ? '一壘' :
              r === 'U2' ? '二壘' :
              '三壘';
            return `<div style="flex:1;">${label}</div>`;
          }).join('')
        }
      </div>

      <div style="display:flex;text-align:center;margin-top:4px;">
        ${
          roles.map(r =>
            `<div style="flex:1;">${highlight(g.judges?.[r])}</div>`
          ).join('')
        }
      </div>
      ` : ''
    }

    <!-- ✅ 紀錄（淡底 + 高亮） -->
    ${
      hasRecord ? `
      <div style="
        margin-top:8px;
        background:#f5f7fb;
        border-radius:8px;
        padding:6px 0;
      ">

        <div style="display:flex;text-align:center;color:#777;">
          <div style="flex:1;">記錄</div>
          <div style="flex:1;">見習</div>
          <div style="flex:1;">影像</div>
        </div>

        <div style="display:flex;text-align:center;margin-top:4px;">
          <div style="flex:1;">${highlight(g.records?.REC_MAIN)}</div>
          <div style="flex:1;">${highlight(g.records?.REC_TRAINEE)}</div>
          <div style="flex:1;">${highlight(g.records?.REC_VIDEO)}</div>
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
