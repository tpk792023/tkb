/* ================= XẾP COI THI =================
   Dùng chung dữ liệu giáo viên & điểm trường của trang TKB (biến S). */
"use strict";
function defaultExam(){return{name:"Kiểm tra cuối kì I",cap:"THCS",gt:2,reserve:1,policy:"own",avoidSubject:true,noRepeatPair:true,
  rooms:[],sessions:[],excl:{},busy:{},result:null}}
function EX(){if(!S.exam)S.exam=defaultExam();return S.exam}
const exRoom=id=>EX().rooms.find(r=>r.id===id);
const exSess=id=>EX().sessions.find(s=>s.id===id);
const fmtDate=d=>{if(!d)return"";const m=String(d).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:d};
const sessLabel=s=>`${fmtDate(s.date)} ${s.ses==="S"?"Sáng":"Chiều"}${s.subject?" – "+s.subject:""}`;
function exPool(){const E=EX();return S.teachers.filter(t=>capOf(t)===E.cap)}
function exRoomsOf(s){const E=EX();return E.rooms.filter(r=>!s.sites||!s.sites.length||s.sites.includes(r.site))}
const gtOf=r=>+r.gt||EX().gt;

/* ---------- giao diện ---------- */
function renderExam(){
  const E=EX();
  $("eName").value=E.name;$("eCap").value=E.cap;$("eGt").value=E.gt;$("eRes").value=E.reserve;$("ePolicy").value=E.policy;
  $("eAvoid").checked=E.avoidSubject;$("ePair").checked=E.noRepeatPair;
  const capSites=S.sites.filter(x=>x.cap===E.cap);
  const v=$("rSite").value;$("rSite").innerHTML=capSites.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("");if(v)$("rSite").value=v;
  // phòng thi
  const bySite={};E.rooms.forEach(r=>bySite[r.site]=(bySite[r.site]||0)+1);
  $("roomSum").innerHTML=capSites.map(x=>`<span class="chip n">${esc(x.name)}: ${bySite[x.id]||0} phòng</span>`).join("")+
    `<span class="chip ok">Tổng: ${E.rooms.length} phòng · cần ${E.rooms.reduce((a,r)=>a+gtOf(r),0)} giám thị/buổi</span>`;
  $("roomTbl").innerHTML=E.rooms.length?`<thead><tr><th>Phòng thi</th><th>Điểm trường</th><th>Ghi chú (khối, số HS…)</th><th>Số giám thị</th><th></th></tr></thead><tbody>`+
    E.rooms.map(r=>`<tr data-id="${r.id}"><td style="width:160px"><input class="t" data-f="name" value="${esc(r.name)}"></td>
    <td style="width:200px"><select class="t" data-f="site">${siteOpts(r.site,E.cap,false)}</select></td>
    <td><input class="t" data-f="note" value="${esc(r.note||"")}" placeholder="VD: Khối 6, 24 HS"></td>
    <td style="width:160px"><select class="t" data-f="gt"><option value="0" ${!+r.gt?"selected":""}>Theo mặc định (${E.gt})</option><option value="1" ${+r.gt===1?"selected":""}>1 giám thị</option><option value="2" ${+r.gt===2?"selected":""}>2 giám thị</option></select></td>
    <td style="width:44px"><button class="icon" data-del="1">🗑</button></td></tr>`).join("")+"</tbody>"
    :`<tr><td class="empty-state">Chưa có phòng thi. Tạo nhanh ở trên.</td></tr>`;
  // buổi thi
  $("sSites").innerHTML=capSites.map(x=>`<label style="margin-right:10px;font-size:13.5px"><input type="checkbox" value="${x.id}" checked> ${esc(x.name)}</label>`).join("");
  $("sessTbl").innerHTML=E.sessions.length?`<thead><tr><th>Ngày</th><th>Buổi</th><th>Môn thi</th><th>Giờ</th><th>Điểm thi</th><th class="c">Phòng / GT cần</th><th></th></tr></thead><tbody>`+
    E.sessions.map(s=>{const R=exRoomsOf(s),need=R.reduce((a,r)=>a+gtOf(r),0)+E.reserve*new Set(R.map(r=>r.site)).size,avail=exAvail(s).length;
    return`<tr data-id="${s.id}"><td style="width:150px"><input class="t" type="date" data-f="date" value="${esc(s.date)}"></td>
    <td style="width:110px"><select class="t" data-f="ses"><option value="S" ${s.ses==="S"?"selected":""}>Sáng</option><option value="C" ${s.ses==="C"?"selected":""}>Chiều</option></select></td>
    <td><input class="t" data-f="subject" value="${esc(s.subject)}" placeholder="VD: Toán 6,7"></td>
    <td style="width:120px"><input class="t" data-f="time" value="${esc(s.time||"")}" placeholder="7h30"></td>
    <td style="font-size:13px">${!s.sites||!s.sites.length?"Tất cả điểm":s.sites.map(id=>esc((site(id)||{}).name||"?")).join(", ")}</td>
    <td class="c"><span class="tag ${avail>=need?"ok":"bad"}">${R.length} phòng · cần ${need} / có ${avail} GV</span></td>
    <td style="width:44px"><button class="icon" data-del="1">🗑</button></td></tr>`}).join("")+"</tbody>"
    :`<tr><td class="empty-state">Chưa có buổi thi. Thêm ở trên.</td></tr>`;
  // giám thị
  const P=exPool(),fq=norm($("gFind").value),fs=$("gSite").value;
  $("gSite").innerHTML=`<option value="">Tất cả điểm</option>`+capSites.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("");$("gSite").value=fs;
  const L=P.filter(t=>(!fs||t.site===fs)&&(!fq||norm(t.name).includes(fq)));
  $("gCount").textContent=`${P.filter(t=>!E.excl[t.id]).length}/${P.length} giáo viên ${E.cap==="TH"?"Tiểu học":"THCS"} tham gia coi thi`;
  $("gTbl").innerHTML=P.length?`<thead><tr><th class="c">Tham gia</th><th>Họ tên</th><th>Điểm trường</th><th>Môn</th><th>Chức vụ</th>${E.sessions.map((s,i)=>`<th class="c" title="${esc(sessLabel(s))}">Bận<br>B${i+1}</th>`).join("")}</tr></thead><tbody>`+
    L.map(t=>`<tr data-id="${t.id}"><td class="c"><input type="checkbox" data-f="in" ${E.excl[t.id]?"":"checked"}></td><td>${esc(t.name)}</td><td style="font-size:13px">${esc((site(t.site)||{}).name||"—")}</td>
    <td style="font-size:13px">${esc((subj(t.subj)||{}).name||"")}</td><td style="font-size:13px">${esc(t.role||"")}</td>
    ${E.sessions.map(s=>`<td class="c"><input type="checkbox" data-busy="${s.id}" ${(E.busy[t.id]||{})[s.id]?"checked":""}></td>`).join("")}</tr>`).join("")+"</tbody>"
    :`<tr><td class="empty-state">Chưa có giáo viên ${E.cap==="TH"?"Tiểu học":"THCS"}. Tải danh sách GV ở tab "2. Lớp &amp; Giáo viên" (cột Điểm trường/Cấp để biết GV thuộc cấp nào).</td></tr>`;
  renderExamResult();
  $("bExam").textContent=E.result?"đã xếp":E.sessions.length+" buổi";
}
function exAvail(s){const E=EX();return exPool().filter(t=>!E.excl[t.id]&&!(E.busy[t.id]||{})[s.id])}

