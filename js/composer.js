function control(label,html){return `<label>${label}${html}</label>`}

function renderBandItems(section,host){
 const panel=section.items;
 const list=document.createElement("div");list.className="panel-list";
 if(!panel.length)list.innerHTML='<div class="drop-hint">Drag motifs here, use “Add selected motif,” or add a spacer. Reorder blocks by dragging.</div>';
 list.ondragover=e=>{e.preventDefault();list.classList.add("drag-over")};
 list.ondragleave=e=>{if(!list.contains(e.relatedTarget))list.classList.remove("drag-over")};
 list.ondrop=e=>{
  e.preventDefault();list.classList.remove("drag-over");
  const motifId=e.dataTransfer.getData("application/x-gansey-motif");
  if(motifId){remember();panel.push(normalizeItem({type:"motif",motifId}));renderPanel()}
 };
 panel.forEach((raw,index)=>{
  const item=normalizeItem(raw);panel[index]=item;
  const block=document.createElement("div");block.className="panel-block"+(item.type==="spacer"?" spacer-card":"");block.dataset.sectionId=section.id;block.dataset.blockIndex=String(index);block.draggable=true;
  block.ondragstart=e=>{
   if(e.target.closest("button,input,select,label")){e.preventDefault();return}
   dragIndex=index;block.classList.add("dragging");e.dataTransfer.effectAllowed="move"
  };
  block.ondragend=()=>{dragIndex=null;block.classList.remove("dragging")};
  block.ondragover=e=>{if(dragIndex===null||dragIndex===index)return;e.preventDefault()};
  block.ondrop=e=>{
   if(dragIndex===null||dragIndex===index)return;e.preventDefault();e.stopPropagation();remember();
   const moved=panel.splice(dragIndex,1)[0];panel.splice(index,0,moved);dragIndex=null;renderPanel()
  };
  if(item.type==="spacer"){
   block.innerHTML=`<button class="remove danger">×</button><span class="block-type">SPACER</span><h3>${item.stitch===P?"Purl":"Knit"} spacer</h3><div class="meta">${item.width} sts · fills section height</div>`;
   const controls=document.createElement("div");controls.className="block-controls";
   controls.innerHTML=control("Width",`<input data-field="width" type="number" min="1" value="${item.width}">`)+
     control("Texture",`<select data-field="stitch"><option value="knit"${item.stitch===K?" selected":""}>Knit</option><option value="purl"${item.stitch===P?" selected":""}>Purl</option></select>`);
   block.appendChild(controls);
  }else{
   const m=motifs.find(x=>x.id===item.motifId);
   if(!m)return;
   const d=motifTile(item);
   block.innerHTML=`<button class="remove danger">×</button><span class="block-type">MOTIF</span><h3>${m.name}</h3><div class="meta">${itemWidth(item)} sts · ${m.repeat.height}-row unit</div>`;
   block.appendChild(motifPreview({...m,repeat:{x:1,y:1,width:d[0].length,height:d.length}},d));
   const controls=document.createElement("div");controls.className="block-controls";
   controls.innerHTML=
    control("Horizontal repeats",`<input data-field="hRepeat" type="number" min="1" value="${item.hRepeat}">`)+
    control("Vertical behavior",`<select data-field="vMode"><option value="count"${item.vMode==="count"?" selected":""}>Set repeats</option><option value="fill"${item.vMode==="fill"?" selected":""}>Fill section height</option></select>`)+
    control("Vertical repeats",`<input data-field="vRepeat" type="number" min="1" value="${item.vRepeat}" ${item.vMode==="fill"?"disabled":""}>`)+
    control("Alignment",`<select data-field="align"><option value="top"${item.align==="top"?" selected":""}>Top</option><option value="center"${item.align==="center"?" selected":""}>Center</option><option value="bottom"${item.align==="bottom"?" selected":""}>Bottom</option></select>`)+
    control("Row offset",`<input data-field="rowOffset" type="number" value="${item.rowOffset}">`)+
    control("Unused rows",`<select data-field="fillStitch"><option value="knit"${item.fillStitch===K?" selected":""}>Knit</option><option value="purl"${item.fillStitch===P?" selected":""}>Purl</option></select>`)+
    control("Gap before",`<input data-field="gapBefore" type="number" min="0" value="${item.gapBefore}">`)+
    control("Gap after",`<input data-field="gapAfter" type="number" min="0" value="${item.gapAfter}">`);
   block.appendChild(controls);
  }
  const tools=document.createElement("div");tools.className="panel-toolbar";
  tools.innerHTML=(item.type==="motif"?'<button type="button" data-block-action="mirror">Mirror</button>':'')+'<button type="button" data-block-action="duplicate">Duplicate</button><button type="button" data-block-action="left">← Move</button><button type="button" data-block-action="right">Move →</button>';

  block.appendChild(tools);
  block.querySelector(".remove").onclick=e=>{
   e.preventDefault();e.stopPropagation();
   const card=e.target.closest(".panel-block");
   const section=panels[activePanel].find(s=>s.id===card?.dataset.sectionId);
   const blockIndex=Number(card?.dataset.blockIndex);
   if(!section||!Array.isArray(section.items)||!section.items[blockIndex])return;
   remember();section.items.splice(blockIndex,1);selectedSectionId=section.id;renderPanel();
  };
  block.querySelectorAll("[data-field]").forEach(el=>el.onchange=()=>{
   remember();item[el.dataset.field]=el.tagName==="INPUT"?Number(el.value):el.value;renderPanel()
  });
  list.appendChild(block);
 });
 host.appendChild(list);
 const breakdown=document.createElement("div");breakdown.className="width-breakdown";
 panel.forEach((raw,i)=>{
  const item=normalizeItem(raw),m=item.type==="spacer"?null:motifs.find(x=>x.id===item.motifId),chip=document.createElement("span");
  chip.className="width-chip";chip.innerHTML=`<strong>${i+1}.</strong> ${item.type==="spacer"?(item.stitch===P?"Purl spacer":"Knit spacer"):(m?.name||"Motif")}: ${itemWidth(item)} sts`;
  breakdown.appendChild(chip)
 });
 host.appendChild(breakdown);
}


