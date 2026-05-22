/*********************************************************
 * ✅ ✅ ✅ 班表共用核心
 *********************************************************/
function renderGameCard(g){

  const d = new Date(g.date);
  const w = ['日','一','二','三','四','五','六'][d.getDay()];
  const isMine = g.my_position && g.my_position !== '';

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

      <div style="text-align:center;font-size:16px;">
        ${g.category || ''}
      </div>

      <div style="text-align:right;">
        ${g.field || ''}
      </div>
    </div>

    <!-- ✅ 第二區（完全維持你原規格） -->
    <div style="
      display:flex;
      align-items:center;
      justify-content:center;
      gap:12px;
      margin:12px 0;
    ">

      <div style="
        flex:1;
        background:#f0f2f6;
        border-radius:12px;
        padding:12px;
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        <span style="font-size:16px;font-weight:700;">
          ${g.home_team}
        </span>
      </div>

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

      <div style="
        flex:1;
        background:#f0f2f6;
        border-radius:12px;
        padding:12px;
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        <span style="font-size:16px;font-weight:700;">
          ${g.away_team}
        </span>
      </div>

    </div>

    <!-- ✅ ✅ ✅ 第三區（升級重點） -->
    <div style="
      border-top:1px dashed #ccc;
      padding-top:10px;
    ">
      <div style="
        display:flex;
        gap:6px;
        text-align:center;
      ">
        ${
          [
            ...['PU','U1','U2','U3'].slice(0, g.need_count || 0).map(r=>({
              role:r,
              name:g.judges?.[r]
            })),
            ...['REC_MAIN','REC_TRAINEE','REC_VIDEO'].map(r=>({
              role:r,
              name:g.records?.[r]
            }))
          ].map(s=>{

            const isMe = s.name === session.name;
            const isEmpty = !s.name;

            let bg = '#f8fafc';
            let color = '#333';
            let border = '1px solid #e5e7eb';
            let cursor = 'pointer';

            // ✅ 已有人
            if (!isEmpty){
              bg = '#f1f5f9';
              cursor = isMe ? 'pointer' : 'default';
            }

            // ✅ 自己（強調）
            if (isMe){
              bg = '#dbeafe';
              color = '#1d4ed8';
              border = '1px solid #93c5fd';
            }

            return `
              <div
                onclick="handleSlotClick('${g.game_id}', '${s.role}')"
                style="
                  flex:1;
                  padding:6px 4px;
                  border-radius:8px;
                  background:${bg};
                  border:${border};
                  color:${color};
                  cursor:${cursor};
                  font-size:13px;
                  font-weight:${isMe ? '700' : '500'};
                  transition:.15s;
                "
                onmouseover="if('${cursor}'==='pointer'){this.style.transform='scale(1.05)'}"
                onmouseout="this.style.transform='scale(1)'"
              >
                ${highlight(s.name) || '＋'}
              </div>
            `;
          }).join('')
        }
      </div>
    </div>

  </div>
  `;
}


/*********************************************************
 * ✅ ✅ ✅ 班表名字高亮
*********************************************************/
function highlight(name){

  if (!name) return '';

  if (name === session.name){
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

      g.records[role] = session.name;
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

  // ✅ 我的班表
  const my = __GAME_CACHE.filter(g => g.my_position);
  const list = document.getElementById('my-schedule-list');

  if (list){
    list.innerHTML = my.map(renderGameCard).join('');
  }

  // ✅ 本週班表
  const weekly = document.getElementById('weeklyContent');

  if (weekly){
    weekly.innerHTML = __GAME_CACHE.map(renderGameCard).join('');
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

  const tStart = new Date(targetGame.date + ' ' + targetGame.time).getTime();
  const tEnd   = tStart + (targetGame.duration || 120) * 60000;

  return __GAME_CACHE.some(g => {

    if (!g.my_position) return false;

    const gStart = new Date(g.date + ' ' + g.time).getTime();
    const gEnd   = gStart + (g.duration || 120) * 60000;

    // ✅ 同一場不用比
    if (g.game_id === targetGame.game_id) return false;

    // ✅ 重疊條件
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

