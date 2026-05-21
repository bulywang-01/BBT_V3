/*********************************************************
 * ✅ index 入口（統一）
 *********************************************************/
document.addEventListener('DOMContentLoaded', () => {

  // ✅ ✅ ✅ 統一登入檢查（唯一入口）
  const session = initAuth();
  if (!session) return;

  // ✅ header
  if (window.initHeader){
    initHeader();
  }

  // ✅ ✅ ✅ 下面才是你的原本邏輯（不要動）
  // fetch / render / API 全部寫在這裡

});