function renderLayoutTree(){
 const tree=$("layoutTree");if(!tree)return;
 tree.innerHTML="";
 ensureSections();
 panels[activePanel].forEach((section,si)=>{
  const row=document.createElement("div");row.className="tree-section"+(section.id===selectedSectionId?" active":"");
  row.innerHTML=`<span class="tree-icon">${section.type==="field"?"↕":section.type==="band"?"↔":"—"}</span><span>${si+1}. ${section.name}</span><span class="small">${sectionHeight(section)} rows</span>`;
  row.onclick=()=>{selectedSectionId=section.id;renderPanel()};tree.appendChild(row);
  (section.items||[]).forEach((item,bi)=>{
   const block=document.createElement("div");block.className="tree-block";
   const m=item.type==="motif"?motifs.find(x=>x.id===item.motifId):null;
   block.innerHTML=`<span class="tree-icon">${item.type==="spacer"?"□":"◆"}</span><span>${m?.name||(item.stitch===P?"Purl spacer":"Knit spacer")}</span><span class="small">${itemWidth(item)} sts</span>`;
   block.onclick=()=>{selectedSectionId=section.id;renderPanel();setTimeout(()=>document.querySelectorAll(".section-card")[si]?.scrollIntoView({behavior:"smooth",block:"start"}),0)};
   tree.appendChild(block);
  });
 });
 if(!tree.children.length)tree.innerHTML='<div class="small">No sections yet.</div>';
}


$("sectionStack").addEventListener("click",e=>{
 const button=e.target.closest("button[data-add-spacer]");
 if(!button)return;
 e.preventDefault();
 e.stopPropagation();
 const sectionId=button.dataset.sectionId;
 const section=panels[activePanel].find(s=>s.id===sectionId);
 if(!section||!Array.isArray(section.items))return;
 remember();
 section.items.push({
  type:"spacer",
  width:Math.max(1,Number($("spacerWidth").value)||1),
  stitch:button.dataset.addSpacer==="purl"?P:K
 });
 selectedSectionId=section.id;
 $("composerStatus").textContent=`Added ${button.dataset.addSpacer==="purl"?"purl":"knit"} spacer (${Math.max(1,Number($("spacerWidth").value)||1)} sts).`;
 renderPanel();
});


