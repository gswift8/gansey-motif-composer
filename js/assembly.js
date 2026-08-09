
"use strict";

function assemblySettings(){
 return {
  view:$("assemblyView")?.value||"garment",
  scale:Number($("assemblyScale")?.value||100),
  showEmpty:Boolean($("assemblyShowEmpty")?.checked)
 };
}

function panelMatrix(panelName){
 const target=Math.max(1,+$("targetWidth").value||1);
 const matrix=(panels[panelName]||[]).flatMap(section=>sectionRows(section,target));
 return shapedPanelMatrix(panelName,matrix,target);
}

function panelChartCellCount(panelName){
 const target=Math.max(1,+$("targetWidth").value||1);
 return target*panelTotalHeight(panelName);
}

function createAssemblyPreview(panelName,instanceLabel=panelName){
 const matrix=panelMatrix(panelName);
 const target=Math.max(1,+$("targetWidth").value||1);
 const button=document.createElement("button");
 button.type="button";
 button.className="assembly-panel";
 button.dataset.panel=panelName;
 button.setAttribute("aria-label",`Open ${panelName} panel`);

 const header=document.createElement("div");
 header.className="assembly-panel-header";
 header.innerHTML=`<strong>${instanceLabel}</strong><span>${target} sts × ${matrix.length} rows</span>`;

 const chart=document.createElement("div");
 chart.className="assembly-chart";

 if(!matrix.length){
  chart.innerHTML='<div class="assembly-empty">No chart yet</div>';
 }else{
  const maxColumns=32;
  const maxRows=42;
  const columnStep=Math.max(1,Math.ceil(target/maxColumns));
  const rowStep=Math.max(1,Math.ceil(matrix.length/maxRows));
  const sampled=matrix.filter((_,i)=>i%rowStep===0);
  const grid=document.createElement("div");
  grid.className="assembly-grid";
  grid.style.gridTemplateColumns=`repeat(${Math.ceil(target/columnStep)},var(--assembly-cell))`;

  sampled.forEach(row=>{
   const normalized=[...row.slice(0,target),...Array(Math.max(0,target-row.length)).fill(K)].slice(0,target);
   normalized.filter((_,i)=>i%columnStep===0).forEach(stitch=>{
    const cell=document.createElement("span");
    cell.className=`assembly-cell ${stitch}`;
    grid.appendChild(cell);
   });
  });
  chart.appendChild(grid);
 }

 button.append(header,chart);
 button.onclick=()=>{
  activePanel=panelName;
  ensureSections();
  document.querySelectorAll("[data-panel]").forEach(tab=>
   tab.classList.toggle("active",tab.dataset.panel===activePanel));
  renderPanel();
  $("sectionComposerScroll")?.scrollIntoView({behavior:"smooth",block:"start"});
 };
 return button;
}

function renderAssemblyMetrics(){
 const host=$("assemblyMetrics");
 if(!host)return;
 const target=Math.max(1,+$("targetWidth").value||1);
 const totalRows=Object.keys(panels).reduce((sum,name)=>sum+panelTotalHeight(name),0);
 const totalCells=Object.keys(panels).reduce((sum,name)=>sum+panelChartCellCount(name),0);
 const completed=Object.keys(panels).filter(name=>(panels[name]||[]).length&&panelTotalHeight(name)>0).length;

 host.innerHTML=`
  <div><span>Current panel width</span><strong>${target} stitches</strong></div>
  <div><span>Panels with chart data</span><strong>${completed} of ${Object.keys(panels).length}</strong></div>
  <div><span>Total designed rows</span><strong>${totalRows.toLocaleString()}</strong></div>
  <div><span>Total chart cells</span><strong>${totalCells.toLocaleString()}</strong></div>`;
}

function renderGarmentAssembly(){
 const host=$("garmentAssembly");
 if(!host)return;
 ensureSections();
 const settings=assemblySettings();
 host.innerHTML="";
 host.className=`garment-assembly ${settings.view==="exploded"?"exploded-view":"garment-view"}`;
 host.style.setProperty("--assembly-scale",settings.scale/100);

 const specs=settings.view==="exploded"
  ?[
    ["Front","Front","front"],
    ["Back","Back","back"],
    ["Sleeve","Sleeve A","sleeve-left"],
    ["Sleeve","Sleeve B","sleeve-right"],
    ["Gusset","Gusset A","gusset-left"],
    ["Gusset","Gusset B","gusset-right"],
    ["Shoulder","Shoulder A","shoulder-left"],
    ["Shoulder","Shoulder B","shoulder-right"]
   ]
  :[
    ["Shoulder","Left shoulder","shoulder-left"],
    ["Shoulder","Right shoulder","shoulder-right"],
    ["Sleeve","Left sleeve","sleeve-left"],
    ["Front","Front","front"],
    ["Back","Back","back"],
    ["Sleeve","Right sleeve","sleeve-right"],
    ["Gusset","Left gusset","gusset-left"],
    ["Gusset","Right gusset","gusset-right"]
   ];

 specs.forEach(([panel,label,area])=>{
  if(!settings.showEmpty&&panelTotalHeight(panel)===0)return;
  const preview=createAssemblyPreview(panel,label);
  preview.style.gridArea=area;
  host.appendChild(preview);
 });

 if(!host.children.length){
  host.innerHTML='<div class="assembly-all-empty">No populated panels to show. Turn on “Show empty panels” or add chart sections.</div>';
 }
 renderAssemblyMetrics();
}

["assemblyView","assemblyScale","assemblyShowEmpty"].forEach(id=>{
 $(id)?.addEventListener("input",renderGarmentAssembly);
 $(id)?.addEventListener("change",renderGarmentAssembly);
});
