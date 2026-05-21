/*********************************************************
 * ✅ Index Page（最終穩定版）
 *********************************************************/

// ✅ ✅ ✅ 全域只宣告一次（修掉你原本的錯）
let session = null;


/*********************************************************
 * ✅ 主入口
 *********************************************************/
document.addEventListener('DOMContentLoaded', () => {

  // ✅ 確保 config.js 有載入
  if (typeof API_BASE === 'undefined'){
    console.error('❌ API_BASE is not defined（config.js 沒載入）');
    alert('系統錯誤：API設定未載入');
    return;
  }

  // ✅ ✅ ✅ 統一登入入口
  session = initAuth();
  if (!session) return;

  // ✅ Header 初始化
  if (window.initHeader){
    initHeader();
  }

  // ✅ 載入首頁資料
  loadDashboard();
});


/*********************************************************
 * ✅ Dashboard 主流程
 *********************************************************/
function loadDashboard(){

  if (!session || !session.user_id){
    console.warn('❌ session 不存在');
    return;
  }

  // ✅ 預設顯示
  setCounts('--','--','--');

  // ✅ 同時載入
  loadJudgeCount();
  loadRecordCount();
  loadYearStats();
}


/*********************************************************
 * ✅ 裁判場次
 *********************************************************/
function loadJudgeCount(){

  callApiSafe({
    action: 'getJudgeGamesByMonth',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    user_id: session.user_id
  }, res => {

    if (!res || res.result !== 'ok'){
      setJudgeCount('--');
      return;
    }

    const games = res.games || [];

    setJudgeCount(games.length);
  });
}


/*********************************************************
 * ✅ 紀錄場次
 *********************************************************/
function loadRecordCount(){

  callApiSafe({
    action: 'getRecordGamesByMonth',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    user_id: session.user_id
  }, res => {

    if (!res || res.result !== 'ok'){
      setRecordCount('--');
      return;
    }

    const games = res.games || [];

    setRecordCount(games.length);
  });
}


/*********************************************************
 * ✅ 年度統計
 *********************************************************/
function loadYearStats(){

  callApiSafe({
    action: 'getSignableGames',
    user_id: session.user_id
  }, res => {

    if (!res || res.result !== 'ok'){
      setYearCount('--');
      return;
    }

    const games = res.games || [];

    let count = 0;

    games.forEach(g=>{
      if (g.my_position) count++;
    });

    setYearCount(count);
  });
}


/*********************************************************
 * ✅ UI 更新
 *********************************************************/
function setCounts(judge, record, year){
  if (judge !== undefined) setJudgeCount(judge);
  if (record !== undefined) setRecordCount(record);
  if (year !== undefined) setYearCount(year);
}

function setJudgeCount(v){
  const el = document.getElementById('judge-count');
  if (el) el.textContent = v;
}

function setRecordCount(v){
  const el = document.getElementById('record-count');
  if (el) el.textContent = v;
}

function setYearCount(v){
  const el = document.getElementById('year-count');
  if (el) el.textContent = v;
}


/*********************************************************
 * ✅ 安全版 API 呼叫（防 crash）
 *********************************************************/
function callApiSafe(params, callback){

  try{
    callApi(params, callback);
  }catch(e){
    console.error('❌ API 呼叫失敗', e);
  }
}