function quickRooms(){const E=EX(),st=$("rSite").value,n=Math.max(1,+$("rNum").value||1),pre=$("rPre").value.trim()||"Phòng";
  if(!st){toast("Chưa có điểm trường cấp "+E.cap);return}
  const have=E.rooms.filter(r=>r.site===st).length;
  for(let i=1;i<=n;i++)E.rooms.push({id:uid(),name:`${pre} ${String(have+i).padStart(2,"0")}`,site:st,gt:+$("rGt").value||0,note:$("rNote").value.trim()});
  persist();renderExam();toast(`Đã tạo ${n} phòng thi`)}
function addSession(){const E=EX(),date=$("sDate").value,subjTxt=$("sSubj").value.trim();
  if(!date){toast("Chọn ngày thi");return}
  const sites=[...$("sSites").querySelectorAll("input:checked")].map(i=>i.value);
  const all=S.sites.filter(x=>x.cap===E.cap).length;
  E.sessions.push({id:uid(),date,ses:$("sSes").value,subject:subjTxt,time:$("sTime").value.trim(),sites:sites.length===all?[]:sites});
  E.sessions.sort((a,b)=>(a.date+a.ses).localeCompare(b.date+b.ses));$("sSubj").value="";persist();renderExam()}
const sessSubjId=s=>{const p=String(s.subject||"").replace(/\d+([,\s-]+\d+)*/g,"").trim();return p?matchSubj(p):""};

