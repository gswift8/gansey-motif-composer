$("exportLibrary").onclick=()=>{
 const payload={format:"gansey-studio-motif-library",version:1,exportedAt:new Date().toISOString(),motifs};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="gansey-studio-motifs.json";a.click();URL.revokeObjectURL(a.href);
};
$("importLibrary").onchange=e=>{
 const f=e.target.files[0];if(!f)return;
 const r=new FileReader();
 r.onload=()=>{
  try{
   motifs=normalizeLibrary(JSON.parse(r.result));
   selectedMotifId=motifs[0]?.id||null;
   familyOptions();renderLibrary();
   if(motifs[0])loadMotif(motifs[0]);else newMotif();
   renderPanel();
   $("libraryStatus").textContent=`Imported ${motifs.length} motifs from ${f.name}.`;
  }catch(error){alert(`That motif library could not be read: ${error.message}`)}
  e.target.value="";
 };
 r.readAsText(f);
};
$("reloadLibrary").onclick=()=>{
 if(confirm("Reset the current motif library to the hosted motifs.json file? Any unsaved imported or edited library changes will be discarded."))loadExternalLibrary(true);
};

function project(){return {version:20,projectName:$("projectName")?.value||"Untitled Gansey",motifs,panels,targetWidth:+$("targetWidth").value,activePanel,selectedSectionId,assembly:typeof assemblySettings==="function"?assemblySettings():null,measurements:typeof measurementSettings==="function"?measurementSettings():null,panelSpecs:typeof panelSpecifications==="function"?panelSpecifications():null}}
function restore(p){
 motifs=p.motifs||motifs;
 panels=p.panels||panels;
 activePanel=p.activePanel||"Front";
 selectedSectionId=p.selectedSectionId||null;
 $("targetWidth").value=p.targetWidth||49;
 if($("projectName"))$("projectName").value=p.projectName||"Untitled Gansey";
 if(p.assembly){
  if($("assemblyView"))$("assemblyView").value=p.assembly.view||"garment";
  if($("assemblyScale"))$("assemblyScale").value=p.assembly.scale||100;
  if($("assemblyShowEmpty"))$("assemblyShowEmpty").checked=p.assembly.showEmpty!==false;
 }
 if(p.measurements){
  measurementUnit=p.measurements.unit||"in";
  if($("gaugeStitches"))$("gaugeStitches").value=p.measurements.stitches||24;
  if($("gaugeWidth"))$("gaugeWidth").value=p.measurements.swatchWidth||4;
  if($("gaugeRows"))$("gaugeRows").value=p.measurements.rows||32;
  if($("gaugeHeight"))$("gaugeHeight").value=p.measurements.swatchHeight||4;
 }
 if(typeof restorePanelSpecifications==="function")restorePanelSpecifications(p.panelSpecs);
 ensureSections();
 selectedMotifId=null;
 document.querySelectorAll("[data-panel]").forEach(x=>x.classList.toggle("active",x.dataset.panel===activePanel));
 undoStack=[];redoStack=[];familyOptions();renderLibrary();renderPanel();updateHistoryUI()
}
$("exportJson").onclick=()=>{
 const blob=new Blob([JSON.stringify(project(),null,2)],{type:"application/json"}),a=document.createElement("a");
 a.href=URL.createObjectURL(blob);a.download="gansey-studio-project-v0.20.0.json";a.click();URL.revokeObjectURL(a.href)
};
$("importJsonButton").onclick=()=>$("importJson").click();
$("importJson").onchange=e=>{
 const f=e.target.files[0];if(!f)return;const r=new FileReader();
 r.onload=()=>{try{restore(JSON.parse(r.result))}catch(error){alert("That JSON file could not be read.")}};
 r.readAsText(f)
};
$("saveLocal").onclick=()=>{localStorage.setItem("ganseyStudioV200",JSON.stringify(project()));alert("Project saved in this browser.")};
$("loadLocal").onclick=()=>{
 const raw=localStorage.getItem("ganseyStudioV200")||localStorage.getItem("ganseyStudioV190")||localStorage.getItem("ganseyStudioV170")||localStorage.getItem("ganseyStudioV160")||localStorage.getItem("ganseyStudioV150")||localStorage.getItem("ganseyStudioV140")||localStorage.getItem("ganseyStudioV130")||localStorage.getItem("ganseyStudioV120")||localStorage.getItem("ganseyStudioV111")||localStorage.getItem("ganseyStudioV110")||localStorage.getItem("ganseyStudioV100")||localStorage.getItem("ganseyStudioV94")||localStorage.getItem("ganseyStudioV93")||localStorage.getItem("ganseyStudioV92")||localStorage.getItem("ganseyStudioV91")||localStorage.getItem("ganseyStudioV90")||localStorage.getItem("ganseyStudioV84")||localStorage.getItem("ganseyStudioV83")||localStorage.getItem("ganseyStudioV82")||localStorage.getItem("ganseyStudioV81")||localStorage.getItem("ganseyStudioV8")||localStorage.getItem("ganseyStudioV7")||localStorage.getItem("ganseyStudioV4")||localStorage.getItem("ganseyComposerV2");
 raw?restore(JSON.parse(raw)):alert("No saved project found.")
};