$("sectionStack").addEventListener("click",e=>{
 const button=e.target.closest("button[data-block-action]");
 if(!button)return;
 e.preventDefault();
 e.stopPropagation();

 const card=button.closest(".panel-block");
 if(!card)return;

 const section=panels[activePanel].find(s=>s.id===card.dataset.sectionId);
 const index=Number(card.dataset.blockIndex);
 if(!section||!Array.isArray(section.items)||!Number.isInteger(index)||!section.items[index])return;

 const action=button.dataset.blockAction;
 remember();

 if(action==="mirror"){
  section.items[index].mirrored=!section.items[index].mirrored;
 }
 if(action==="duplicate"){
  const copy=JSON.parse(JSON.stringify(section.items[index]));
  section.items.splice(index+1,0,copy);
  $("composerStatus").textContent="Duplicated block.";
 }
 if(action==="left"&&index>0){
  [section.items[index-1],section.items[index]]=[section.items[index],section.items[index-1]];
 }
 if(action==="right"&&index<section.items.length-1){
  [section.items[index+1],section.items[index]]=[section.items[index],section.items[index+1]];
 }

 selectedSectionId=section.id;
 renderPanel();
});

function renderPanel(){
 ensureSections();
 const sections=panels[activePanel],stack=$("sectionStack");stack.innerHTML="";
 renderLayoutTree();
 const target=Math.max(1,+$("targetWidth").value||1);
 sections.forEach((section,index)=>{
  const card=document.createElement("div");
  card.className="section-card"+(section.id===selectedSectionId?" active-section":"");
  card.onclick=e=>{if(!e.target.closest("button,input,select,label")){selectedSectionId=section.id;renderPanel()}};
  const head=document.createElement("div");head.className="section-head";
  const title=document.createElement("div");
  title.innerHTML=`<span class="section-badge">${section.type==="field"?"VERTICAL BAND":section.type==="band"?"HORIZONTAL BAND":"ROW DIVIDER"}</span><h3>${section.name||"Section"}</h3><div class="section-summary">${sectionHeight(section)} rows</div>`;
  const tools=document.createElement("div");tools.className="section-tools";
  tools.innerHTML='<button data-s="select">Select</button><button data-s="duplicate">Duplicate</button><button data-s="up">↑</button><button data-s="down">↓</button><button class="danger" data-s="delete">Delete</button>';
  tools.querySelectorAll("button[data-s]").forEach(button=>{
   button.onclick=e=>{
    e.preventDefault();e.stopPropagation();
    const a=button.dataset.s;
    if(a==="select"){selectedSectionId=section.id;renderPanel();return}
    remember();
    if(a==="duplicate"){const copy=JSON.parse(JSON.stringify(section));copy.id=uid();sections.splice(index+1,0,copy);selectedSectionId=copy.id}
    if(a==="up"&&index>0)[sections[index-1],sections[index]]=[sections[index],sections[index-1]];
    if(a==="down"&&index<sections.length-1)[sections[index+1],sections[index]]=[sections[index],sections[index+1]];
    if(a==="delete"){sections.splice(index,1);selectedSectionId=sections[Math.min(index,sections.length-1)]?.id||null}
    renderPanel();
   };
  });
  head.append(title,tools);card.appendChild(head);

  if(section.type==="field"){
   const settings=document.createElement("div");settings.className="section-settings";
   settings.innerHTML=
    control("Band name",`<input data-sec="name" type="text" value="${section.name||"Vertical band"}">`)+
    control("Height",`<select data-sec="heightMode"><option value="auto"${section.heightMode==="auto"?" selected":""}>Auto: tallest block</option><option value="fixed"${section.heightMode==="fixed"?" selected":""}>Fixed rows</option></select>`)+
    control("Fixed rows",`<input data-sec="height" type="number" min="1" value="${section.height}" ${section.heightMode!=="fixed"?"disabled":""}>`)+
    control("Current width",`<input value="${section.items.reduce((s,i)=>s+itemWidth(i),0)} / ${target} sts" disabled>`);
   card.appendChild(settings);
   const actions=document.createElement("div");actions.className="builder-actions";
   actions.innerHTML=`<button type="button" class="ghost" data-add-spacer="knit" data-section-id="${section.id}">+ Knit spacer</button><button type="button" class="ghost" data-add-spacer="purl" data-section-id="${section.id}">+ Purl spacer</button><span class="small">Blocks extend vertically according to their own repeat and alignment settings.</span>`;
   card.appendChild(actions);
   renderBandItems(section,card);
  }else if(section.type==="band"){
   const unitW=(horizontalUnitRows(section)[0]||[]).length;
   const settings=document.createElement("div");settings.className="section-settings";
   settings.innerHTML=
    control("Band name",`<input data-sec="name" type="text" value="${section.name||"Horizontal band"}">`)+
    control("Vertical repeats",`<input data-sec="verticalRepeats" type="number" min="1" value="${section.verticalRepeats}">`)+
    control("Fit across width",`<select data-sec="fitMode"><option value="center"${section.fitMode==="center"?" selected":""}>Center whole units</option><option value="left"${section.fitMode==="left"?" selected":""}>Start at left</option><option value="custom"${section.fitMode==="custom"?" selected":""}>Custom offset</option></select>`)+
    control("Left offset",`<input data-sec="offset" type="number" min="0" value="${section.offset}" ${section.fitMode!=="custom"?"disabled":""}>`)+
    control("Edge filler",`<select data-sec="filler"><option value="knit"${section.filler===K?" selected":""}>Knit</option><option value="purl"${section.filler===P?" selected":""}>Purl</option></select>`)+
    control("Repeated units",`<select data-sec="mirrorAlternate"><option value="false"${!section.mirrorAlternate?" selected":""}>Normal</option><option value="true"${section.mirrorAlternate?" selected":""}>Mirror every other</option></select>`)+
    control("Unit width",`<input value="${unitW} sts" disabled>`);
   card.appendChild(settings);
   const actions=document.createElement("div");actions.className="builder-actions";
   actions.innerHTML=`<button type="button" class="ghost" data-add-spacer="knit" data-section-id="${section.id}">+ Knit spacer</button><button type="button" class="ghost" data-add-spacer="purl" data-section-id="${section.id}">+ Purl spacer</button><span class="small">These blocks form one unit; the complete unit repeats across the panel.</span>`;
   card.appendChild(actions);
   renderBandItems(section,card);
   const leftover=unitW?target%unitW:target;
   if(unitW&&leftover){
    const warn=document.createElement("div");warn.className="section-warning";
    warn.textContent=`The composed unit is ${unitW} stitches wide. ${leftover} stitch${leftover===1?"":"es"} will be filled at the edge${section.fitMode==="center"?"s":""}.`;
    card.appendChild(warn);
   }
   const preview=document.createElement("div");preview.className="band-preview";
   const rows=bandRows(section,target),grid=document.createElement("div");grid.className="band-grid";grid.style.gridTemplateColumns=`repeat(${target},12px)`;
   rows.forEach(row=>row.forEach(v=>{const c=document.createElement("div");c.className="band-cell "+v;grid.appendChild(c)}));preview.appendChild(grid);card.appendChild(preview);
  }else{
   const settings=document.createElement("div");settings.className="section-settings";
   settings.innerHTML=
    control("Section name",`<input data-sec="name" type="text" value="${section.name||"Row divider"}">`)+
    control("Rows",`<input data-sec="rows" type="number" min="1" value="${section.rows}">`)+
    control("Texture",`<select data-sec="stitch"><option value="knit"${section.stitch===K?" selected":""}>Knit</option><option value="purl"${section.stitch===P?" selected":""}>Purl</option></select>`);
   card.appendChild(settings);
  }
  card.querySelectorAll("[data-sec]").forEach(el=>el.onchange=()=>{
   remember();const key=el.dataset.sec;
   let value=el.tagName==="INPUT"&&el.type==="number"?Number(el.value):el.value;
   if(key==="mirrorAlternate")value=value==="true";
   section[key]=value;renderPanel()
  });
  stack.appendChild(card);
 });
 if(!sections.length)stack.innerHTML='<div class="drop-hint">Add a vertical band, horizontal band, or row divider to begin.</div>';
 renderChart();
}

$("addSelected").onclick=()=>{
 if(!selectedMotifId)return alert("Select a motif first.");
 const section=activeSection();if(!section)return;
 if(section.type==="divider")return alert("Select a vertical or horizontal band first.");
 remember();
 section.items.push(normalizeItem({type:"motif",motifId:selectedMotifId}));
 renderPanel();
};
$("addFieldSection").onclick=()=>{remember();const s=makeFieldSection([]);panels[activePanel].push(s);selectedSectionId=s.id;renderPanel()};
$("addBandSection").onclick=()=>{remember();const s=makeBandSection([]);panels[activePanel].push(s);selectedSectionId=s.id;renderPanel()};
$("addDividerSection").onclick=()=>{remember();const s=makeDividerSection();panels[activePanel].push(s);selectedSectionId=s.id;renderPanel()};
$("clearPanel").onclick=()=>{if(!panels[activePanel].length)return;remember();panels[activePanel]=[];selectedSectionId=null;renderPanel()};
$("targetWidth").oninput=renderPanel;$("targetWidth").onchange=()=>remember();

$("undoBtn").onclick=undo;$("redoBtn").onclick=redo;
document.addEventListener("keydown",e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redo():undo()}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"){e.preventDefault();redo()}
});