/* ---------- thuật toán ---------- */
function solveExamOnce(){
  const E=EX(),res={},count={},pairs={};let cost=0,unfilled=0;const warn=[];
  for(const s of E.sessions){
    const R=exRoomsOf(s),A=exAvail(s),xs=E.avoidSubject?sessSubjId(s):"";const used=new Set();
    const slots=[];R.forEach(r=>{for(let i=0;i<gtOf(r);i++)slots.push({r,i})});
    const sitesUsed=[...new Set(R.map(r=>r.site))];
    sitesUsed.forEach(st=>{for(let i=0;i<E.reserve;i++)slots.push({res:st,i})});
    // phòng có ít GV phù hợp xếp trước
    const fit=st=>A.filter(t=>E.policy==="own"?t.site===st:E.policy==="other"?t.site!==st:true).length;
    slots.forEach(x=>x.key=fit(x.r?x.r.site:x.res)+Math.random()*3+(x.res?100:0));slots.sort((a,b)=>a.key-b.key);
    const out={rooms:{},reserve:{}};
    for(const x of slots){const st=x.r?x.r.site:x.res;let best=null,bc=1e9;
      const mate=x.r?(out.rooms[x.r.id]||[]):[];
      for(const t of A){if(used.has(t.id))continue;let c=(count[t.id]||0)*20;
        if(xs&&t.subj===xs)c+=600;
        if(E.policy==="own")c+=t.site===st?0:(t.site?900:150);
        else if(E.policy==="other")c+=t.site&&t.site===st?900:0;
        else c+=t.site===st?0:12;
        if(E.noRepeatPair&&mate.length)for(const m of mate)if(pairs[[m,t.id].sort().join("|")])c+=60;
        c+=Math.random()*6;if(c<bc){bc=c;best=t}}
      if(!best){unfilled++;continue}
      used.add(best.id);count[best.id]=(count[best.id]||0)+1;cost+=bc;
      if(x.r){(out.rooms[x.r.id]=out.rooms[x.r.id]||[]).push(best.id)}else (out.reserve[st]=out.reserve[st]||[]).push(best.id)}
    Object.values(out.rooms).forEach(a=>{if(a.length>1)pairs[[a[0],a[1]].sort().join("|")]=1});
    res[s.id]=out}
  const vals=exPool().filter(t=>!E.excl[t.id]).map(t=>count[t.id]||0),mean=vals.reduce((a,b)=>a+b,0)/(vals.length||1);
  const vari=vals.reduce((a,v)=>a+(v-mean)**2,0);
  return{res,score:unfilled*1e5+cost+vari*15,unfilled}}
function runExam(){
  const E=EX();if(!E.sessions.length){toast("Chưa có buổi thi");return}if(!E.rooms.length){toast("Chưa có phòng thi");return}
  if(!exPool().length){toast("Chưa có giáo viên cấp "+E.cap);return}
  let best=null;const t0=performance.now();while(performance.now()-t0<1500){const r=solveExamOnce();if(!best||r.score<best.score)best=r}
  E.result=best.res;persist();renderExam();
  const W=examIssues();toast(best.unfilled?`⚠️ Còn ${best.unfilled} chỗ chưa có giám thị — thiếu người hoặc quy tắc điểm trường quá chặt`:W.length?`Đã xếp xong, có ${W.length} điểm cần xem lại`:"✔ Đã xếp coi thi xong, đạt mọi quy tắc",5000)}
