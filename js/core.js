/* =========================
 ✅ 班表主卡片（唯一UI）
========================= */
/* ✅ 主卡片（最終版） */
function renderGameCard(g, opts = {}){

  const { type = 'judge', session = null } = opts;

  const isPast = isPastGame(g.date);

  if (!shouldRenderGame(g)) return '';

  return `
    <div class="game-card ${isPast?'expired-card':''}">

      <div class="mobile-time-row">
        <div class="time">⏰ ${getTime(g)}</div>
        <div class="game-code badge">${g.game_code}</div>
        <div class="field">📍 ${g.field}</div>
      </div>

      <div class="mobile-teams">
        <strong>${g.away_team}</strong>
        <span class="vs">vs</span>
        <strong>${g.home_team}</strong>
      </div>

      ${
        type === 'judge'
          ? renderJudgeSlots(g, isPast, session)
          : renderRecordSlots(g, isPast, session)
      }

    </div>
  `;
}

/* =========================
 ✅ 班表：裁判 slot（統一版）
========================= */
function renderJudgeSlots(g, isPast, session){

  const roles = ['PU','U1','U2','U3'];

  return `
    <div class="mobile-pos-labels">
      <div>主審</div>
      <div>一壘</div>
      <div>二壘</div>
      <div>三壘</div>
    </div>

    <div class="mobile-pos-grid">
      ${roles.map(role=>{

        const name = g.judges?.[role];

        // ✅ 有人
        if (name){

          const isMe = g.my_position === role;

          return `
            <div class="mobile-pos">
              <span class="${isMe?'mobile-judge-me':''}">
                ${isMe?'★ ':''}${name}
              </span>

              ${
                isMe && !isPast
                ? `<div class="mobile-cancel"
                     onclick="cancelMySignup('${g.my_signup_id}')">
                     取消</div>`
                : ``
              }
            </div>
          `;
        }

        // ✅ ✅ ✅ 過期：完全不能操作
        if (isPast){
          return `<div class="mobile-pos">—</div>`;
        }

        // ✅ ✅ ✅ 已有其它站位
        if (g.my_position){
          return `<div class="mobile-pos">待位</div>`;
        }

        // ✅ ✅ ✅ 可報名
        return `
          <div class="mobile-pos">
            <div class="mobile-pos-btn"
              onclick="signupJudgeInstant('${g.game_id}','${role}')">
              報名
            </div>
          </div>
        `;

      }).join('')}
    </div>
  `;
}


/* =========================
 ✅ 班表：紀錄 slot（統一版）
========================= */
function renderRecordSlots(g, isPast, session){

  const roles = [
    ['REC_MAIN','紀錄'],
    ['REC_TRAINEE','見習'],
    ['REC_VIDEO','影像']
  ];

  return `
    <div class="record-roles">
      ${roles.map(([role,label]) => {

        const slot = g.records?.[role];

        // ✅ 有人
        if (slot){
          const isMe = String(slot.user_id) === String(session.user_id);

          return `
            <div class="record-role ${isMe?'me':'other'}">
              ${label}<br>${slot.name}
              ${
                isMe && !isPast
                ? `<div class="cancel-btn"
                     onclick="cancelSignup('${g.game_id}','${role}')">
                     取消
                   </div>`
                : ''
              }
            </div>
          `;
        }

        // ✅ 過期不可操作
        if (!canSignup(g)){
          return `<div class="record-role other">${label}<br>—</div>`;
        }

        return `
          <div class="record-role action"
            onclick="signup('${g.game_id}','${role}')">
            ＋${label}
          </div>
        `;

      }).join('')}
    </div>
  `;
}

/* =========================
 ✅ 班表：手機 render（裁判）
========================= */
function renderMobileJudge(list, session){

  const root = document.getElementById('mobileView');
  root.innerHTML = '';

  list.forEach(g => {
    root.innerHTML += renderGameCard(g, {
      type:'judge',
      session
    });
  });
}


/* =========================
 ✅ 班表：手機 render（紀錄）
========================= */
function renderMobileRecord(list, session){

  const root = document.getElementById('mobileView');
  root.innerHTML = '';

  list.forEach(g => {
    root.innerHTML += renderGameCard(g, {
      type:'record',
      session
    });
  });
}



/*********************************************************
 * ✅ ✅ ✅ 班表名字高亮
*********************************************************/
function highlight(name){

  if (!name) return '';

  if (session && name === session.name){
    return `
      <span style="
        background:#dbeafe;
        color:#1d4ed8;
        padding:3px 6px;
        border-radius:6px;">
        ${name}
      </span>
    `;
  }

  return `<span style="white-space:nowrap;">${name}</span>`;
}


