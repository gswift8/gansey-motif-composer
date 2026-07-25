
"use strict";

function smartTargetWidth(){
 const spec=typeof panelSpecs!=="undefined"?(ensurePanelSpecs(),panelSpecs[activePanel]):null;
 return Math.max(1,Number(spec?.working)||Number($("targetWidth")?.value)||1);
}

function smartSectionWidth(section){
 if(section.type==="divider")return smartTargetWidth();
 if(section.type==="band")return (horizontalUnitRows(section)[0]||[]).length;
 return (section.items||[]).reduce((sum,item)=>sum+itemWidth(item),0);
}

function smartNearestWidths(){
 const spec=typeof panelSpecs!=="undefined"?(ensurePanelSpecs(),panelSpecs[activePanel]):null;
 const current=smartTargetWidth();
 const multiple=Math.max(1,Number(spec?.repeatMultiple)||1);
 const selvage=Math.max(0,Number(spec?.selvage)||0)*2;
 const usable=Math.max(1,current-selvage);
 const lowerUsable=Math.max(multiple,Math.floor(usable/multiple)*multiple);
 const upperUsable=Math.max(multiple,Math.ceil(usable/multiple)*multiple);
 return {
  current,
  lower:lowerUsable+selvage,
  upper:upperUsable+selvage,
  multiple,
  selvage
 };
}

function smartSetPanelWidth(width){
 width=Math.max(1,Math.round(width));
 remember();
 $("targetWidth").value=width;
 if(typeof panelSpecs!=="undefined"){
  ensurePanelSpecs();
  panelSpecs[activePanel].working=width;
 }
 renderPanel();
 if(typeof renderPanelSpecifications==="function")renderPanelSpecifications();
 renderSmartLayout();
}

function removeSmartEdgeSpacers(section){
 section.items=(section.items||[]).filter(item=>!item.smartEdge);
}

function addBalancedEdgeSpacers(section,left,right){
 if(left>0)section.items.unshift(normalizeItem({type:"spacer",width:left,stitch:K,smartEdge:"left"}));
 if(right>0)section.items.push(normalizeItem({type:"spacer",width:right,stitch:K,smartEdge:"right"}));
}

function fitFieldWithEdgeSpacers(section){
 const target=smartTargetWidth();
 removeSmartEdgeSpacers(section);
 let width=smartSectionWidth(section);

 // Reduce horizontal repeats from the right only when the section is wider than the panel.
 if(width>target){
  for(let index=section.items.length-1;index>=0&&width>target;index--){
   const item=normalizeItem(section.items[index]);
   if(item.type!=="motif")continue;
   const motif=motifs.find(m=>m.id===item.motifId);
   const unit=Math.max(1,motif?.repeat?.width||1);
   while(item.hRepeat>1&&width-unit>=target){
    item.hRepeat-=1;
    width-=unit;
   }
   section.items[index]=item;
  }
 }

 width=smartSectionWidth(section);
 if(width>target)return {ok:false,reason:`Still ${width-target} stitches too wide after reducing available repeats.`};

 const leftover=target-width;
 const left=Math.floor(leftover/2);
 const right=leftover-left;
 addBalancedEdgeSpacers(section,left,right);
 return {ok:true,left,right};
}

function autoRepeatSingleMotif(section){
 const target=smartTargetWidth();
 removeSmartEdgeSpacers(section);
 const motifItems=(section.items||[]).filter(item=>normalizeItem(item).type==="motif");
 const nonMotifWidth=(section.items||[]).filter(item=>normalizeItem(item).type==="spacer")
  .reduce((sum,item)=>sum+itemWidth(item),0);
 if(motifItems.length!==1)return {ok:false,reason:"Auto-repeat works on a vertical band containing exactly one motif block."};

 const item=normalizeItem(motifItems[0]);
 const motif=motifs.find(m=>m.id===item.motifId);
 const unit=Math.max(1,motif?.repeat?.width||1);
 const fixed=item.gapBefore+item.gapAfter+nonMotifWidth;
 const repeats=Math.max(1,Math.floor((target-fixed)/unit));
 item.hRepeat=repeats;
 const index=section.items.indexOf(motifItems[0]);
 section.items[index]=item;

 const width=smartSectionWidth(section);
 if(width>target)return {ok:false,reason:"The motif and fixed gaps are wider than the panel."};
 const leftover=target-width;
 addBalancedEdgeSpacers(section,Math.floor(leftover/2),Math.ceil(leftover/2));
 return {ok:true,repeats,leftover};
}

function sectionSmartStatus(section){
 const target=smartTargetWidth();
 const width=smartSectionWidth(section);
 if(section.type==="divider"){
  return {tone:"ok",label:"Always fits",detail:`Spans the full ${target}-stitch panel.`};
 }
 if(section.type==="field"){
  if(width===target)return {tone:"ok",label:"Exact width",detail:`The band uses all ${target} stitches.`};
  if(width<target)return {tone:"warn",label:`${target-width} stitches short`,detail:"Balanced edge spacers can center this band."};
  return {tone:"bad",label:`${width-target} stitches too wide`,detail:"Smart Fit can reduce repeat counts where possible."};
 }
 const unit=Math.max(1,width);
 const repeats=Math.floor(target/unit);
 const remainder=target%unit;
 if(remainder===0)return {tone:"ok",label:`${repeats} exact repeats`,detail:`The ${unit}-stitch unit divides evenly across the panel.`};
 return {tone:"warn",label:`${remainder} leftover stitches`,detail:`Fits ${repeats} complete ${unit}-stitch units.`};
}

