/*********************************************************
 * ✅ Index Page（最終穩定版）
 * 👉 已整合 auth / header / API
 *********************************************************/

let session = null;


/*********************************************************
 * ✅ 主入口
 *********************************************************/
document.addEventListener('DOMContentLoaded', () => {

  // ✅ 統一登入檢查（唯一入口）
  session = initAuth();
  if (!session) return;

  // ✅ 初始化 Header
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
    return;
  }

  // ✅ 顯示 loading（如果有 UI 可以自己加）
  setCounts('--','--','--');

  // ✅ 同時抓三種統計
  loadJudgeCount();
  loadRecordCount();
  loadYearStats();
}


/*********************************************************
 * ✅ 裁判場次
 *********************************************************/
function loadJudgeCount(){

  callApi({
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

  callApi({
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

  callApi({
    action: 'getSignableGames',   // ✅ 用全年 API
    user_id: session.user_id
  }, res => {

    if (!res || res.result !== 'ok'){
      setYearCount('--');
      return;
    }

    const games = res.games || [];

    let count = 0;

    games.forEach(g=>{
      // ✅ 有參與才算
      if (g.my_position){
        count++;
      }
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
 * ✅ API 呼叫（JSONP）
 *********************************************************/
function callApi(params, callback){

  const url = API_BASE +
    '?' + Object.keys(params)
      .map(k => k + '=' + encodeURIComponent(params[k]))
      .join('&') +
    '&callback=handleApiResponse';

  const script = document.createElement('script');

  window.handleApiResponse = function(res){
    callback(res);
    document.body.removeChild(script);
  };

  script.src = url;
  document.body.appendChild(script);
}
