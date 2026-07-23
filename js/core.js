const $=id=>document.getElementById(id);
const uid=()=>crypto.randomUUID();
let activeStitch="knit", editorData=[], selectedMotifId=null, activePanel="Front", selectedSectionId=null;
let panels={Front:[],Back:[],Sleeve:[],Gusset:[],Shoulder:[]};
let undoStack=[],redoStack=[],historyLock=false,dragIndex=null;


function makeFieldSection(items=[]){
 return {id:uid(),type:"field",name:"Vertical band",heightMode:"auto",height:18,items:items.map(normalizeItem)};
}
function makeBandSection(items=[]){
 const migrated=Array.isArray(items)?items:(items?[{type:"motif",motifId:items}]:[]);
 return {id:uid(),type:"band",name:"Horizontal band",items:migrated.map(normalizeItem),
   verticalRepeats:1,fitMode:"center",offset:0,filler:K,mirrorAlternate:false};
}
function makeDividerSection(){
 return {id:uid(),type:"divider",name:"Row divider",rows:2,stitch:P};
}
function normalizeSection(raw){
 if(!raw||!raw.type)return makeFieldSection([]);
 if(raw.type==="field"||raw.type==="vertical"){
  return Object.assign(makeFieldSection([]),raw,{type:"field",name:raw.name==="Field section"?"Vertical band":(raw.name||"Vertical band"),items:(raw.items||[]).map(normalizeItem)});
 }
 if(raw.type==="band"||raw.type==="horizontal"){
  const legacyItems=raw.items||(raw.motifId?[{type:"motif",motifId:raw.motifId}]:[]);
  const clean=Object.assign(makeBandSection([]),raw,{type:"band",name:raw.name||"Horizontal band",items:legacyItems.map(normalizeItem)});
  delete clean.motifId;
  return clean;
 }
 if(raw.type==="divider")return Object.assign(makeDividerSection(),raw);
 return makeFieldSection([]);
}
function ensureSections(){
 Object.keys(panels).forEach(k=>{
  const value=Array.isArray(panels[k])?panels[k]:[];
  const looksOld=value.length&&value.every(x=>x&&(x.type==="motif"||x.type==="spacer"));
  if(looksOld)panels[k]=[makeFieldSection(value)];
  else panels[k]=value.map(normalizeSection);
 });
 if(!panels[activePanel].length){
  const section=makeFieldSection([]);
  panels[activePanel].push(section);
  selectedSectionId=section.id;
 }
 if(!panels[activePanel].some(s=>s.id===selectedSectionId))selectedSectionId=panels[activePanel][0]?.id||null;
}
function activeSection(){ensureSections();return panels[activePanel].find(s=>s.id===selectedSectionId)||panels[activePanel][0]||null}
function snapshot(){return JSON.stringify({panels,targetWidth:+$("targetWidth").value,activePanel,selectedSectionId})}
function remember(){if(historyLock)return;undoStack.push(snapshot());if(undoStack.length>80)undoStack.shift();redoStack=[];updateHistoryUI()}
function applySnapshot(raw){
 historyLock=true;
 const s=JSON.parse(raw);
 panels=s.panels||panels;
 $("targetWidth").value=s.targetWidth||49;
 activePanel=s.activePanel||activePanel;
 selectedSectionId=s.selectedSectionId||null;
 ensureSections();
 document.querySelectorAll("[data-panel]").forEach(x=>x.classList.toggle("active",x.dataset.panel===activePanel));
 renderPanel();
 historyLock=false;
 updateHistoryUI();
}
function undo(){if(!undoStack.length)return;redoStack.push(snapshot());applySnapshot(undoStack.pop())}
function redo(){if(!redoStack.length)return;undoStack.push(snapshot());applySnapshot(redoStack.pop())}
function updateHistoryUI(){$("undoBtn").disabled=!undoStack.length;$("redoBtn").disabled=!redoStack.length;$("historyStatus").textContent=`${undoStack.length} undo step${undoStack.length===1?"":"s"}`}

const K="knit",P="purl",CR="cableR",CL="cableL",T="twist";
function matrixFromStrings(lines){
 return lines.map(line=>[...line].map(ch=>({".":K,"o":P,"/":CR,"\\":CL,"x":T}[ch]||K)));
}
function motif(name,family,tags,lines,favorite=false){
 const data=matrixFromStrings(lines);
 return {id:uid(),name,family,tags,favorite,width:data[0].length,height:data.length,
 repeat:{x:1,y:1,width:data[0].length,height:data.length},data};
}
let motifs=[];
const emergencyMotifs=[
 {
  id:"emergency-seed",name:"Seed Stitch",family:"Background Patterns",
  tags:["seed","background","texture"],favorite:true,width:2,height:2,
  repeat:{x:1,y:1,width:2,height:2},data:[[P,K],[K,P]]
 }
];

function validateMotif(raw,index=0){
 const data=Array.isArray(raw.data)?raw.data.map(row=>Array.isArray(row)?row.map(v=>[K,P,CR,CL,T].includes(v)?v:K):[]):[];
 const height=data.length;
 const width=height?Math.max(...data.map(row=>row.length)):0;
 if(!width||!height)throw new Error(`Motif ${index+1} has no valid chart data.`);
 data.forEach(row=>{while(row.length<width)row.push(K)});
 const repeat=raw.repeat||{};
 return {
  id:String(raw.id||uid()),
  name:String(raw.name||`Untitled Motif ${index+1}`),
  family:String(raw.family||"Other"),
  tags:Array.isArray(raw.tags)?raw.tags.map(String):[],
  favorite:Boolean(raw.favorite),
  width,
  height,
  repeat:{
   x:Math.max(1,Math.min(width,Number(repeat.x)||1)),
   y:Math.max(1,Math.min(height,Number(repeat.y)||1)),
   width:Math.max(1,Math.min(width,Number(repeat.width)||width)),
   height:Math.max(1,Math.min(height,Number(repeat.height)||height))
  },
  data
 };
}

function normalizeLibrary(payload){
 const list=Array.isArray(payload)?payload:payload?.motifs;
 if(!Array.isArray(list))throw new Error("The library file must be an array of motifs or an object with a motifs array.");
 return list.map(validateMotif);
}

async function loadExternalLibrary(showMessage=true){
 const status=$("libraryStatus");
 if(showMessage)status.textContent="Loading motifs.json…";
 try{
  const response=await fetch("motifs.json",{cache:"no-store"});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const payload=await response.json();
  motifs=normalizeLibrary(payload);
  if(showMessage)status.textContent=`Loaded ${motifs.length} motifs from motifs.json.`;
 }catch(error){
  motifs=emergencyMotifs.map(validateMotif);
  if(showMessage)status.textContent="Could not load motifs.json. Using the emergency starter motif. Upload both index.html and motifs.json to the same folder.";
  console.error("Motif library load failed:",error);
 }
 selectedMotifId=motifs[0]?.id||null;
 familyOptions();
 renderLibrary();
 if(motifs[0])loadMotif(motifs[0]);
 renderPanel();
}