/*********************************************************
 * ✅ 報名系統完整版本 - slot 點擊判斷（核心）
*********************************************************/
function handleSlotClick(gid, role){

  const g = __GAME_CACHE.find(x => x.game_id === gid);
  if (!g) return;

  const isRecord = role.startsWith('REC');

  /** ✅ 點自己 → 取消 **/
  if (g.my_position === role){

    if (isRecord){
      cancelRecord(g, role);
    } else {
      cancelJudge(g, role);
    }
    return;
  }

  /** ✅ 驗證（核心） **/
  const err = validateSignup(g, role);
  if (err){
    showToast(err);
    return;
  }

  /** ✅ 執行 **/
  if (isRecord){
    signupRecord(g, role);
  } else {
    signupJudge(g, role);
  }
}

/*********************************************************
 * ✅ 報名系統完整版本 - 報名功能
*********************************************************/

// ✅ 報名（裁判）
function signupJudge(g, role){

  callApi({
    action:'judgeSignupByGames',
    user_id: session.user_id,
    games_with_position: `${g.game_id}:${role}`
  }, res => {

    if (res.result === 'ok'){

      // ✅ ✅ ✅ 不 reload → 直接改資料
      g.judges[role] = session.name;
      g.my_position = role;

      renderFromCache();
    }
  });
}

// ✅ 報名（紀錄）
function signupRecord(g, role){

  callApi({
    action:'recordSignup',
    game_id: g.game_id,
    user_id: session.user_id,
    record_role: role
  }, res => {

    if (res.result === 'ok'){

      // ✅ ✅ ✅ 修這裡
      g.records[role] = {
        user_id: session.user_id,
        name: session.name
      };

      g.my_position = role;

      renderFromCache();
    }
  });
}

//✅ 取消（裁判）
function cancelJudge(g, role){

  callApi({
    action:'cancelJudgeSignup',
    signup_id: g.my_signup_id
  }, res => {

    if (res.result === 'ok'){

      g.judges[role] = '';
      g.my_position = '';

      renderFromCache();
    }
  });
}


//✅ 取消（紀錄）
function cancelRecord(g, role){

  callApi({
    action:'cancelRecordSignup',
    game_id: g.game_id,
    user_id: session.user_id,
    record_role: role
  }, res => {

    if (res.result === 'ok'){

      g.records[role] = '';
      g.my_position = '';

      renderFromCache();
    }
  });
}


//✅ 共用刷新
function reloadGames(){

  // 👉 直接重叫你現有方法（不用改）
  if (typeof openMySchedule === 'function'){
    openMySchedule();
  }

  if (typeof openWeeklySchedule === 'function'){
    openWeeklySchedule();
  }

  if (typeof loadDashboard === 'function'){
    loadDashboard();
  }
}

// ✅ 👉 重畫畫面
function renderFromCache(){

  const session = getSession(); // ✅ 關鍵

  const my = __GAME_CACHE.filter(g => g.my_position);
  const list = document.getElementById('my-schedule-list');

  if (list){
    list.innerHTML = my.map(g =>
      renderGameCard(g,{type:'judge',session})
    ).join('');
  }

  const weekly = document.getElementById('weeklyContent');

  if (weekly){
    weekly.innerHTML = __GAME_CACHE.map(g =>
      renderGameCard(g,{type:'judge',session})
    ).join('');
  }
}

/*********************************************************
 * ✅ 全域資料（給 UI 用）
 *********************************************************/
let __GAME_CACHE = [];

/*********************************************************
 * ✅ 設定資料（由 index.js 呼叫）
 *********************************************************/
function setGameCache(list){
  __GAME_CACHE = list;
}

/*********************************************************
 * ✅ 報名系統 - 時間衝堂判斷（核心）
 *********************************************************/
function isTimeConflict(targetGame){

  const tStart = new Date(targetGame.date + ' ' + getTime(targetGame)).getTime();
  const tEnd = tStart + (targetGame.duration || 120) * 60000;

  return __GAME_CACHE.some(g => {

    if (!g.my_position) return false;

    const gStart = new Date(g.date + ' ' + getTime(g)).getTime();
    const gEnd = gStart + (g.duration || 120) * 60000;

    if (g.game_id === targetGame.game_id) return false;

    return (tStart < gEnd && tEnd > gStart);
  });
}


