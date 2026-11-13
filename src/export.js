/* ================= XUẤT WORD / EXCEL THEO MẪU TRƯỜNG =================
   Một "bảng" (grid) dùng chung cho Word và Excel: đầu trang, bảng tiết học có màu theo môn, chữ ký. */
"use strict";
const BRAND="2F2A7A";
const hex6=c=>String(c||"#ffffff").replace("#","").toUpperCase();
function signDate(){const d=new Date();return`${S.place?S.place+", ":""}ngày ${String(d.getDate()).padStart(2,"0")} tháng ${String(d.getMonth()+1).padStart(2,"0")} năm ${d.getFullYear()}`}
function yearText(){return"Năm học "+String(S.year||"").replace(/\s*[–-]\s*/," – ")}

/* ---------- dữ liệu bảng ---------- */
function gridOf(kind,o){
  const days=DAY_NAMES.slice(0,S.days),rows=[];
  const avail=new Set((kind==="class"?slotsOf(o):allSlots()).map(s=>s.k));
  const TG=kind==="teacher"?teacherGrid(o):null;
  for(const[s,lab,n]of sessRows()){
    const part=[];
    for(let p=0;p<n;p++){
      const cells=days.map((_,d)=>{const k=d+"-"+s+"-"+p;
        if(kind==="class"){if(!avail.has(k))return{off:1};const x=S.tkb&&S.tkb[o.id]&&subj(S.tkb[o.id][k]);if(!x)return null;const t=tAt(o,k,x);return{main:x.name,sub:t?tch(t).name:"",c:x.c}}
        const a=TG[k];if(!a){return o.off&&o.off[d]?{off:1}:null}
        return{main:a.map(z=>z.c.name).join(" + "),sub:a[0].x.name,c:a[0].x.c,bad:a.length>1}});
      part.push({s,lab,p,time:(S.times||{})[s+"-"+p]||"",cells})}
    // lớp chỉ học 1 buổi: bỏ buổi còn lại
    if(kind==="class"&&part.every(r=>r.cells.every(c=>c&&c.off)))continue;
    rows.push(...part)}
  let title,name,info=[],extra=null;
  if(kind==="class"){title="THỜI KHÓA BIỂU LỚP "+o.name.toUpperCase();name="Lop_"+o.name;
    if(o.gvcn&&tch(o.gvcn))info.push("Giáo viên chủ nhiệm: "+tch(o.gvcn).name)}
  else{const sm=teacherSummary(o),tot=sm.reduce((a,b)=>a+b[1],0);title="THỜI KHÓA BIỂU GIÁO VIÊN";name="GV_"+o.name;
    info.push("Họ và tên: "+o.name+(o.subj&&subj(o.subj)?"   –   Môn: "+subj(o.subj).name:"")+"   –   Tổng số: "+tot+" tiết/tuần");
    extra=sm}
  const sub=yearText()+(S.from?"  –  Áp dụng từ ngày "+S.from:"");
  return{kind,o,days,rows,title,sub,info,extra,name,sheet:(kind==="class"?"Lớp ":"GV ")+o.name}}

