/*********************************************************
 ✅ 班表主卡片（唯一UI）
*********************************************************/
function renderGameCard(g, {type='judge', session=null} = {}){

  const isPast = isPastGame(g.date);
  const judgeRoles = getJudgeRoles(g);

  const recordRoles = [
    ['REC_MAIN','紀錄'],
    ['REC_TRAINEE','見習'],
    ['REC_VIDEO','影像']
  ];

  return `
  <div class="game-card ${isPast?'expired-card':''}" id="game-${g.game_id}">

    <!-- 第一列 -->
    <div class="row-top">
      <div class="left">${formatDateTW(g.date)}</div>
      <div class="center">${g.category||''}</div>
      <div class="right">${g.field||''}</div>
    </div>

    <!-- 第二列 -->
    <div class="row-mid">
      <div class="team">${g.away_team||''}</div>

      <div class="center-box">
        <div class="game-code">${g.game_code||''}</div>
        <div class="time">${getTime(g)}</div>
      </div>

      <div class="team">${g.home_team||''}</div>
    </div>

    <!-- 第三列 -->
    <div class="row-bottom">

      <!-- ✅ 裁判 -->
      ${
        type !== 'record'
        ? (
          judgeRoles.length === 0
          ? `<div class="no-judge">無需裁判</div>`
          : judgeRoles.map(role=>{

              const name = g.judges?.[role];

              if (name){
                const isMe = g.my_position === role;

                return `
                <div class="slot">
                  <div class="label">${roleMap(role)}</div>
                  <div class="name ${isMe?'me':''}">
                    ${name}
                  </div>
                  ${
                    isMe && !isPast
                    ? `<div class="cancel"
                         onclick="handleSlotClick('${g.game_id}','${role}')">
                         取消</div>`
                    : ''
                  }
                </div>`;
              }

              if (isPast){
                return `
                <div class="slot">
                  <div class="label">${roleMap(role)}</div>
                  <div class="name">—</div>
                </div>`;
              }

              if (g.my_position){
                return `
                <div class="slot">
                  <div class="label">${roleMap(role)}</div>
                  <div class="name">待位</div>
                </div>`;
              }

              return `
                <div class="slot action"
                  onclick="handleSlotClick('${g.game_id}','${role}')">
                  <div class="label">${roleMap(role)}</div>
                  <div class="btn">報名</div>
                </div>`;
          }).join('')
        )
        : ''
      }

      <!-- ✅ 紀錄 -->
      ${
        type !== 'judge'
        ? recordRoles.map(([role,label])=>{

          const slot = g.records?.[role];

          if (slot){
            const isMe =
              session &&
              String(slot.user_id) === String(session.user_id);

            return `
            <div class="slot">
              <div class="label">${label}</div>
              <div class="name ${isMe?'me':''}">
                ${slot.name}
              </div>
              ${
                isMe && !isPast
                ? `<div class="cancel"
                     onclick="cancelSignup('${g.game_id}','${role}')">
                     取消</div>`
                : ''
              }
            </div>`;
          }

          if (isPast){
            return `
            <div class="slot">
              <div class="label">${label}</div>
              <div class="name">—</div>
            </div>`;
          }

          return `
          <div class="slot action"
            onclick="handleSlotClick('${g.game_id}','${role}')">
            <div class="label">${label}</div>
            <div class="btn">報名</div>
          </div>`;
        }).join('')
        : ''
      }

    </div>
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
                ${name}
              </span>

              ${
                isMe && !isPast
                ? `<div class="mobile-cancel"
                     onclick="handleSlotClick('${g.game_id}','${role}')">
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
              onclick="handleSlotClick('${g.game_id}','${role}')">
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
            onclick="handleSlotClick('${g.game_id}','${role}')">
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

  if (session && name === s.name){
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
  const isMe = g.my_position === role;

  // ✅ 點自己 → 取消
  if (isMe){
    isRecord ? cancelRecord(g, role) : cancelJudge(g, role);
    return;
  }

  // ✅ 驗證
  const err = validateSignup(g, role);
  if (err){
    showToast(err,'error');
    return;
  }

  // ✅ 執行
  isRecord ? signupRecord(g, role) : signupJudge(g, role);
}

/*********************************************************
 * ✅ 報名系統完整版本 - 報名功能
*********************************************************/

// ✅ 報名（裁判）
function signupJudge(g, role){

  const s = JSON.parse(localStorage.getItem('session_user') || '{}');

  const el = document.getElementById(`game-${g.game_id}`);
  if (el) el.classList.add('loading');   // ✅ ✅ ✅ 加在這

  showToast('報名中...');

  callApi({
    action:'judgeSignupByGames',
    user_id: s.user_id,
    games_with_position:`${g.game_id}:${role}`
  }, res => {

    if (res.result === 'ok'){

      // ✅ ✅ ✅ 直接改資料
      g.judges[role] = s.name;
      g.my_position = role;

      updateGameCard(g);   // ✅ ✅ ✅ 重點（不用 render）

      showToast('✅ 已報名','success');

    } else {
      showToast(res?.message || '失敗','error');
    }

  });
}

// ✅ 報名（紀錄）
function signupRecord(g, role){

  const s = JSON.parse(localStorage.getItem('session_user') || '{}');

  const el = document.getElementById(`game-${g.game_id}`);
  if (el) el.classList.add('loading');

  callApi({
    action:'recordSignup',
    game_id: g.game_id,
    user_id: s.user_id,
    record_role: role
  }, res => {

    if (res.result === 'ok'){

      g.records[role] = {
        user_id: s.user_id,
        name: s.name
      };

      g.my_position = role;

      updateGameCard(g);

      showToast('✅ 已報名','success');
    }
  });
}

//✅ 取消（裁判）
function cancelJudge(g, role){

  const s = JSON.parse(localStorage.getItem('session_user') || '{}');

  const el = document.getElementById(`game-${g.game_id}`);
  if (el) el.classList.add('loading'); 

  showToast('取消中...');

  callApi({
    action:'cancelJudgeSignup',
    user_id: s.user_id,
    signup_id: g.my_signup_id
  }, res => {

    if (res.result === 'ok'){

      g.judges[role] = '';
      g.my_position = '';

      updateGameCard(g);   // ✅ ✅ ✅

      showToast('✅ 已取消','success');

    } else {
      showToast(res?.message || '失敗','error');
    }

  });
}


//✅ 取消（紀錄）
function cancelRecord(g, role){

  const s = JSON.parse(localStorage.getItem('session_user') || '{}');

  const el = document.getElementById(`game-${g.game_id}`);
  if (el) el.classList.add('loading');

  callApi({
    action:'cancelRecordSignup',
    game_id: g.game_id,
    user_id: s.user_id,
    record_role: role
  }, res => {

    if (res.result === 'ok'){

      g.records[role] = '';
      g.my_position = '';

      updateGameCard(g);

      showToast('✅ 已取消','success');
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
  const tEnd   = tStart + (targetGame.duration || 120)*60000;

  return __GAME_CACHE.some(g=>{
    if (!g.my_position) return false;
    if (g.game_id === targetGame.game_id) return false;

    const gStart = new Date(g.date + ' ' + getTime(g)).getTime();
    const gEnd   = gStart + (g.duration || 120)*60000;

    return (tStart < gEnd && tEnd > gStart);
  });
}

/*********************************************************
 ✅ cache
*********************************************************/
let __GAME_CACHE = [];

function setGameCache(list){
  __GAME_CACHE = list;
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
  const tStart = new Date(targetGame.date + ' ' + getTime(targetGame)).getTime();
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


/*********************************************************
 ✅ 時間統一
*********************************************************/
function getTime(g){
  if (!g) return '';
  if (typeof g.time === 'string') return g.time;

  if (g.time instanceof Date){
    return g.time.getHours().toString().padStart(2,'0') + ':' +
           g.time.getMinutes().toString().padStart(2,'0');
  }

  return g.time_range || g.game_time || '';
}

/*********************************************************
 ✅ 過期判斷
*********************************************************/
function isPastGame(dateStr){
  const today = new Date();
  today.setHours(0,0,0,0);

  const d = new Date((dateStr||'').replace(/\//g,'-'));
  d.setHours(0,0,0,0);

  return d < today;
}

/*********************************************************
 ✅ 日期格式：改成 月／日（星期），例：5/31(日)
*********************************************************/
function formatDateTW(dateStr){

  if (!dateStr) return '';

  const d = new Date(dateStr.replace(/\//g,'-'));
  const m = d.getMonth() + 1;
  const day = d.getDate();

  const w = ['日','一','二','三','四','五','六'][d.getDay()];

  return `${m}/${day}(${w})`;
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


/*********************************************************
 ✅ 是否顯示（全年隱藏過期）
*********************************************************/
function shouldRenderGame(g){
  if (window.currentMonth === null){
    if (isPastGame(g.date)) return false;
  }
  return true;
}

/*********************************************************
 ✅ 裁判站位
*********************************************************/
function getJudgeRoles(g){

  const count =
    Number(g.umpire_count)
    || Number(g.need_count)
    || 0;

  if (count === 0) return [];
  if (count === 1) return ['PU'];
  if (count === 2) return ['PU','U1'];
  if (count === 3) return ['PU','U1','U3'];
  return ['PU','U1','U2','U3'];
}

function roleMap(r){
  return {
    PU:'主審',
    U1:'一壘',
    U2:'二壘',
    U3:'三壘'
  }[r] || r;
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

/* =========================
 ✅ 局部更新函式
========================= */
function updateGameCard(g){

  const el = document.getElementById(`game-${g.game_id}`);
  if (!el) return;   // ✅ ✅ ✅ 這行一定要

  el.classList.add('loading');

  el.outerHTML = renderGameCard(g,{
    type:'judge',
    session:s
  });
}