/*********************************************************
 * ✅ 聯盟級報名規則引擎（唯一核心）
 *********************************************************/
function validateSignup(targetGame, role){

  const isRecord = role.startsWith('REC');

  /************* ✅ 同場限制 *************/
  if (targetGame.my_position){

    // ✅ 已是裁判 → 不可再報任何
    if (!targetGame.my_position.startsWith('REC')){
      return '❌ 同一場裁判只能一個角色，且不能兼紀錄';
    }

    // ✅ 已是紀錄
    if (!isRecord){
      return '❌ 已報名紀錄，不可再擔任裁判';
    }
  }

  /************* ✅ 欄位是否已滿 *************/
  if (targetGame.judges?.[role] || targetGame.records?.[role]){
    return '❌ 該位置已有人';
  }

  /************* ✅ 跨場時間衝堂（核心） *************/
  const tStart = new Date(targetGame.date + ' ' + targetGame.time).getTime();
  const tEnd   = tStart + (targetGame.duration || 120) * 60000;

  for (let g of __GAME_CACHE){

    if (!g.my_position) continue;
    if (g.game_id === targetGame.game_id) continue;

    const gStart = new Date(g.date + ' ' + g.time).getTime();
    const gEnd   = gStart + (g.duration || 120) * 60000;

    if (tStart < gEnd && tEnd > gStart){
      return '❌ 時間衝突（已有其他場次）';
    }
  }

  return '';
}

/*********************************************************
 * ✅ Toast 系統（取代 alert）
 *********************************************************/
function showToast(msg, type='normal'){

  let el = document.getElementById('_toast');

  if (!el){
    el = document.createElement('div');
    el.id = '_toast';
    document.body.appendChild(el);
  }

  let bg = '#374151';

  if (type === 'error') bg = '#dc2626';
  if (type === 'success') bg = '#16a34a';

  el.innerHTML = msg;

  el.style.cssText = `
    position:fixed;
    top:20px;
    left:50%;
    transform:translateX(-50%);
    background:${bg};
    color:#fff;
    padding:10px 16px;
    border-radius:8px;
    font-size:14px;
    z-index:9999;
    opacity:0;
    transition:.25s;
  `;

  setTimeout(()=> el.style.opacity = 1, 10);
  setTimeout(()=> el.style.opacity = 0, 2200);
}

/* =========================
 ✅ 時間處理（唯一入口）
========================= */
function getTime(g){
  if (!g) return '';

  if (typeof g.time === 'string') return g.time;

  if (g.time instanceof Date){
    return g.time.getHours().toString().padStart(2,'0')
      + ':' +
      g.time.getMinutes().toString().padStart(2,'0');
  }

  if (g.time_range) return g.time_range;

  return '';
}

/* =========================
 ✅ 過期判斷（唯一入口）
========================= */
function isPastGame(dateStr){
  const today = new Date();
  today.setHours(0,0,0,0);

  const d = new Date((dateStr || '').replace(/\//g,'-'));
  d.setHours(0,0,0,0);

  return d < today;
}

/* =========================
 ✅ 可報名判斷（統一規則）
========================= */
function canSignup(g){
  if (!g) return false;

  // ✅ 過期一律不能報
  if (isPastGame(g.date)) return false;

  return true;
}

/* =========================
 ✅ 全年 / 單月 過濾（核心）
========================= */
function shouldRenderGame(g){
  if (!g) return false;

  if (window.currentMonth === null){
    // ✅ 全年：不顯示過期
    if (isPastGame(g.date)) return false;
  }

  return true;
}

/* =========================
 ✅ 統一 reload（裁判/紀錄共用）
========================= */
function reloadCurrentView(){

  const now = new Date();

  console.log('🔄 reloadCurrentView', window.currentMonth);

  // 👉 記得用 window（避免 scope 問題）
  if (window.currentMonth !== null){

    if (typeof loadJudgeGamesByMonth === 'function'){
      loadJudgeGamesByMonth(
        window.currentYear || now.getFullYear(),
        window.currentMonth
      );
    }

    if (typeof loadRecordGamesByMonth === 'function'){
      loadRecordGamesByMonth(
        window.currentYear || now.getFullYear(),
        window.currentMonth
      );
    }

  } else {

    if (typeof loadGames === 'function'){
      loadGames();
    }
  }
}

/* =========================
 ✅ UI 安全顯示
========================= */
function safeName(slot){
  if (!slot) return '';
  if (typeof slot === 'string') return slot;
  return slot.name || '';
}