/* ---------- WORD ---------- */
function wordGrid(g){
  const hasTime=g.rows.some(r=>r.time),B="border:1px solid #555;",rowH=g.rows.length>8?26:32;
  const th=`style="${B}background:#${BRAND};color:#fff;font-weight:bold;text-align:center;padding:5pt 3pt;font-size:11pt"`;
  let h=`<table cellspacing="0" cellpadding="0" style="width:100%;border:none;margin-bottom:6pt"><tr>
    <td style="border:none;width:45%;text-align:center;vertical-align:top;font-size:12pt">${S.gov?esc(S.gov.toUpperCase())+"<br>":""}<b>${esc(S.school.toUpperCase())}</b><br><span style="font-size:8pt">───────────</span></td>
    <td style="border:none;width:55%"></td></tr></table>
  <p align="center" style="margin:4pt 0 0;font-size:17pt;color:#${BRAND}"><b>${esc(g.title)}</b></p>
  <p align="center" style="margin:2pt 0;font-size:12pt"><i>${esc(g.sub)}</i></p>
  ${g.info.map(t=>`<p align="center" style="margin:2pt 0;font-size:12pt"><b>${esc(t)}</b></p>`).join("")}
  <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;table-layout:fixed;margin-top:6pt">
  <tr><th ${th} width="7%">Buổi</th><th ${th} width="5%">Tiết</th>${hasTime?`<th ${th} width="10%">Thời gian</th>`:""}${g.days.map(d=>`<th ${th} width="${((hasTime?78:88)/g.days.length).toFixed(1)}%">${d}</th>`).join("")}</tr>`;
  let prev="";
  g.rows.forEach((r,i)=>{const first=r.s!==prev,cnt=g.rows.filter(x=>x.s===r.s).length;prev=r.s;
    const top=first&&i?"border-top:2.25pt solid #"+BRAND+";":"";
    h+="<tr>";
    if(first)h+=`<td rowspan="${cnt}" style="${B}${top}background:#EEF0FF;color:#${BRAND};font-weight:bold;text-align:center;vertical-align:middle;font-size:12pt">${r.lab}</td>`;
    h+=`<td style="${B}${top}background:#F7F8FD;text-align:center;vertical-align:middle;font-weight:bold;font-size:11pt">${r.p+1}</td>`;
    if(hasTime)h+=`<td style="${B}${top}background:#F7F8FD;text-align:center;vertical-align:middle;font-size:10pt">${esc(r.time)}</td>`;
    for(const c of r.cells){
      if(c&&c.off){h+=`<td style="${B}${top}background:#EDEDF2;text-align:center;vertical-align:middle;color:#888;font-size:10pt"><i>Nghỉ</i></td>`;continue}
      if(!c){h+=`<td style="${B}${top}height:${rowH}pt"></td>`;continue}
      const bg=c.bad?"FDECEC":hex6(COLORS[c.c]);
      h+=`<td style="${B}${top}background:#${bg};text-align:center;vertical-align:middle;padding:2pt 2pt;height:${rowH}pt"><b style="font-size:${c.main.length>22?10.5:12}pt">${esc(c.main)}</b>${c.sub?`<br><i style="font-size:10pt;color:#333">${esc(c.sub)}</i>`:""}</td>`}
    h+="</tr>"});
  h+="</table>";
  if(g.extra&&g.extra.length)h+=`<p style="margin:6pt 0 0;font-size:11pt"><b>Lớp – môn giảng dạy:</b> ${g.extra.map(r=>esc(r[0])+" ("+r[1]+" tiết)").join("; ")}.</p>`;
  const sg=t=>`<p style="margin:0 0 0 430pt;width:300pt;text-align:center;font-size:12pt">${t}</p>`;
  h+=`<p style="margin-top:6pt"></p>`+sg(`<i>${esc(signDate())}</i>`)+sg(`<b>${esc((S.signTitle||"HIỆU TRƯỞNG").toUpperCase())}</b>`)+sg("&nbsp;")+sg("&nbsp;")+sg(`<b>${esc(S.signer||"")}</b>`);
  return h}
function wordDoc(parts){
  const body=parts.map((h,i)=>(i?'<br clear="all" style="page-break-before:always;mso-break-type:page-break">':"")+h).join("");
  return "﻿"+`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8">
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>@page Section1{size:841.9pt 595.3pt;mso-page-orientation:landscape;margin:22pt 28pt 18pt 28pt}div.Section1{page:Section1}
body{font-family:"Times New Roman",serif;font-size:12pt}table{mso-table-layout-alt:fixed}td,th{mso-line-height-rule:exactly}p{margin:0}</style></head>
<body><div class="Section1">${body}</div></body></html>`}
function wordMaster(){
  const cs=S.classes,B="border:1px solid #777;";const th=`style="${B}background:#${BRAND};color:#fff;font-weight:bold;text-align:center;font-size:9pt;padding:2pt"`;
  let h=`<p style="font-size:11pt">${S.gov?esc(S.gov.toUpperCase())+"<br>":""}<b>${esc(S.school.toUpperCase())}</b></p><p align="center" style="font-size:16pt;color:#${BRAND}"><b>THỜI KHÓA BIỂU TOÀN TRƯỜNG</b></p><p align="center"><i>${esc(yearText())}</i></p>
  <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;margin-top:4pt"><tr><th ${th}>Thứ</th><th ${th}>Buổi</th><th ${th}>Tiết</th>${cs.map(c=>`<th ${th}>${esc(c.name)}</th>`).join("")}</tr>`;
  const SR=sessRows(),per=SR.reduce((a,r)=>a+r[2],0);
  for(let d=0;d<S.days;d++){let first=true;SR.forEach(([s,lab,n])=>{for(let p=0;p<n;p++){const top=first&&d?"border-top:2pt solid #"+BRAND+";":"";
    h+="<tr>"+(first?`<td rowspan="${per}" style="${B}background:#EEF0FF;font-weight:bold;text-align:center;font-size:10pt;${top}">${DAY_SHORT[d]}</td>`:"")+(p?"":`<td rowspan="${n}" style="${B}${top}background:#F7F8FD;text-align:center;font-size:9pt">${lab==="SÁNG"?"Sáng":"Chiều"}</td>`)+`<td style="${B}${top}text-align:center;font-size:9pt">${p+1}</td>`;first=false;
    for(const c of cs){const k=d+"-"+s+"-"+p,x=S.tkb[c.id]&&subj(S.tkb[c.id][k]);const t=x&&tAt(c,k,x);
      h+=`<td style="${B}${top}text-align:center;font-size:8.5pt;${x?"background:#"+hex6(COLORS[x.c]):""}">${x?"<b>"+esc(x.short)+"</b>"+(t?"<br>"+esc(lastWord(tch(t).name)):""):""}</td>`}
    h+="</tr>"}})}
  return h+"</table>"}

