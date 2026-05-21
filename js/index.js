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
    action:'getSignableGames',
    user_id: session.user_id
  }, res => {

    if (!res || res.result !== 'ok'){
      list.innerHTML = '載入失敗';
      return;
    }

    const games = res.games || [];

    // ✅ ✅ ✅ 只留我的
    const myGames = games.filter(g => g.my_position);

    if (!myGames.length){
      list.innerHTML = '沒有班表';
      return;
    }

    let completed = 0;
    let upcoming = 0;
    const today = new Date();

    // ✅ ✅ ✅ 排序（最新在上）
    myGames.sort((a,b)=> new Date(a.date) - new Date(b.date));

    myGames.forEach(g=>{
      const d = new Date(g.date);
      if (d < today) completed++;
      else upcoming++;
    });

    list.innerHTML = myGames.map(g => {

      const roleMap = {
        PU:'主審',
        U1:'一壘審',
        U2:'二壘審',
        U3:'三壘審',
        REC:'記錄'
      };

      return `
      <div class="weekly-card">

        <div class="game-line-1">
          <span class="date">${g.date || ''}</span>
          <span class="code">${g.game_code || ''}</span>
        </div>

        <div class="game-line-2">
          ${g.home || ''} <span>vs</span> ${g.away || ''}
        </div>

        <div class="game-field">
          📍 ${g.field || ''}
        </div>

        <div style="margin-top:6px;color:#2563eb;font-size:13px;font-weight:700;">
          👉 ${roleMap[g.my_position] || g.my_position}
        </div>

      </div>
      `;
    }).join('') +

    `
    <div style="text-align:center;margin-top:10px;font-weight:700;">
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

        <div class="game-line-1">
          <span class="date">${g.date}</span>
          <span class="code">${g.game_code}</span>
          <span class="group">${g.group || ''}</span>
        </div>

        <div class="game-line-2">
          ${g.home || ''} <span>vs</span> ${g.away || ''}
        </div>

        <div class="game-field">
          📍 ${g.field || ''}
        </div>

        <!-- ✅ ✅ ✅ 六格 -->
        <div class="row-all">
          <div class="row-inner">

            <div class="row-line header">
              <div class="col">主審</div>
              <div class="col">一壘</div>
              <div class="col">三壘</div>
              <div class="col">記錄</div>
              <div class="col">見習</div>
              <div class="col">影像</div>
            </div>

            <div class="row-line values">
              <div class="col">${g.PU || ''}</div>
              <div class="col">${g.U1 || ''}</div>
              <div class="col">${g.U3 || ''}</div>
              <div class="col">${g.REC || ''}</div>
              <div class="col">${g.TRAINEE || ''}</div>
              <div class="col">${g.VIDEO || ''}</div>
            </div>

          </div>
        </div>

      </div>
      `;
    }).join('');
  });
}

