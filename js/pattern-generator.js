
"use strict";

function patternOptions(){
 return {
  scope:$("patternScope")?.value||"project",
  detail:$("patternDetail")?.value||"full",
  units:$("patternUnits")?.value||"in",
  construction:$("patternConstruction")?.value||"seamed",
  gauge:Boolean($("patternIncludeGauge")?.checked),
  legend:Boolean($("patternIncludeLegend")?.checked),
  notes:Boolean($("patternIncludeNotes")?.checked),
  counts:Boolean($("patternIncludeCounts")?.checked),
  assembly:Boolean($("patternIncludeAssembly")?.checked),
  disclaimer:Boolean($("patternIncludeDisclaimer")?.checked),
  designerNotes:$("patternDesignerNotes")?.value||""
 };
}
function patternProjectName(){
 return $("projectName")?.value?.trim()||"Untitled Gansey";
}
function patternGauge(){
 const stitches=Number($("gaugeStitches")?.value)||24;
 const swatchWidth=Number($("gaugeWidth")?.value)||4;
 const rows=Number($("gaugeRows")?.value)||32;
 const swatchHeight=Number($("gaugeHeight")?.value)||4;
 return {
  stitches,swatchWidth,rows,swatchHeight,
  stitchGauge:stitches/swatchWidth,
  rowGauge:rows/swatchHeight
 };
}
function convertPatternLength(value,units){
 return units==="cm"?value*2.54:value;
}
function formatPatternNumber(value){
 return Number.isFinite(value)?String(Math.round(value*10)/10):"—";
}
function panelPatternMetrics(name,units){
 ensureSections();ensurePanelSpecs();
 const spec=panelSpecs[name]||defaultPanelSpec(name);
 const gauge=patternGauge();
 const width=Math.max(1,Number(spec.working)||1);
 const rows=typeof panelTotalHeight==="function"?panelTotalHeight(name):0;
 return {
  name,spec,width,rows,
  finishedWidth:convertPatternLength(width/gauge.stitchGauge,units),
  finishedHeight:convertPatternLength(rows/gauge.rowGauge,units),
  sections:(panels[name]||[])
 };
}
function stitchName(stitch){
 return {knit:"knit",purl:"purl",cableR:"right cable",cableL:"left cable",twist:"twist"}[stitch]||stitch;
}
function sectionUsedStitches(section,width){
 const used=new Set();
 sectionRows(section,width).forEach(row=>row.forEach(stitch=>used.add(stitch)));
 return [...used];
}
function describeSection(section,width,index,detail){
 const rows=sectionRows(section,width);
 const rowCount=rows.length;
 const used=sectionUsedStitches(section,width).map(stitchName);
 const label=`${index+1}. ${section.name}`;
 if(section.type==="divider"){
  return detail==="compact"
   ?`${label}: Work ${rowCount} divider row${rowCount===1?"":"s"} as charted.`
   :`${label}\nWork ${rowCount} divider row${rowCount===1?"":"s"} across all ${width} stitches as charted.`;
 }
 if(section.type==="band"){
  const unit=(horizontalUnitRows(section)[0]||[]).length||1;
  const repeats=Math.floor(width/unit);
  const remainder=width%unit;
  const fit=section.fitMode||"center";
  const fitText=remainder===0
   ?`${repeats} complete repeat${repeats===1?"":"s"}`
   :`${repeats} complete repeats with ${remainder} remaining stitch${remainder===1?"":"es"}, aligned ${fit}`;
  return detail==="compact"
   ?`${label}: Work ${rowCount} rows (${fitText}).`
   :`${label}\nWork the ${rowCount}-row horizontal band across the panel. The chart fits ${fitText}. Stitches used: ${used.join(", ")||"knit"}.`;
 }
 const actual=(section.items||[]).reduce((sum,item)=>sum+itemWidth(item),0);
 const fit=actual===width?"exactly fills the panel":actual<width?`uses ${actual} stitches with ${width-actual} edge/filler stitches`:`extends ${actual-width} stitches beyond the panel width`;
 return detail==="compact"
  ?`${label}: Work ${rowCount} rows; the vertical layout ${fit}.`
  :`${label}\nWork ${rowCount} rows following the vertical-band chart. The arranged blocks ${fit}. Stitches used: ${used.join(", ")||"knit"}.`;
}
function panelPatternText(metrics,opts){
 const {name,spec,width,rows,finishedWidth,finishedHeight,sections}=metrics;
 const unit=opts.units==="cm"?"cm":"in";
 const lines=[];
 lines.push(`# ${name}`);
 lines.push("");
 lines.push(`Cast on ${Math.max(1,Number(spec.castOn)||width)} stitches.`);
 if(Number(spec.castOn)!==width){
  lines.push(`Adjust to ${width} working stitches before beginning the charted panel.`);
 }
 lines.push(`Work the panel over ${width} stitches for ${rows} chart rows.`);
 lines.push(`Approximate charted dimensions: ${formatPatternNumber(finishedWidth)} ${unit} wide × ${formatPatternNumber(finishedHeight)} ${unit} high.`);
 lines.push(`Construction: ${spec.construction==="round"?"work in the round":"work flat"}.`);
 if(Number(spec.selvage)>0)lines.push(`Maintain ${spec.selvage} selvage stitch${Number(spec.selvage)===1?"":"es"} at each side.`);
 if(Number(spec.underarm)>0)lines.push(`The specification reserves ${spec.underarm} underarm stitch${Number(spec.underarm)===1?"":"es"}.`);
 if(spec.centerMode)lines.push(`Center alignment: ${spec.centerMode==="stitch"?"on a center stitch":"between two center stitches"}.`);
 lines.push("");
 lines.push("## Chart sequence");
 lines.push("");
 if(!sections.length){
  lines.push("No chart sections have been added to this panel.");
 }else{
  sections.forEach((section,index)=>{
   lines.push(describeSection(section,width,index,opts.detail));
   lines.push("");
   if(opts.counts)lines.push(`Checkpoint after section ${index+1}: ${width} stitches remain.\n`);
  });
 }
 if(opts.notes&&spec.notes){
  lines.push("## Panel notes");
  lines.push("");
  lines.push(spec.notes);
  lines.push("");
 }
 lines.push(`Finish with ${Math.max(1,Number(spec.finished)||width)} stitches, adjusting evenly if necessary.`);
 return lines.join("\n");
}
function patternLegend(panelNames){
 const used=new Set();
 panelNames.forEach(name=>{
  const width=Math.max(1,Number(panelSpecs?.[name]?.working)||1);
  (panels[name]||[]).forEach(section=>sectionUsedStitches(section,width).forEach(stitch=>used.add(stitch)));
 });
 if(!used.size)return "";
 return ["# Stitch legend","",...[...used].map(stitch=>`- ${stitchName(stitch)}`),""].join("\n");
}
function assemblyText(panelNames){
 const lines=["# Assembly",""];
 if(panelNames.includes("Front")&&panelNames.includes("Back")){
  lines.push("Block the Front and Back to the specified measurements.");
  lines.push("Join shoulders, matching centerlines and chart sections where intended.");
  lines.push("Sew side seams, leaving the required armhole opening.");
 }
 if(panelNames.includes("Sleeve")){
  lines.push("Block sleeves to the specified dimensions and attach them evenly around the armholes.");
  lines.push("Sew sleeve seams when worked flat.");
 }
 if(panelNames.includes("Gusset"))lines.push("Insert gussets at the underarms according to the intended construction.");
 if(panelNames.includes("Shoulder"))lines.push("Attach or graft shoulder pieces according to the project design.");
 lines.push("Weave in ends and wet block the completed garment.");
 return lines.join("\n");
}
function generatePatternText(){
 ensureSections();ensurePanelSpecs();
 const opts=patternOptions();
 const names=opts.scope==="panel"?[activePanel]:["Front","Back","Sleeve","Gusset","Shoulder"];
 const gauge=patternGauge();
 const unit=opts.units==="cm"?"cm":"in";
 const lines=[`# ${patternProjectName()}`,"","Generated by Gansey Studio v0.20.0",""];
 if(opts.designerNotes.trim()){
  lines.push("## Designer notes","",opts.designerNotes.trim(),"");
 }
 if(opts.gauge){
  lines.push("# Gauge and measurements","");
  lines.push(`${formatPatternNumber(gauge.stitchGauge)} stitches per ${opts.units==="cm"?"2.54 cm":"1 in"} and ${formatPatternNumber(gauge.rowGauge)} rows per ${opts.units==="cm"?"2.54 cm":"1 in"}, based on a ${gauge.stitches}-stitch × ${gauge.rows}-row swatch.`);
  if(names.includes("Front")&&names.includes("Back")){
   const front=panelPatternMetrics("Front",opts.units);
   const back=panelPatternMetrics("Back",opts.units);
   lines.push(`Approximate charted body circumference: ${formatPatternNumber(front.finishedWidth+back.finishedWidth)} ${unit}.`);
  }
  lines.push("");
 }
 names.forEach(name=>{
  lines.push(panelPatternText(panelPatternMetrics(name,opts.units),opts),"");
 });
 if(opts.legend)lines.push(patternLegend(names));
 if(opts.assembly&&opts.scope==="project")lines.push(assemblyText(names),"");
 if(opts.disclaimer){
  lines.push("# Draft notice","");
  lines.push("This is an automatically generated working draft. Verify stitch counts, row counts, construction order, shaping, ease, seam allowances, chart orientation, and finishing instructions before knitting or publishing.");
 }
 return lines.join("\n").replace(/\n{3,}/g,"\n\n").trim()+"\n";
}
function renderPatternDraft(force=true){
 const draft=$("patternDraft"),meta=$("patternDraftMeta");
 if(!draft)return;
 const text=generatePatternText();
 if(force||!draft.value.trim())draft.value=text;
 const words=text.trim()?text.trim().split(/\s+/).length:0;
 const lines=text.split("\n").length;
 meta.textContent=`${words} words · ${lines} lines`;
 $("patternStatus").textContent="Pattern draft generated.";
}
function downloadPattern(extension,mime){
 const text=$("patternDraft")?.value||generatePatternText();
 const blob=new Blob([text],{type:mime});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;
 a.download=(patternProjectName().replace(/[^a-z0-9_-]+/gi,"-").replace(/^-+|-+$/g,"").toLowerCase()||"gansey-pattern")+extension;
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function copyPattern(){
 const text=$("patternDraft")?.value||"";
 try{
  await navigator.clipboard.writeText(text);
  $("patternStatus").textContent="Pattern copied to the clipboard.";
 }catch{
  $("patternDraft").select();
  document.execCommand("copy");
  $("patternStatus").textContent="Pattern copied.";
 }
}
function printPattern(){
 const text=$("patternDraft")?.value||generatePatternText();
 const popup=window.open("","_blank");
 if(!popup){$("patternStatus").textContent="The browser blocked the print window.";return}
 popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${patternProjectName()}</title>
 <style>@page{margin:18mm}body{font:11pt/1.45 Georgia,serif;max-width:760px;margin:auto;padding:20px;color:#111}pre{white-space:pre-wrap;font:inherit}h1,h2,h3{font-family:Arial,sans-serif}@media print{body{padding:0}}</style>
 </head><body><pre>${String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre><script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);
 popup.document.close();
 $("patternStatus").textContent="Print document opened. Choose Save as PDF in the browser dialog.";
}
[
 "patternScope","patternDetail","patternUnits","patternConstruction","patternIncludeGauge",
 "patternIncludeLegend","patternIncludeNotes","patternIncludeCounts","patternIncludeAssembly",
 "patternIncludeDisclaimer","patternDesignerNotes"
].forEach(id=>{
 const el=$(id);
 if(!el)return;
 el.addEventListener(id==="patternDesignerNotes"?"input":"change",()=>renderPatternDraft(true));
});
$("refreshPatternDraft")?.addEventListener("click",()=>renderPatternDraft(true));
$("patternCopy")?.addEventListener("click",copyPattern);
$("patternDownloadTxt")?.addEventListener("click",()=>downloadPattern(".txt","text/plain;charset=utf-8"));
$("patternDownloadMd")?.addEventListener("click",()=>downloadPattern(".md","text/markdown;charset=utf-8"));
$("patternPrint")?.addEventListener("click",printPattern);