/* ---------- EXCEL (ExcelJS) ---------- */
const XB={style:"thin",color:{argb:"FF555555"}},XBOX={top:XB,left:XB,bottom:XB,right:XB};
const fill=hex=>({type:"pattern",pattern:"solid",fgColor:{argb:"FF"+hex}});
function sheetName(wb,n){n=n.replace(/[\[\]:*?\/\\]/g,"-").slice(0,31);let b=n,i=2;while(wb.getWorksheet(n))n=b.slice(0,28)+"_"+i++;return n}
function excelGrid(wb,g){
  const ws=wb.addWorksheet(sheetName(wb,g.sheet),{views:[{showGridLines:false}],
    pageSetup:{paperSize:9,orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:1,horizontalCentered:true,margins:{left:0.35,right:0.35,top:0.45,bottom:0.4,header:0.2,footer:0.2}}});
  const hasTime=g.rows.some(r=>r.time),off=hasTime?3:2,nC=off+g.days.length;
  ws.columns=[{width:8},{width:6},...(hasTime?[{width:13}]:[]),...g.days.map(()=>({width:21}))];
  const F="Times New Roman";let r=1;
  const line=(v,font,align,from,to)=>{ws.mergeCells(r,from||1,r,to||nC);const c=ws.getCell(r,from||1);c.value=v;c.font={name:F,size:12,...font};c.alignment={horizontal:align||"center",vertical:"middle",wrapText:true};r++};
  const half=Math.min(nC,off+2);
  if(S.gov)line(S.gov.toUpperCase(),{},"center",1,half);
  line(S.school.toUpperCase(),{bold:true},"center",1,half);
  line("───────────",{size:9},"center",1,half);
  ws.getRow(r).height=6;r++;
  line(g.title,{bold:true,size:17,color:{argb:"FF"+BRAND}});ws.getRow(r-1).height=26;
  line(g.sub,{italic:true});
  g.info.forEach(t=>line(t,{bold:true}));
  ws.getRow(r).height=6;r++;
  // tiêu đề bảng
  const head=["Buổi","Tiết",...(hasTime?["Thời gian"]:[]),...g.days];
  head.forEach((v,j)=>{const c=ws.getCell(r,j+1);c.value=v;c.font={name:F,bold:true,size:11,color:{argb:"FFFFFFFF"}};c.fill=fill(BRAND);c.alignment={horizontal:"center",vertical:"middle"};c.border=XBOX});
  ws.getRow(r).height=24;r++;
  let prev="",start=r;
  g.rows.forEach((row,i)=>{
    if(row.s!==prev){const cnt=g.rows.filter(x=>x.s===row.s).length;ws.mergeCells(r,1,r+cnt-1,1);const c=ws.getCell(r,1);c.value=row.lab;
      c.font={name:F,bold:true,size:12,color:{argb:"FF"+BRAND}};c.fill=fill("EEF0FF");c.alignment={horizontal:"center",vertical:"middle",textRotation:90};prev=row.s}
    const top=i&&g.rows[i-1].s!==row.s?{style:"medium",color:{argb:"FF"+BRAND}}:XB;
    const set=(j,v,font,bg,al)=>{const c=ws.getCell(r,j);c.value=v;c.font={name:F,size:11,...font};if(bg)c.fill=fill(bg);c.alignment={horizontal:"center",vertical:"middle",wrapText:true,...al};c.border={...XBOX,top}};
    set(2,row.p+1,{bold:true},"F7F8FD");if(hasTime)set(3,row.time,{size:10},"F7F8FD");
    row.cells.forEach((cel,d)=>{const j=off+1+d;
      if(cel&&cel.off)return set(j,"Nghỉ",{italic:true,size:10,color:{argb:"FF888888"}},"EDEDF2");
      if(!cel)return set(j,"",{},null);
      set(j,{richText:[{text:cel.main,font:{name:F,bold:true,size:12}},...(cel.sub?[{text:"\n"+cel.sub,font:{name:F,italic:true,size:10,color:{argb:"FF333333"}}}]:[])]},{},cel.bad?"FDECEC":hex6(COLORS[cel.c]))});
    ws.getCell(r,1).border={...XBOX,top};
    const lines=Math.max(...row.cells.map(c=>c&&!c.off?Math.ceil(c.main.length/19)+(c.sub?Math.ceil(c.sub.length/24):0):1));ws.getRow(r).height=Math.max(32,lines*15+4);r++});
  for(let i=start;i<r;i++)ws.getCell(i,1).border=XBOX;
  if(g.extra&&g.extra.length){r++;ws.mergeCells(r,1,r,nC);const c=ws.getCell(r,1);
    c.value={richText:[{text:"Lớp – môn giảng dạy: ",font:{name:F,bold:true,size:11}},{text:g.extra.map(x=>x[0]+" ("+x[1]+" tiết)").join("; ")+".",font:{name:F,size:11}}]};
    c.alignment={wrapText:true,vertical:"top"};ws.getRow(r).height=Math.min(90,16*Math.ceil(g.extra.length/4));r++}
  r++;const sf=Math.max(1,nC-2);
  line(signDate(),{italic:true},"center",sf,nC);
  line((S.signTitle||"HIỆU TRƯỞNG").toUpperCase(),{bold:true},"center",sf,nC);
  r+=3;if(S.signer)line(S.signer,{bold:true},"center",sf,nC);
  return ws}