function examIssues(){
  const E=EX(),W=[];if(!E.result)return W;
  for(const s of E.sessions){const o=E.result[s.id];if(!o)continue;const seen={},xs=E.avoidSubject?sessSubjId(s):"";
    for(const r of exRoomsOf(s)){const a=(o.rooms[r.id]||[]).filter(Boolean);if(a.length<gtOf(r))W.push({t:"bad",m:`${sessLabel(s)}: ${r.name} (${(site(r.site)||{}).name}) thiếu ${gtOf(r)-a.length} giám thị`});
      a.forEach(id=>{const t=tch(id);if(!t)return;seen[id]=(seen[id]||0)+1;
        if(E.policy==="own"&&t.site&&t.site!==r.site)W.push({t:"warn",m:`${sessLabel(s)}: ${t.name} coi thi ở điểm khác (${(site(r.site)||{}).name})`});
        if(E.policy==="other"&&t.site===r.site)W.push({t:"warn",m:`${sessLabel(s)}: ${t.name} coi thi tại điểm của mình`});
        if(xs&&t.subj===xs)W.push({t:"warn",m:`${sessLabel(s)}: ${t.name} coi thi đúng môn mình dạy`});
        if((E.busy[id]||{})[s.id])W.push({t:"bad",m:`${sessLabel(s)}: ${t.name} đã báo bận buổi này`})})}
    Object.values(o.reserve||{}).flat().forEach(id=>seen[id]=(seen[id]||0)+1);
    for(const id in seen)if(seen[id]>1&&tch(id))W.push({t:"bad",m:`${sessLabel(s)}: ${tch(id).name} bị xếp ${seen[id]} chỗ cùng lúc`})}
  return W}
function examCounts(){const E=EX(),c={};if(!E.result)return c;for(const sid in E.result){const o=E.result[sid];Object.values(o.rooms).flat().concat(Object.values(o.reserve||{}).flat()).forEach(id=>{if(id)c[id]=(c[id]||0)+1})}return c}

