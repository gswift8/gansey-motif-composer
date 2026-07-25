const collapsedTreeSections=new Set();

function control(label,html){return `<label>${label}${html}</label>`}

function renderBandItems(section,host){
 const panel=section.items;

 const scroller=document.createElement("div");
 scroller.className="panel-scroll-shell";

 const nav=document.createElement("div");
 nav.className="panel-scroll-nav";
 nav.innerHTML=`
  <div class="panel-scroll-label">Pattern elements</div>
  <div class="panel-scroll-buttons">
   <button type="button" class="ghost scroll-start" title="Scroll to first element">⇤</button>
   <button type="button" class="ghost scroll-left" title="Scroll left">←</button>
   <span class="panel-scroll-position" aria-live="polite"></span>
   <button type="button" class="ghost scroll-right" title="Scroll right">→</button>
   <button type="button" class="ghost scroll-end" title="Scroll to last element">⇥</button>
  </div>`;

 const list=document.createElement("div");
 list.className="panel-list";
 list.tabIndex=0;
 list.setAttribute("role","region");
 list.setAttribute("aria-label",`${section.name} pattern elements`);
 if(!panel.length)list.innerHTML='<div class="drop-hint">Drag a motif here from the library, use “Add selected motif,” or add a spacer. Reorder existing blocks with Move Left and Move Right.</div>';
 list.ondragover=e=>{e.preventDefault();list.classList.add("drag-over")};
 list.ondragleave=e=>{if(!list.contains(e.relatedTarget))list.classList.remove("drag-over")};
 list.ondrop=e=>{
  e.preventDefault();list.classList.remove("drag-over");
  const motifId=e.dataTransfer.getData("application/x-gansey-motif");
  if(motifId){
   remember();
   panel.push(normalizeItem({type:"motif",motifId}));
   selectedSectionId=section.id;
   renderPanel();
   requestAnimationFrame(()=>{
    const active=$("sectionComposerScroll");
    if(active)active.scrollLeft=active.scrollWidth;
   });
  }
 };
 panel.forEach((raw,index)=>{
  const item=normalizeItem(raw);panel[index]=item;
  const block=document.createElement("div");block.className="panel-block"+(item.type==="spacer"?" spacer-card":"");block.dataset.sectionId=section.id;block.dataset.blockIndex=String(index);
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
    control("Stitch offset",`<input data-field="stitchOffset" type="number" value="${item.stitchOffset}">`)+
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
  list.appendChild(block);
 });
 const position=nav.querySelector(".panel-scroll-position");
 const outerScroll=$("sectionComposerScroll");
 const scrollTarget=outerScroll||list;
 const updateScrollControls=()=>{
  const max=Math.max(0,scrollTarget.scrollWidth-scrollTarget.clientWidth);
  const current=Math.max(0,Math.min(max,scrollTarget.scrollLeft));
  const overflow=max>2;
  nav.querySelector(".scroll-start").disabled=!overflow||current<=1;
  nav.querySelector(".scroll-left").disabled=!overflow||current<=1;
  nav.querySelector(".scroll-right").disabled=!overflow||current>=max-1;
  nav.querySelector(".scroll-end").disabled=!overflow||current>=max-1;
  position.textContent=overflow?`${Math.round(current)} / ${Math.round(max)} px`:"All elements visible";
 };

 const scrollAmount=()=>Math.max(280,Math.round(scrollTarget.clientWidth*.72));
 nav.querySelector(".scroll-start").onclick=()=>scrollTarget.scrollTo({left:0,behavior:"smooth"});
 nav.querySelector(".scroll-left").onclick=()=>scrollTarget.scrollBy({left:-scrollAmount(),behavior:"smooth"});
 nav.querySelector(".scroll-right").onclick=()=>scrollTarget.scrollBy({left:scrollAmount(),behavior:"smooth"});
 nav.querySelector(".scroll-end").onclick=()=>scrollTarget.scrollTo({left:scrollTarget.scrollWidth,behavior:"smooth"});

 scrollTarget.addEventListener("scroll",updateScrollControls,{passive:true});

 scroller.append(nav,list);
 host.appendChild(scroller);
 requestAnimationFrame(updateScrollControls);

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
  const group=document.createElement("div");
  group.className="tree-section-group";
  group.dataset.sectionId=section.id;

  const row=document.createElement("div");
  row.className="tree-section"+(section.id===selectedSectionId?" active":"");

  const hasChildren=Array.isArray(section.items)&&section.items.length>0;
  const collapsed=collapsedTreeSections.has(section.id);
  const toggle=document.createElement("button");
  toggle.type="button";
  toggle.className="tree-toggle";
  toggle.disabled=!hasChildren;
  toggle.title=hasChildren?(collapsed?"Expand band":"Collapse band"):"This section has no motif blocks";
  toggle.setAttribute("aria-expanded",String(hasChildren&&!collapsed));
  toggle.textContent=hasChildren?(collapsed?"▸":"▾"):"•";
  toggle.onclick=e=>{
   e.preventDefault();
   e.stopPropagation();
   if(!hasChildren)return;
   if(collapsedTreeSections.has(section.id))collapsedTreeSections.delete(section.id);
   else collapsedTreeSections.add(section.id);
   renderLayoutTree();
  };

  const icon=document.createElement("span");
  icon.className="tree-icon";
  icon.textContent=section.type==="field"?"↕":section.type==="band"?"↔":"—";

  const name=document.createElement("span");
  name.className="tree-section-name";
  name.textContent=`${si+1}. ${section.name}`;

  const rows=document.createElement("span");
  rows.className="small tree-section-rows";
  rows.textContent=`${sectionHeight(section)} rows`;

  row.append(toggle,icon,name,rows);
  row.onclick=()=>{selectedSectionId=section.id;renderPanel()};
  group.appendChild(row);

  if(hasChildren&&!collapsed){
   const children=document.createElement("div");
   children.className="tree-children";
   section.items.forEach(item=>{
    const block=document.createElement("div");
    block.className="tree-block";
    const m=item.type==="motif"?motifs.find(x=>x.id===item.motifId):null;

    const blockIcon=document.createElement("span");
    blockIcon.className="tree-icon";
    blockIcon.textContent=item.type==="spacer"?"□":"◆";

    const blockName=document.createElement("span");
    blockName.className="tree-block-name";
    blockName.textContent=m?.name||(item.stitch===P?"Purl spacer":"Knit spacer");

    const width=document.createElement("span");
    width.className="small tree-block-width";
    width.textContent=`${itemWidth(item)} sts`;

    block.append(blockIcon,blockName,width);
    block.onclick=()=>{
     selectedSectionId=section.id;
     renderPanel();
     setTimeout(()=>{
      document.querySelector(`.section-card[data-section-id="${section.id}"]`)?.scrollIntoView({
       behavior:"smooth",block:"nearest",inline:"nearest"
      });
     },0);
    };
    children.appendChild(block);
   });
   group.appendChild(children);
  }

  tree.appendChild(group);
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


function runBlockAction(button){
 const card=button.closest(".panel-block");
 if(!card)return;

 const section=panels[activePanel].find(s=>s.id===card.dataset.sectionId);
 const index=Number(card.dataset.blockIndex);
 if(!section||!Array.isArray(section.items)||!Number.isInteger(index)||!section.items[index])return;

 const action=button.dataset.blockAction;

 if(action==="left"&&index===0){
  $("composerStatus").textContent="This block is already first.";
  return;
 }
 if(action==="right"&&index===section.items.length-1){
  $("composerStatus").textContent="This block is already last.";
  return;
 }

 remember();

 if(action==="mirror"){
  section.items[index].mirrored=!section.items[index].mirrored;
  $("composerStatus").textContent="Mirrored block.";
 }else if(action==="duplicate"){
  const copy=JSON.parse(JSON.stringify(section.items[index]));
  section.items.splice(index+1,0,copy);
  $("composerStatus").textContent="Duplicated block.";
 }else if(action==="left"){
  const [moved]=section.items.splice(index,1);
  section.items.splice(index-1,0,moved);
  $("composerStatus").textContent="Moved block left.";
 }else if(action==="right"){
  const [moved]=section.items.splice(index,1);
  section.items.splice(index+1,0,moved);
  $("composerStatus").textContent="Moved block right.";
 }else{
  return;
 }

 selectedSectionId=section.id;
 renderPanel();
}

// Run pointer actions before a focused number/select control can emit `change`
// and rebuild the composer. This prevents the original button from becoming
// detached before its click reaches the delegated handler.
$("sectionStack").addEventListener("pointerdown",e=>{
 const button=e.target.closest("button[data-block-action]");
 if(!button||e.button!==0)return;
 e.preventDefault();
 e.stopPropagation();
 runBlockAction(button);
});

// Keyboard activation still uses click. Pointer-generated clicks are ignored
// because pointerdown already handled them.
$("sectionStack").addEventListener("click",e=>{
 const button=e.target.closest("button[data-block-action]");
 if(!button)return;
 e.preventDefault();
 e.stopPropagation();
 if(e.detail===0)runBlockAction(button);
});


function blockOptionContext(control){
 const card=control.closest(".panel-block");
 if(!card)return null;
 const section=panels[activePanel].find(s=>s.id===card.dataset.sectionId);
 const index=Number(card.dataset.blockIndex);
 if(!section||!Array.isArray(section.items)||!Number.isInteger(index)||!section.items[index])return null;
 return {section,index,item:section.items[index]};
}

function controlValue(control){
 if(control.tagName==="INPUT"&&control.type==="number"){
  const value=Number(control.value);
  return Number.isFinite(value)?value:null;
 }
 return control.value;
}

function updateBlockOption(control,{finalize=false}={}){
 const context=blockOptionContext(control);
 if(!context)return;
 const value=controlValue(control);
 if(value===null)return;

 if(control.dataset.historyCaptured!=="true"){
  remember();
  control.dataset.historyCaptured="true";
 }

 context.item[control.dataset.field]=value;
 selectedSectionId=context.section.id;

 if(finalize)renderPanel();
 else renderChart();
}

$("sectionStack").addEventListener("input",e=>{
 const control=e.target.closest('input[data-field]');
 if(!control)return;
 e.stopPropagation();
 updateBlockOption(control,{finalize:false});
});

$("sectionStack").addEventListener("change",e=>{
 const control=e.target.closest("[data-field]");
 if(!control)return;
 e.stopPropagation();
 updateBlockOption(control,{finalize:true});
});

$("sectionStack").addEventListener("keydown",e=>{
 const control=e.target.closest('input[data-field][type="number"]');
 if(!control||e.key!=="Enter")return;
 e.preventDefault();
 updateBlockOption(control,{finalize:true});
});


function renderPanel(){
 ensureSections();
 const sections=panels[activePanel],stack=$("sectionStack");stack.innerHTML="";
 renderLayoutTree();
 const target=Math.max(1,+$("targetWidth").value||1);
 sections.forEach((section,index)=>{
  const card=document.createElement("div");
  card.className="section-card"+(section.id===selectedSectionId?" active-section":"");
  card.dataset.sectionId=section.id;
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
  card.querySelectorAll("[data-sec]").forEach(el=>{
   const applySectionValue=finalize=>{
    let value=el.tagName==="INPUT"&&el.type==="number"?Number(el.value):el.value;
    if(el.tagName==="INPUT"&&el.type==="number"&&!Number.isFinite(value))return;
    if(el.dataset.historyCaptured!=="true"){
     remember();
     el.dataset.historyCaptured="true";
    }
    if(el.dataset.sec==="mirrorAlternate")value=value==="true";
    section[el.dataset.sec]=value;
    if(finalize)renderPanel();
    else renderChart();
   };
   if(el.tagName==="INPUT")el.oninput=()=>applySectionValue(false);
   el.onchange=()=>applySectionValue(true);
  });
  stack.appendChild(card);
 });
 if(!sections.length)stack.innerHTML='<div class="drop-hint">Add a vertical band, horizontal band, or row divider to begin.</div>';
 renderChart();
 if(typeof renderProjectOverview==="function")renderProjectOverview();
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
$("targetWidth").onfocus=e=>{if(e.target.dataset.historyCaptured!=="true"){remember();e.target.dataset.historyCaptured="true"}};
$("targetWidth").oninput=renderChart;
$("targetWidth").onchange=e=>{e.target.dataset.historyCaptured="false";renderPanel()};

$("undoBtn").onclick=undo;$("redoBtn").onclick=redo;
document.addEventListener("keydown",e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redo():undo()}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"){e.preventDefault();redo()}
});