function renderSmartLayout(){
 const summary=$("smartLayoutSummary"),host=$("smartSectionAnalysis");
 if(!summary||!host)return;
 ensureSections();
 const target=smartTargetWidth();
 const nearest=smartNearestWidths();
 const sections=panels[activePanel]||[];
 const exact=sections.filter(section=>sectionSmartStatus(section).tone==="ok").length;

 summary.innerHTML=`
  <div><span>Active panel</span><strong>${activePanel}</strong></div>
  <div><span>Working width</span><strong>${target} stitches</strong></div>
  <div><span>Panel repeat multiple</span><strong>${nearest.multiple}</strong></div>
  <div><span>Sections aligned</span><strong>${exact} of ${sections.length}</strong></div>`;

 $("smartWidthLower").textContent=`Use lower valid width (${nearest.lower})`;
 $("smartWidthUpper").textContent=`Use higher valid width (${nearest.upper})`;

 host.innerHTML="";
 sections.forEach((section,index)=>{
  const width=smartSectionWidth(section);
  const status=sectionSmartStatus(section);
  const card=document.createElement("div");
  card.className=`smart-section-card smart-${status.tone}`;

  const heading=document.createElement("div");
  heading.className="smart-section-heading";
  heading.innerHTML=`
   <div>
    <span class="section-badge">${section.type==="field"?"VERTICAL BAND":section.type==="band"?"HORIZONTAL BAND":"ROW DIVIDER"}</span>
    <strong>${index+1}. ${section.name}</strong>
   </div>
   <div class="smart-status-pill">${status.label}</div>`;

  const details=document.createElement("div");
  details.className="smart-section-details";
  details.innerHTML=`
   <span>${section.type==="band"?"Unit width":"Section width"}: <strong>${width} stitches</strong></span>
   <span>${status.detail}</span>`;

  const actions=document.createElement("div");
  actions.className="smart-section-actions";

  if(section.type==="field"){
   actions.innerHTML=`
    <button type="button" data-smart-action="fit">Fit with balanced edges</button>
    <button type="button" class="ghost" data-smart-action="repeat">Auto-repeat single motif</button>
    <button type="button" class="ghost" data-smart-action="open">Open section</button>`;
  }else if(section.type==="band"){
   actions.innerHTML=`
    <button type="button" data-smart-action="center">Center complete units</button>
    <button type="button" class="ghost" data-smart-action="left">Align units left</button>
    <button type="button" class="ghost" data-smart-action="open">Open section</button>`;
  }else{
   actions.innerHTML='<button type="button" class="ghost" data-smart-action="open">Open section</button>';
  }

  actions.onclick=event=>{
   const button=event.target.closest("[data-smart-action]");
   if(!button)return;
   const action=button.dataset.smartAction;

   if(action==="open"){
    selectedSectionId=section.id;
    renderPanel();
    document.querySelector(`.section-card[data-section-id="${section.id}"]`)?.scrollIntoView({behavior:"smooth",block:"start"});
    return;
   }

   remember();
   if(action==="fit"){
    const result=fitFieldWithEdgeSpacers(section);
    if(!result.ok)alert(result.reason);
   }
   if(action==="repeat"){
    const result=autoRepeatSingleMotif(section);
    if(!result.ok)alert(result.reason);
   }
   if(action==="center"){section.fitMode="center";section.offset=0}
   if(action==="left"){section.fitMode="left";section.offset=0}
   selectedSectionId=section.id;
   renderPanel();
   renderSmartLayout();
  };

  card.append(heading,details,actions);
  host.appendChild(card);
 });

 if(!sections.length)host.innerHTML='<div class="smart-empty">Add sections to the active panel to receive layout recommendations.</div>';
}

$("refreshSmartLayout")?.addEventListener("click",renderSmartLayout);
$("smartWidthLower")?.addEventListener("click",()=>smartSetPanelWidth(smartNearestWidths().lower));
$("smartWidthUpper")?.addEventListener("click",()=>smartSetPanelWidth(smartNearestWidths().upper));

$("smartCenterAll")?.addEventListener("click",()=>{
 ensureSections();remember();
 (panels[activePanel]||[]).filter(section=>section.type==="band").forEach(section=>{
  section.fitMode="center";
  section.offset=0;
 });
 renderPanel();renderSmartLayout();
});

$("smartFitAllFields")?.addEventListener("click",()=>{
 ensureSections();remember();
 const failures=[];
 (panels[activePanel]||[]).filter(section=>section.type==="field").forEach(section=>{
  const result=fitFieldWithEdgeSpacers(section);
  if(!result.ok)failures.push(`${section.name}: ${result.reason}`);
 });
 renderPanel();renderSmartLayout();
 if(failures.length)alert("Some bands could not be fitted:\n\n"+failures.join("\n"));
});
