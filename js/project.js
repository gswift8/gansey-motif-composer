
"use strict";

function clonePanelSections(sourceSections,{mirror=false}={}){
 return JSON.parse(JSON.stringify(sourceSections||[])).map(section=>{
  section.id=uid();
  if(Array.isArray(section.items)){
   section.items=section.items.map(raw=>{
    const item=normalizeItem(raw);
    if(item.type==="motif"){
     item.mirrored=mirror?!item.mirrored:item.mirrored;
     if(mirror)item.stitchOffset=-Number(item.stitchOffset||0);
    }
    return item;
   });
   if(mirror)section.items.reverse();
  }
  if(mirror&&section.type==="band"){
   section.offset=-Number(section.offset||0);
  }
  return normalizeSection(section);
 });
}

function panelTotalHeight(panelName){
 const target=Math.max(1,+$("targetWidth").value||1);
 return (panels[panelName]||[]).reduce((sum,section)=>sum+sectionRows(section,target).length,0);
}

function panelMotifCount(panelName){
 return (panels[panelName]||[]).reduce((sum,section)=>
  sum+(Array.isArray(section.items)?section.items.filter(item=>item.type!=="spacer").length:0),0);
}

function createMiniPanelChart(panelName){
 const target=Math.max(1,+$("targetWidth").value||1);
 const sections=panels[panelName]||[];
 const matrix=sections.flatMap(section=>sectionRows(section,target));
 const holder=document.createElement("div");
 holder.className="project-mini-chart";

 if(!matrix.length){
  holder.innerHTML='<div class="project-mini-empty">No sections yet</div>';
  return holder;
 }

 const maxPreviewColumns=36;
 const maxPreviewRows=48;
 const columnStep=Math.max(1,Math.ceil(target/maxPreviewColumns));
 const rowStep=Math.max(1,Math.ceil(matrix.length/maxPreviewRows));
 const sampledRows=matrix.filter((_,index)=>index%rowStep===0);

 const grid=document.createElement("div");
 grid.className="project-mini-grid";
 const previewWidth=Math.ceil(target/columnStep);
 grid.style.gridTemplateColumns=`repeat(${previewWidth},5px)`;

 sampledRows.forEach(row=>{
  const normalized=[...row.slice(0,target),...Array(Math.max(0,target-row.length)).fill(K)].slice(0,target);
  normalized.filter((_,index)=>index%columnStep===0).forEach(stitch=>{
   const cell=document.createElement("span");
   cell.className=`project-mini-cell ${stitch}`;
   grid.appendChild(cell);
  });
 });
 holder.appendChild(grid);
 return holder;
}

function activatePanelFromProject(panelName){
 activePanel=panelName;
 ensureSections();
 document.querySelectorAll("[data-panel]").forEach(button=>
  button.classList.toggle("active",button.dataset.panel===activePanel));
 renderPanel();
 $("projectOverviewCard")?.scrollIntoView({behavior:"smooth",block:"start"});
}

function updateCopyTargetOptions(){
 const select=$("copyPanelTarget");
 if(!select)return;
 [...select.options].forEach(option=>option.disabled=option.value===activePanel);
 if(select.value===activePanel){
  const available=[...select.options].find(option=>!option.disabled);
  if(available)select.value=available.value;
 }
 $("copySourceLabel").textContent=activePanel;
}

function renderProjectOverview(){
 const host=$("projectPanelOverview");
 if(!host)return;
 ensureSections();
 updateCopyTargetOptions();
 host.innerHTML="";

 Object.keys(panels).forEach(panelName=>{
  const sections=panels[panelName]||[];
  const card=document.createElement("button");
  card.type="button";
  card.className="project-panel-card"+(panelName===activePanel?" active":"");
  card.setAttribute("aria-label",`Open ${panelName} panel`);

  const heading=document.createElement("div");
  heading.className="project-panel-heading";
  heading.innerHTML=`<strong>${panelName}</strong><span>${panelName===activePanel?"Editing now":"Open panel"}</span>`;

  const stats=document.createElement("div");
  stats.className="project-panel-stats";
  stats.innerHTML=`
    <span><b>${sections.length}</b> section${sections.length===1?"":"s"}</span>
    <span><b>${panelMotifCount(panelName)}</b> motif block${panelMotifCount(panelName)===1?"":"s"}</span>
    <span><b>${panelTotalHeight(panelName)}</b> rows</span>`;

  card.append(heading,createMiniPanelChart(panelName),stats);
  card.onclick=()=>activatePanelFromProject(panelName);
  host.appendChild(card);
 });
 if(typeof renderGarmentAssembly==="function")renderGarmentAssembly();
 if(typeof renderMeasurements==="function")renderMeasurements();
 if(typeof renderPanelSpecifications==="function")renderPanelSpecifications();
 if(typeof renderSmartLayout==="function")renderSmartLayout();
 if(typeof renderPrintPreview==="function")renderPrintPreview();
 if(typeof renderPatternDraft==="function")renderPatternDraft(true);
}

$("copyPanelButton").onclick=()=>{
 const destination=$("copyPanelTarget").value;
 const mode=$("copyPanelMode").value;
 if(!destination||destination===activePanel)return;

 const destinationHasContent=(panels[destination]||[]).length>0;
 if(destinationHasContent&&!confirm(`${destination} already contains sections. Replace it with a copy of ${activePanel}?`))return;

 remember();
 panels[destination]=clonePanelSections(panels[activePanel],{mirror:mode==="mirror"});
 selectedSectionId=panels[activePanel][0]?.id||selectedSectionId;
 renderPanel();
};

$("projectName").addEventListener("input",()=>{
 document.title=`${$("projectName").value.trim()||"Untitled Gansey"} · Gansey Studio`;
});
