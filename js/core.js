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

    <!-- ✅ 第三區（✅ 完整修正：無 scroll） -->
    ${
      (hasJudge || hasRecord) ? `
      <div style="
        border-top:1px dashed #ccc;
        padding-top:10px;
        font-size:14px;
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