function setupComposerWorkspaceScroll(){
 const scroller=$("sectionComposerScroll");
 if(!scroller)return;
 const amount=()=>Math.max(300,Math.round(scroller.clientWidth*.75));
 $("composerScrollStart").onclick=()=>scroller.scrollTo({left:0,behavior:"smooth"});
 $("composerScrollLeft").onclick=()=>scroller.scrollBy({left:-amount(),behavior:"smooth"});
 $("composerScrollRight").onclick=()=>scroller.scrollBy({left:amount(),behavior:"smooth"});
 $("composerScrollEnd").onclick=()=>scroller.scrollTo({left:scroller.scrollWidth,behavior:"smooth"});

 scroller.addEventListener("wheel",e=>{
  if(scroller.scrollWidth<=scroller.clientWidth)return;
  const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
  const max=scroller.scrollWidth-scroller.clientWidth;
  const canMove=(delta<0&&scroller.scrollLeft>0)||(delta>0&&scroller.scrollLeft<max-1);
  if(!canMove)return;
  e.preventDefault();
  scroller.scrollLeft+=delta;
 },{passive:false});
}
setupComposerWorkspaceScroll();


$("collapseAllTree").onclick=()=>{
 ensureSections();
 panels[activePanel].forEach(section=>{
  if(Array.isArray(section.items)&&section.items.length)collapsedTreeSections.add(section.id);
 });
 renderLayoutTree();
};

$("expandAllTree").onclick=()=>{
 collapsedTreeSections.clear();
 renderLayoutTree();
};
