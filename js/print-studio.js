
"use strict";

const PRINT_STITCH_LABELS={
 knit:"Knit",purl:"Purl",cableR:"Right cable",cableL:"Left cable",twist:"Twist"
};
const PRINT_SYMBOLS={knit:"",purl:"•",cableR:"╱",cableL:"╲",twist:"×"};

function printOptions(){
 return {
  scope:$("printScope")?.value||"panel",
  paper:$("printPaper")?.value||"letter",
  orientation:$("printOrientation")?.value||"portrait",
  scale:Number($("printScale")?.value)||1,
  rowStep:Number($("printRowNumbers")?.value)||0,
  stitchStep:Number($("printStitchNumbers")?.value)||0,
  visual:$("printVisualStyle")?.value||"symbols",
  overlap:Number($("printOverlap")?.value)||0,
  title:Boolean($("printTitle")?.checked),
  legend:Boolean($("printLegend")?.checked),
  notes:Boolean($("printNotes")?.checked),
  guides:Boolean($("printGuides")?.checked),
  labels:Boolean($("printSectionLabels")?.checked),
  repeats:Boolean($("printRepeatBrackets")?.checked),
  registration:Boolean($("printRegistration")?.checked)
 };
}
function printEscape(value){
 return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function normalizedPrintRows(rows,width){
 return rows.map(row=>[...row.slice(0,width),...Array(Math.max(0,width-row.length)).fill(K)].slice(0,width));
}
function panelPrintData(name){
 ensureSections();
 const width=Math.max(1,Number(panelSpecs?.[name]?.working)||Number($("targetWidth")?.value)||1);
 const parts=(panels[name]||[]).map((section,index)=>{
  const rows=normalizedPrintRows(sectionRows(section,width),width);
  return {section,index,rows};
 });
 return {
  kind:"panel",name,width,
  rows:parts.flatMap(part=>part.rows),
  parts,
  notes:panelSpecs?.[name]?.notes||"",
  spec:panelSpecs?.[name]||{}
 };
}
function sectionPrintData(){
 const section=activeSection();
 const width=Math.max(1,Number(panelSpecs?.[activePanel]?.working)||Number($("targetWidth")?.value)||1);
 const rows=normalizedPrintRows(sectionRows(section,width),width);
 return {kind:"section",name:`${activePanel} — ${section.name}`,width,rows,parts:[{section,index:0,rows}],notes:"",spec:panelSpecs?.[activePanel]||{}};
}
function motifPrintData(){
 const motif=motifs.find(m=>m.id===selectedMotifId)||motifs[0];
 if(!motif)return {kind:"motif",name:"No motif selected",width:1,rows:[[K]],parts:[],notes:"",spec:{}};
 const rows=repeatSlice(motif);
 return {kind:"motif",name:motif.name,width:rows[0]?.length||1,rows,parts:[],notes:(motif.tags||[]).join(", "),spec:{repeatMultiple:motif.repeat?.width||motif.width}};
}
function printDocuments(){
 const scope=printOptions().scope;
 if(scope==="project")return ["Front","Back","Sleeve","Gusset","Shoulder"].map(panelPrintData);
 if(scope==="section")return [sectionPrintData()];
 if(scope==="motif")return [motifPrintData()];
 return [panelPrintData(activePanel)];
}
function usedStitches(rows){
 const set=new Set();
 rows.forEach(row=>row.forEach(stitch=>set.add(stitch)));
 return [...set];
}
function guideLines(data,opts){
 if(!opts.guides||data.kind==="motif")return [];
 const spec=data.spec||{}, width=data.width, lines=[];
 if(spec.guideCenter){
  lines.push({x:spec.centerMode==="stitch"?Math.floor(width/2):width/2,type:"center",label:"Center"});
 }
 if(spec.guideQuarters){
  lines.push({x:width/4,type:"quarter",label:"Quarter"},{x:width*3/4,type:"quarter",label:"Quarter"});
 }
 if(spec.guideUnderarm&&Number(spec.underarm)>0){
  const u=Number(spec.underarm);
  lines.push({x:u,type:"underarm",label:"Underarm"},{x:width-u,type:"underarm",label:"Underarm"});
 }
 return lines;
}
function makeChartSvg(data,opts,preview=false){
 const cell=Math.max(8,12*opts.scale);
 const top=opts.stitchStep?28:10,left=opts.rowStep?38:10,right=12,bottom=16;
 const titleH=opts.title?58:8;
 const notesH=opts.notes&&data.notes?38:0;
 const legendItems=opts.legend?usedStitches(data.rows):[];
 const legendH=legendItems.length?42:0;
 const chartW=data.width*cell,chartH=data.rows.length*cell;
 const width=Math.max(420,left+chartW+right);
 const height=titleH+top+chartH+bottom+notesH+legendH;
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">`;
 svg+=`<rect width="100%" height="100%" fill="white"/>`;
 if(opts.title){
  svg+=`<text x="12" y="22" font-family="Arial,sans-serif" font-size="18" font-weight="700">${printEscape(data.name)}</text>`;
  svg+=`<text x="12" y="42" font-family="Arial,sans-serif" font-size="10" fill="#555">${data.width} stitches × ${data.rows.length} rows`;
  if(data.spec?.repeatMultiple)svg+=` · repeat multiple ${printEscape(data.spec.repeatMultiple)}`;
  svg+=`</text>`;
 }
 const ox=left,oy=titleH+top;
 if(opts.stitchStep){
  for(let c=0;c<data.width;c++){
   const n=c+1;
   if(n===1||n===data.width||n%opts.stitchStep===0)
    svg+=`<text x="${ox+c*cell+cell/2}" y="${oy-8}" text-anchor="middle" font-family="Arial,sans-serif" font-size="8">${n}</text>`;
  }
 }
 if(opts.labels&&data.parts?.length>1){
  let running=0;
  data.parts.forEach(part=>{
   svg+=`<text x="${ox+3}" y="${oy+running*cell+10}" font-family="Arial,sans-serif" font-size="8" font-weight="700" fill="#555">${printEscape(part.section.name)}</text>`;
   running+=part.rows.length;
  });
 }
 for(let r=0;r<data.rows.length;r++){
  if(opts.rowStep){
   const rowNo=data.rows.length-r;
   if(rowNo===1||rowNo===data.rows.length||rowNo%opts.rowStep===0)
    svg+=`<text x="${ox-7}" y="${oy+r*cell+cell*.72}" text-anchor="end" font-family="Arial,sans-serif" font-size="8">${rowNo}</text>`;
  }
  for(let c=0;c<data.width;c++){
   const stitch=data.rows[r][c]||K,x=ox+c*cell,y=oy+r*cell;
   let fill="white";
   if(opts.visual==="blocks"){
    fill={knit:"#fff",purl:"#333",cableR:"#d9d9d9",cableL:"#aaa",twist:"#666"}[stitch]||"#fff";
   }
   svg+=`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${fill}" stroke="#777" stroke-width=".55"/>`;
   if(opts.visual==="symbols"&&PRINT_SYMBOLS[stitch]){
    svg+=`<text x="${x+cell/2}" y="${y+cell*.76}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${cell*.72}" font-weight="700">${PRINT_SYMBOLS[stitch]}</text>`;
   }
  }
 }
 guideLines(data,opts).forEach(line=>{
  const x=ox+line.x*cell;
  const dash=line.type==="quarter"?"3 3":line.type==="underarm"?"6 3":"";
  const stroke=line.type==="center"?"#9b3154":line.type==="underarm"?"#b06f1b":"#3d6a9a";
  svg+=`<line x1="${x}" x2="${x}" y1="${oy}" y2="${oy+chartH}" stroke="${stroke}" stroke-width="1.5"${dash?` stroke-dasharray="${dash}"`:""}/>`;
 });
 if(opts.repeats&&Number(data.spec?.repeatMultiple)>1){
  const repeat=Number(data.spec.repeatMultiple);
  for(let x=0;x<data.width;x+=repeat){
   const end=Math.min(data.width,x+repeat);
   svg+=`<path d="M ${ox+x*cell} ${oy-4} v -5 H ${ox+end*cell} v 5" fill="none" stroke="#704c88" stroke-width="1"/>`;
  }
 }
 let cursor=oy+chartH+16;
 if(opts.notes&&data.notes){
  svg+=`<text x="${left}" y="${cursor}" font-family="Arial,sans-serif" font-size="9" font-weight="700">Notes:</text>`;
  svg+=`<text x="${left+38}" y="${cursor}" font-family="Arial,sans-serif" font-size="9">${printEscape(data.notes).slice(0,180)}</text>`;
  cursor+=notesH;
 }
 if(legendItems.length){
  svg+=`<text x="${left}" y="${cursor}" font-family="Arial,sans-serif" font-size="9" font-weight="700">Legend</text>`;
  let lx=left+48;
  legendItems.forEach(stitch=>{
   svg+=`<rect x="${lx}" y="${cursor-11}" width="12" height="12" fill="white" stroke="#777"/>`;
   if(PRINT_SYMBOLS[stitch])svg+=`<text x="${lx+6}" y="${cursor}" text-anchor="middle" font-family="Arial,sans-serif" font-size="10">${PRINT_SYMBOLS[stitch]}</text>`;
   svg+=`<text x="${lx+17}" y="${cursor}" font-family="Arial,sans-serif" font-size="9">${printEscape(PRINT_STITCH_LABELS[stitch]||stitch)}</text>`;
   lx+=90;
  });
 }
 svg+="</svg>";
 return {svg,width,height,cell};
}
function renderPrintPreview(){
 const host=$("printPreview"),meta=$("printPreviewMeta");
 if(!host)return;
 try{
  const docs=printDocuments(),opts=printOptions();
  host.innerHTML="";
  docs.forEach(data=>{
   const result=makeChartSvg(data,opts,true);
   const page=document.createElement("div");
   page.className="print-preview-page";
   page.innerHTML=result.svg;
   host.appendChild(page);
  });
  const rows=docs.reduce((s,d)=>s+d.rows.length,0);
  meta.textContent=`${docs.length} sheet${docs.length===1?"":"s"} · ${rows} chart rows`;
  $("printStatus").textContent="Preview ready.";
 }catch(error){
  console.error(error);
  host.innerHTML=`<div class="empty">Could not build preview: ${printEscape(error.message)}</div>`;
 }
}
function safeFilename(name){
 return String(name||"gansey-chart").trim().replace(/[^a-z0-9_-]+/gi,"-").replace(/^-+|-+$/g,"").toLowerCase()||"gansey-chart";
}
function downloadBlob(blob,filename){
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportSvg(){
 const docs=printDocuments(),opts=printOptions();
 if(docs.length!==1){
  $("printStatus").textContent="SVG export uses one sheet at a time. Choose Active panel, Selected section, or Selected motif.";
  return;
 }
 const result=makeChartSvg(docs[0],opts);
 downloadBlob(new Blob([result.svg],{type:"image/svg+xml;charset=utf-8"}),safeFilename(docs[0].name)+".svg");
 $("printStatus").textContent="SVG exported.";
}
function exportPng(){
 const docs=printDocuments(),opts=printOptions();
 if(docs.length!==1){
  $("printStatus").textContent="PNG export uses one sheet at a time. Choose Active panel, Selected section, or Selected motif.";
  return;
 }
 const result=makeChartSvg(docs[0],opts),img=new Image();
 const url=URL.createObjectURL(new Blob([result.svg],{type:"image/svg+xml;charset=utf-8"}));
 img.onload=()=>{
  const canvas=document.createElement("canvas");
  canvas.width=Math.ceil(result.width*2);canvas.height=Math.ceil(result.height*2);
  const ctx=canvas.getContext("2d");ctx.scale(2,2);ctx.drawImage(img,0,0);
  URL.revokeObjectURL(url);
  canvas.toBlob(blob=>{
   downloadBlob(blob,safeFilename(docs[0].name)+".png");
   $("printStatus").textContent="PNG exported at 2× resolution.";
  },"image/png");
 };
 img.onerror=()=>{$("printStatus").textContent="PNG export failed.";URL.revokeObjectURL(url)};
 img.src=url;
}
function openPrintDocument(){
 const docs=printDocuments(),opts=printOptions();
 const paper=opts.paper==="a4"?"A4":"letter";
 const orientation=opts.orientation;
 const pages=docs.map(data=>`<section class="sheet">${makeChartSvg(data,opts).svg}</section>`).join("");
 const registration=opts.registration?`
 .sheet:before,.sheet:after{content:"+";position:absolute;font:12px monospace;color:#555}
 .sheet:before{top:4mm;left:4mm}.sheet:after{right:4mm;bottom:4mm}`:"";
 const popup=window.open("","_blank");
 if(!popup){$("printStatus").textContent="The browser blocked the print window. Allow pop-ups and try again.";return}
 popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Gansey Studio Print</title>
 <style>
 @page{size:${paper} ${orientation};margin:10mm}
 *{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:#eee}
 .sheet{position:relative;page-break-after:always;background:white;margin:10px auto;padding:0;width:max-content;max-width:100%}
 .sheet:last-child{page-break-after:auto}.sheet svg{display:block;max-width:100%;height:auto}
 ${registration}
 @media print{body{background:white}.sheet{margin:0;break-after:page}.sheet:last-child{break-after:auto}}
 </style></head><body>${pages}<script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);
 popup.document.close();
 $("printStatus").textContent="Print document opened. Choose “Save as PDF” in the browser print dialog.";
}
[
 "printScope","printPaper","printOrientation","printScale","printRowNumbers","printStitchNumbers",
 "printVisualStyle","printOverlap","printTitle","printLegend","printNotes","printGuides",
 "printSectionLabels","printRepeatBrackets","printRegistration"
].forEach(id=>$(id)?.addEventListener("change",renderPrintPreview));
$("refreshPrintPreview")?.addEventListener("click",renderPrintPreview);
$("printExportSvg")?.addEventListener("click",exportSvg);
$("printExportPng")?.addEventListener("click",exportPng);
$("printSavePdf")?.addEventListener("click",openPrintDocument);