function excelMaster(wb){
  const ws=wb.addWorksheet(sheetName(wb,"Tổng hợp"),{views:[{state:"frozen",xSplit:3,ySplit:5,showGridLines:false}],
    pageSetup:{paperSize:9,orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:0.25,right:0.25,top:0.4,bottom:0.4,header:0.2,footer:0.2}}});
  const cs=S.classes,F="Times New Roman",nC=3+cs.length;
  ws.columns=[{width:6},{width:7},{width:5},...cs.map(()=>({width:11}))];
  ws.mergeCells(1,1,1,Math.min(nC,10));ws.getCell(1,1).value=(S.gov?S.gov.toUpperCase()+" – ":"")+S.school.toUpperCase();ws.getCell(1,1).font={name:F,bold:true,size:12};
  ws.mergeCells(2,1,2,nC);ws.getCell(2,1).value="THỜI KHÓA BIỂU TOÀN TRƯỜNG";ws.getCell(2,1).font={name:F,bold:true,size:16,color:{argb:"FF"+BRAND}};ws.getCell(2,1).alignment={horizontal:"center"};
  ws.mergeCells(3,1,3,nC);ws.getCell(3,1).value=yearText()+(S.from?"  –  Áp dụng từ ngày "+S.from:"");ws.getCell(3,1).font={name:F,italic:true,size:12};ws.getCell(3,1).alignment={horizontal:"center"};
  const hr=5;["Thứ","Buổi","Tiết",...cs.map(c=>c.name)].forEach((v,j)=>{const c=ws.getCell(hr,j+1);c.value=v;c.font={name:F,bold:true,color:{argb:"FFFFFFFF"}};c.fill=fill(BRAND);c.alignment={horizontal:"center",vertical:"middle"};c.border=XBOX});
  let r=hr+1;const SR=sessRows(),per=SR.reduce((a,x)=>a+x[2],0);
  for(let d=0;d<S.days;d++){const d0=r;
    SR.forEach(([s,lab,n])=>{const s0=r;
      for(let p=0;p<n;p++){const top=r===d0&&d?{style:"medium",color:{argb:"FF"+BRAND}}:XB;
        const st=(j,v,font,bg)=>{const c=ws.getCell(r,j);c.value=v;c.font={name:F,size:10,...font};if(bg)c.fill=fill(bg);c.alignment={horizontal:"center",vertical:"middle",wrapText:true};c.border={...XBOX,top}};
        st(1,DAY_SHORT[d],{bold:true},"EEF0FF");st(2,lab==="SÁNG"?"Sáng":"Chiều",{},"F7F8FD");st(3,p+1,{},"F7F8FD");
        cs.forEach((c,ci)=>{const k=d+"-"+s+"-"+p,x=S.tkb[c.id]&&subj(S.tkb[c.id][k]);const t=x&&tAt(c,k,x);
          st(4+ci,x?{richText:[{text:x.short,font:{name:F,bold:true,size:10}},...(t?[{text:"\n"+lastWord(tch(t).name),font:{name:F,italic:true,size:9}}]:[])]}:"",{},x?hex6(COLORS[x.c]):null)});
        ws.getRow(r).height=28;r++}
      ws.mergeCells(s0,2,r-1,2)});
    ws.mergeCells(d0,1,r-1,1)}
  return ws}