/* ---------- kết quả ---------- */
let exView="sess";
function renderExamResult(){
  const E=EX(),box=$("exRes");
  if(!E.result){box.innerHTML=`<div class="empty-state"><div style="font-size:40px">📝</div><p>Chưa xếp coi thi.</p><button class="btn gold big" onclick="runExam()">✨ Xếp coi thi</button></div>`;$("exIss").innerHTML="";return}
  const W=examIssues(),C=examCounts();
  $("exIss").innerHTML=W.length?`<ul class="iss">${W.map(w=>`<li style="color:${w.t==="bad"?"var(--bad)":"inherit"}">${w.t==="bad"?"⛔":"⚠️"} ${esc(w.m)}</li>`).join("")}</ul>`:`<span class="chip ok">✔ Không có giám thị nào trùng buổi, thiếu người hay sai quy tắc.</span>`;
  const head=`<div class="tt"><div class="s1">${esc(S.school)}</div><div class="s2">PHÂN CÔNG COI THI – ${esc(E.name).toUpperCase()}</div><div class="s3">Năm học: ${esc(S.year)} • ${E.cap==="TH"?"Cấp Tiểu học":"Cấp THCS"}</div></div>`;
  if(exView==="sess"){
    const P=exPool().filter(t=>!E.excl[t.id]);
    box.innerHTML=head+E.sessions.map(s=>{const o=E.result[s.id]||{rooms:{},reserve:{}},R=exRoomsOf(s);const avail=exAvail(s);
      const opt=(sel)=>`<option value="">—</option>`+avail.map(t=>`<option value="${t.id}" ${t.id===sel?"selected":""}>${esc(t.name)}</option>`).join("")+(sel&&!avail.find(t=>t.id===sel)&&tch(sel)?`<option value="${sel}" selected>${esc(tch(sel).name)} (bận)</option>`:"");
      const maxG=Math.max(1,...R.map(gtOf));
      const sites=[...new Set(R.map(r=>r.site))];
      return`<h3 style="margin:18px 0 8px;color:var(--brand)">📌 ${esc(sessLabel(s))}${s.time?" – "+esc(s.time):""}</h3>
      <div class="scroll"><table class="tbl ex"><thead><tr><th>Điểm trường</th><th>Phòng</th><th>Ghi chú</th>${Array.from({length:maxG},(_,i)=>`<th>Giám thị ${i+1}</th>`).join("")}</tr></thead><tbody>`+
      R.map(r=>{const a=o.rooms[r.id]||[];return`<tr><td style="font-size:13px">${esc((site(r.site)||{}).name||"")}</td><td><b>${esc(r.name)}</b></td><td style="font-size:13px">${esc(r.note||"")}</td>`+
        Array.from({length:maxG},(_,i)=>i<gtOf(r)?`<td><select class="t" data-s="${s.id}" data-r="${r.id}" data-i="${i}">${opt(a[i])}</select></td>`:`<td class="note c">—</td>`).join("")+"</tr>"}).join("")+
      sites.map(st=>{const a=(o.reserve||{})[st]||[];return E.reserve?`<tr style="background:#f8f9ff"><td style="font-size:13px">${esc((site(st)||{}).name||"")}</td><td colspan="2"><i>Giám thị dự phòng / hành lang</i></td>`+
        Array.from({length:maxG},(_,i)=>i<E.reserve?`<td><select class="t" data-s="${s.id}" data-res="${st}" data-i="${i}">${opt(a[i])}</select></td>`:`<td></td>`).join("")+"</tr>":""}).join("")+
      `</tbody></table></div>`}).join("");
  }else{
    const P=exPool().filter(t=>!E.excl[t.id]).sort((a,b)=>((site(a.site)||{}).name||"").localeCompare((site(b.site)||{}).name||"")||lastWord(a.name).localeCompare(lastWord(b.name),"vi"));
    const where=(t,s)=>{const o=E.result[s.id];if(!o)return"";for(const rid in o.rooms)if(o.rooms[rid].includes(t.id)){const r=exRoom(rid);return r?r.name+(new Set(E.rooms.map(x=>x.site)).size>1?" ("+((site(r.site)||{}).name||"")+")":""):""}
      for(const st in o.reserve||{})if(o.reserve[st].includes(t.id))return"Dự phòng ("+((site(st)||{}).name||"")+")";return""};
    box.innerHTML=head+`<div class="scroll"><table class="tbl ex"><thead><tr><th>STT</th><th>Họ tên</th><th>Điểm trường</th>${E.sessions.map(s=>`<th class="c">${esc(sessLabel(s))}</th>`).join("")}<th class="c">Số buổi</th></tr></thead><tbody>`+
      P.map((t,i)=>`<tr><td class="c">${i+1}</td><td><b>${esc(t.name)}</b></td><td style="font-size:13px">${esc((site(t.site)||{}).name||"")}</td>${E.sessions.map(s=>{const w=where(t,s);return`<td class="c" style="font-size:13px;${(E.busy[t.id]||{})[s.id]?"color:#aaa":""}">${w?esc(w):(E.busy[t.id]||{})[s.id]?"bận":""}</td>`}).join("")}<td class="c"><b>${C[t.id]||0}</b></td></tr>`).join("")+"</tbody></table></div>";
  }
}
/* ---------- xuất ---------- */
function examSessRows(s){const E=EX(),o=E.result[s.id]||{rooms:{},reserve:{}},R=exRoomsOf(s),maxG=Math.max(1,...R.map(gtOf));
  const rows=[["STT","Điểm trường","Phòng","Ghi chú",...Array.from({length:maxG},(_,i)=>"Giám thị "+(i+1))]];
  R.forEach((r,i)=>rows.push([i+1,(site(r.site)||{}).name||"",r.name,r.note||"",...Array.from({length:maxG},(_,j)=>{const id=(o.rooms[r.id]||[])[j];return id&&tch(id)?tch(id).name:""})]));
  if(E.reserve)[...new Set(R.map(r=>r.site))].forEach(st=>rows.push(["",(site(st)||{}).name||"","Dự phòng","",...((o.reserve||{})[st]||[]).map(id=>tch(id)?tch(id).name:"")]));
  return rows}
function examTeacherRows(){const E=EX(),C=examCounts();const P=exPool().filter(t=>!E.excl[t.id]);
  const rows=[["STT","Họ tên","Điểm trường",...E.sessions.map(sessLabel),"Số buổi"]];
  P.forEach((t,i)=>rows.push([i+1,t.name,(site(t.site)||{}).name||"",...E.sessions.map(s=>{const o=E.result[s.id];if(!o)return"";for(const rid in o.rooms)if(o.rooms[rid].includes(t.id))return(exRoom(rid)||{}).name||"";for(const st in o.reserve||{})if(o.reserve[st].includes(t.id))return"Dự phòng";return(E.busy[t.id]||{})[s.id]?"bận":""}),C[t.id]||0]));
  return rows}
function exportExamExcel(){const E=EX();if(!E.result){toast("Chưa xếp coi thi");return}if(!window.XLSX){toast("Cần kết nối mạng");return}
  const wb=XLSX.utils.book_new(),used=new Set();const add=(n,rows,head)=>{n=n.replace(/[\[\]:*?\/\\]/g,"-").slice(0,31);let b=n,i=2;while(used.has(n))n=b.slice(0,28)+"_"+i++;used.add(n);
    const ws=XLSX.utils.aoa_to_sheet([[S.school.toUpperCase()],[head],["Năm học: "+S.year],[],...rows]);ws["!cols"]=rows[0].map((_,j)=>({wch:j===0?5:24}));XLSX.utils.book_append_sheet(wb,ws,n)};
  add("Tổng hợp GV",examTeacherRows(),"PHÂN CÔNG COI THI – "+E.name.toUpperCase());
  E.sessions.forEach((s,i)=>add(`B${i+1} ${fmtDate(s.date).replace(/\//g,"-")} ${s.ses==="S"?"Sáng":"Chiều"}`,examSessRows(s),"COI THI "+sessLabel(s).toUpperCase()+(s.time?" – "+s.time:"")));
  XLSX.writeFile(wb,("Coi_thi_"+safe(E.name))+".xlsx");toast("Đã xuất Excel: tổng hợp GV + mỗi buổi thi một sheet")}
function exportExamWord(){const E=EX();if(!E.result){toast("Chưa xếp coi thi");return}
  const td='style="border:1px solid #000;padding:4px 6px;text-align:center;vertical-align:middle"';
  const tbl=rows=>`<table style="border-collapse:collapse;width:100%">${rows.map((r,i)=>`<tr>${r.map(v=>i?`<td ${td}>${esc(v)}</td>`:`<th ${td}>${esc(v)}</th>`).join("")}</tr>`).join("")}</table>`;
  const hd=t=>`<p align="center" style="margin:0"><b>${esc(S.school.toUpperCase())}</b></p><p align="center" style="font-size:15pt;margin:6px 0"><b>${esc(t)}</b></p>`;
  const body=E.sessions.map((s,i)=>`${i?'<br style="page-break-before:always">':""}${hd("PHÂN CÔNG COI THI – "+E.name.toUpperCase())}<p align="center">${esc(sessLabel(s))}${s.time?" – "+esc(s.time):""}</p>${tbl(examSessRows(s))}`).join("")+
    `<br style="page-break-before:always">${hd("TỔNG HỢP COI THI THEO GIÁO VIÊN")}${tbl(examTeacherRows())}`;
  const html=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>@page Section1{size:841.9pt 595.3pt;mso-page-orientation:landscape;margin:30pt}div.Section1{page:Section1}body{font-family:"Times New Roman";font-size:12pt}</style></head><body><div class="Section1">${body}</div></body></html>`;
  dl(new Blob(["﻿"+html],{type:"application/msword"}),"Coi_thi_"+safe(E.name)+".doc");toast("Đã xuất Word")}
function printExam(){if(!EX().result){toast("Chưa xếp coi thi");return}
  $("printAll").innerHTML=$("exRes").innerHTML.replace(/<select[^>]*>([\s\S]*?)<\/select>/g,(m,inner)=>{const s=inner.match(/<option value="[^"]*" selected>([^<]*)<\/option>/);return s?s[1]:""});
  document.body.classList.add("printing-all");setTimeout(()=>{window.print();document.body.classList.remove("printing-all")},50)}

/* ---------- sự kiện ---------- */
function bindExam(){
  const E=()=>EX();
  const map={eName:["name",v=>v],eCap:["cap",v=>v],eGt:["gt",v=>+v],eRes:["reserve",v=>+v],ePolicy:["policy",v=>v]};
  for(const id in map)$(id).addEventListener("change",e=>{E()[map[id][0]]=map[id][1](e.target.value);persist();renderExam()});
  $("eAvoid").onchange=e=>{E().avoidSubject=e.target.checked;persist();renderExam()};
  $("ePair").onchange=e=>{E().noRepeatPair=e.target.checked;persist()};
  $("roomTbl").addEventListener("change",e=>{const tr=e.target.closest("tr[data-id]");if(!tr)return;const r=exRoom(tr.dataset.id),f=e.target.dataset.f;r[f]=f==="gt"?+e.target.value:e.target.value;persist();renderExam()});
  $("roomTbl").addEventListener("click",e=>{if(!e.target.dataset.del)return;const id=e.target.closest("tr").dataset.id;E().rooms=E().rooms.filter(r=>r.id!==id);persist();renderExam()});
  $("sessTbl").addEventListener("change",e=>{const tr=e.target.closest("tr[data-id]");if(!tr)return;exSess(tr.dataset.id)[e.target.dataset.f]=e.target.value;persist();renderExam()});
  $("sessTbl").addEventListener("click",e=>{if(!e.target.dataset.del)return;const id=e.target.closest("tr").dataset.id;E().sessions=E().sessions.filter(s=>s.id!==id);if(E().result)delete E().result[id];persist();renderExam()});
  $("gTbl").addEventListener("change",e=>{const tr=e.target.closest("tr[data-id]");if(!tr)return;const id=tr.dataset.id;
    if(e.target.dataset.f==="in"){if(e.target.checked)delete E().excl[id];else E().excl[id]=true}
    else if(e.target.dataset.busy){const b=E().busy[id]=E().busy[id]||{};if(e.target.checked)b[e.target.dataset.busy]=true;else delete b[e.target.dataset.busy]}
    persist();renderExam()});
  $("gFind").addEventListener("input",renderExam);$("gSite").addEventListener("change",renderExam);
  $("gAll").onclick=()=>{exPool().forEach(t=>delete E().excl[t.id]);persist();renderExam()};
  $("gNone").onclick=()=>{exPool().forEach(t=>E().excl[t.id]=true);persist();renderExam()};
  $("gNoBGH").onclick=()=>{exPool().forEach(t=>{if(isBGH(t))E().excl[t.id]=true});persist();renderExam();toast("Đã bỏ BGH khỏi danh sách coi thi")};
  $("exSeg").onclick=e=>{const b=e.target.closest("button");if(!b)return;exView=b.dataset.v;document.querySelectorAll("#exSeg button").forEach(x=>x.classList.toggle("on",x===b));renderExamResult()};
  $("exRes").addEventListener("change",e=>{const sel=e.target;if(!sel.dataset.s)return;const o=E().result[sel.dataset.s]=E().result[sel.dataset.s]||{rooms:{},reserve:{}};
    const arr=sel.dataset.r?(o.rooms[sel.dataset.r]=o.rooms[sel.dataset.r]||[]):((o.reserve=o.reserve||{})[sel.dataset.res]=o.reserve[sel.dataset.res]||[]);
    arr[+sel.dataset.i]=sel.value;persist();renderExamResult();const W=examIssues().filter(w=>w.t==="bad");if(W.length)toast("⚠️ "+W[0].m,4000)});
}
