/*********************************************************
 * ✅ ✅ ✅ 班表共用核心
 *********************************************************/
function renderGameCard(g){

  const d = new Date(g.date);
  const w = ['日','一','二','三','四','五','六'][d.getDay()];

  const isMine = g.my_position && g.my_position !== '';
  const myName = session.name;

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

      <div style="text-align:center;font-size:16px;">
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

<!-- ✅ 第三區（最終版） -->
${
  (g.need_count || Object.values(g.records || {}).some(v => v)) ? `
  <div style="
    border-top:1px dashed #ccc;
    padding-top:10px;
    font-size:14px;
    text-align:center;
  ">

    <!-- ✅ 標題 -->
    <div style="
      display:flex;
      text-align:center;
      color:#777;
    ">
      ${
        [
          // ✅ 裁判（依 need_count）
          ...(['PU','U1','U2','U3'].slice(0, g.need_count || 0).map(r=>{
            const label =
              r === 'PU' ? '主審' :
              r === 'U1' ? '一壘' :
              r === 'U2' ? '二壘' : '三壘';
            return label;
          })),

          // ✅ 紀錄（固定3格）
          '記錄','見習','影像'
        ].map(label=>`
          <div style="flex:1;font-size:12px;">
            ${label}
          </div>
        `).join('')
      }
    </div>

    <!-- ✅ 名字 / 報名 -->
    <div style="
      display:flex;
      text-align:center;
      margin-top:6px;
    ">
      ${
        [
          // ✅ 裁判
          ...(['PU','U1','U2','U3'].slice(0, g.need_count || 0).map(r=>({
            role:r,
            name:g.judges?.[r]
          }))),

          // ✅ 紀錄
          ...['REC_MAIN','REC_TRAINEE','REC_VIDEO'].map(r=>({
            role:r,
            name:g.records?.[r]
          }))
        ].map(s=>`
          <div
            onclick="handleSlotClick('${g.game_id}', '${s.role}')"
            style="
              flex:1;
              cursor:${s.name ? 'default' : 'pointer'};
              font-size:clamp(12px,1.6vw,15px);
              white-space:nowrap;
            "
          >
            ${highlight(s.name) || '＋'}
          </div>
        `).join('')
      }
    </div>

  </div>
  ` : ''
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

  /** ✅ 1. 點自己 → 取消 **/
  if (g.my_position === role){

    if (isRecord){
      cancelRecord(g, role);
    } else {
      cancelJudge(g, role);
    }
    return;
  }

  /** ✅ 2. 同一場限制 **/
  if (g.my_position){

    // ✅ 已經是裁判 → 不可再選其他裁判 or 紀錄
    if (!isRecord){
      alert('❌ 同一場裁判只能選一個');
      return;
    }

    // ✅ 已是裁判 → 不可再選紀錄
    if (isRecord){
      alert('❌ 已是裁判，不能同時擔任紀錄');
      return;
    }
  }

  /** ✅ 3. 空位檢查 **/
  if (g.judges?.[role] || g.records?.[role]){
    alert('❌ 該位置已有人');
    return;
  }

  /** ✅ 4. 跨場時間衝堂 **/
  if (isTimeConflict(g)){
    alert('❌ 時間衝突（已有其他場次）');
    return;
  }

  /** ✅ 5. 報名 **/
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