async function wbBlob(wb){const buf=await wb.xlsx.writeBuffer();return new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})}
const newWb=()=>{const wb=new ExcelJS.Workbook();wb.creator=S.school;return wb};
const needLib=()=>{if(!window.ExcelJS){toast("Thiếu thư viện Excel — tải lại trang");return false}return true};

/* ---------- các nút xuất ---------- */
async function exportCurrent(fmt){
  if(!S.tkb){toast("Chưa có TKB");return}
  if(view==="master"){
    if(fmt==="xlsx")return exportExcel();
    return dl(new Blob([wordDoc([wordMaster()])],{type:"application/msword"}),"TKB_toan_truong_"+safe(S.year)+".doc")}
  const o=view==="class"?cls(pick):tch(pick);if(!o)return;const g=gridOf(view,o);
  if(fmt==="xlsx"){if(!needLib())return;const wb=newWb();excelGrid(wb,g);dl(await wbBlob(wb),safe(g.name)+".xlsx")}
  else dl(new Blob([wordDoc([wordGrid(g)])],{type:"application/msword"}),safe(g.name)+".doc");
  toast("Đã xuất "+(view==="class"?"TKB lớp "+o.name:"TKB của "+o.name))}
async function exportBulk(kind){
  if(!S.tkb){toast("Chưa có TKB");return}if(!window.JSZip||!needLib())return;
  const fmt=$("bulkFmt").value,list=kind==="class"?S.classes:tkbTeachers();if(!list.length){toast("Chưa có dữ liệu");return}
  toast(`Đang tạo ${list.length} file…`,8000);
  const zip=new JSZip();
  for(const o of list){const g=gridOf(kind,o);
    if(fmt==="xlsx"){const wb=newWb();excelGrid(wb,g);zip.file(safe(g.name)+".xlsx",await wb.xlsx.writeBuffer())}
    else zip.file(safe(g.name)+".doc",wordDoc([wordGrid(g)]))}
  // thêm 1 file gộp để in một lần
  if(fmt==="doc")zip.file(`_IN_TAT_CA_${kind==="class"?"LOP":"GIAO_VIEN"}.doc`,wordDoc(list.map(o=>wordGrid(gridOf(kind,o)))));
  dl(await zip.generateAsync({type:"blob"}),`TKB_tung_${kind==="class"?"lop":"giao_vien"}_${safe(S.year)}.zip`);
  toast(`Đã tách ${list.length} file ${kind==="class"?"lớp":"giáo viên"} vào gói .zip`)}
async function exportExcel(){
  if(!S.tkb){toast("Chưa có TKB");return}if(!needLib())return;
  toast("Đang tạo file Excel…",8000);
  const wb=newWb();excelMaster(wb);
  S.classes.forEach(c=>excelGrid(wb,gridOf("class",c)));
  tkbTeachers().forEach(t=>excelGrid(wb,gridOf("teacher",t)));
  dl(await wbBlob(wb),fileName("xlsx"));toast("Đã xuất Excel: tổng hợp + từng lớp + từng giáo viên")}
