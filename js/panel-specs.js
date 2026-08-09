
"use strict";

const panelNames=["Front","Back","Sleeve","Gusset","Shoulder"];
let specActivePanel="Front";
let panelSpecs={};

function defaultPanelSpec(panelName){
 const target=Math.max(1,+$("targetWidth")?.value||49);
 return {
  description:"",
  castOn:target,
  working:target,
  finished:target,
  repeatMultiple:1,
  selvage:0,
  underarm:0,
  centerMode:"between",
  construction:panelName==="Sleeve"?"round":"flat",
  mirror:false,
  shoulderShaping:panelName==="Front"||panelName==="Back",
  guideCenter:true,
  guideQuarters:false,
  guideRepeats:false,
  guideUnderarm:false,
  guideSideSeams:true,
  notes:"",
  gussetShape:panelName==="Gusset"?"diamond":"rectangle",
  gussetPreset:"medium",
  gussetTip:1,
  gussetMaxWidth:Math.min(target,21),
  gussetCenterRows:1,
  gussetIncreaseEvery:2
 };
}
function ensurePanelSpecs(){
 panelNames.forEach(name=>{
  panelSpecs[name]=Object.assign(defaultPanelSpec(name),panelSpecs[name]||{});
 });
}
function panelSpecifications(){ensurePanelSpecs();return JSON.parse(JSON.stringify(panelSpecs))}
function restorePanelSpecifications(raw){
 panelSpecs=raw&&typeof raw==="object"?JSON.parse(JSON.stringify(raw)):{};
 ensurePanelSpecs();
}
function activePanelSpec(){
 ensurePanelSpecs();
 return panelSpecs[specActivePanel];
}
function closestValidCounts(count,multiple){
 count=Math.max(1,Number(count)||1);multiple=Math.max(1,Number(multiple)||1);
 const lower=Math.max(multiple,Math.floor(count/multiple)*multiple);
 const upper=Math.ceil(count/multiple)*multiple;
 return [...new Set([lower,upper])];
}
function specValidation(spec){
 const count=Math.max(1,Number(spec.working)||1);
 const multiple=Math.max(1,Number(spec.repeatMultiple)||1);
 const usable=Math.max(0,count-(Math.max(0,+spec.selvage||0)*2));
 const remainder=usable%multiple;
 const repeats=Math.floor(usable/multiple);
 const centerValid=spec.centerMode==="stitch"?count%2===1:count%2===0;
 return {count,multiple,usable,remainder,repeats,centerValid};
}
function checkboxField(label,key,checked){
 return `<label class="spec-check"><input type="checkbox" data-spec="${key}"${checked?" checked":""}> ${label}</label>`;
}
function renderSpecTabs(){
 const host=$("specPanelTabs");if(!host)return;
 host.innerHTML="";
 panelNames.forEach(name=>{
  const button=document.createElement("button");
  button.type="button";
  button.className=name===specActivePanel?"active":"";
  button.textContent=name;
  button.onclick=()=>{specActivePanel=name;renderPanelSpecifications()};
  host.appendChild(button);
 });
}
function renderSpecValidation(spec){
 const v=specValidation(spec);
 const host=document.createElement("div");
 host.className="spec-validation";
 const repeatMessage=v.remainder===0
  ?`<div class="spec-valid">✓ ${v.usable} usable stitches support ${v.repeats} complete repeat${v.repeats===1?"":"s"} of ${v.multiple}.</div>`
  :`<div class="spec-warning">⚠ ${v.usable} usable stitches leave ${v.remainder} extra stitch${v.remainder===1?"":"es"} after ${v.repeats} complete repeats of ${v.multiple}.</div>
     <div class="small">Closest divisible usable counts: ${closestValidCounts(v.usable,v.multiple).join(" or ")} stitches.</div>`;
 const centerMessage=v.centerValid
  ?`<div class="spec-valid">✓ ${spec.centerMode==="stitch"?"Center stitch":"Center gap"} aligns with the ${v.count}-stitch panel.</div>`
  :`<div class="spec-warning">⚠ A ${spec.centerMode==="stitch"?"center stitch requires an odd":"center gap requires an even"} working count.</div>`;
 host.innerHTML=repeatMessage+centerMessage;
 return host;
}
function renderPanelSpecifications(){
 ensurePanelSpecs();renderSpecTabs();
 const spec=activePanelSpec();
 const host=$("panelSpecEditor");if(!host)return;
 const rows=typeof panelTotalHeight==="function"?panelTotalHeight(specActivePanel):0;
 const chartWidth=Math.max(1,+$("targetWidth").value||1);
 host.innerHTML=`
  <div class="spec-editor">
    <div class="spec-editor-heading">
      <div>
        <span class="section-badge">${specActivePanel.toUpperCase()}</span>
        <h3>${specActivePanel} specifications</h3>
      </div>
      <div class="small">Current chart: ${chartWidth} stitches × ${rows} rows</div>
    </div>

    <div class="spec-grid">
      <label>Panel description
        <input data-spec="description" type="text" value="${escapeSpecValue(spec.description)}" placeholder="Optional description">
      </label>
      <label>Cast-on stitches
        <input data-spec="castOn" type="number" min="1" value="${spec.castOn}">
      </label>
      <label>Working stitches
        <input data-spec="working" type="number" min="1" value="${spec.working}">
      </label>
      <label>Finished stitches
        <input data-spec="finished" type="number" min="1" value="${spec.finished}">
      </label>
      <label>Repeat multiple
        <input data-spec="repeatMultiple" type="number" min="1" value="${spec.repeatMultiple}">
      </label>
      <label>Selvage stitches per side
        <input data-spec="selvage" type="number" min="0" value="${spec.selvage}">
      </label>
      <label>Underarm stitches
        <input data-spec="underarm" type="number" min="0" value="${spec.underarm}">
      </label>
      <label>Center alignment
        <select data-spec="centerMode">
          <option value="between"${spec.centerMode==="between"?" selected":""}>Between two stitches</option>
          <option value="stitch"${spec.centerMode==="stitch"?" selected":""}>On a center stitch</option>
        </select>
      </label>
      <label>Construction
        <select data-spec="construction">
          <option value="flat"${spec.construction==="flat"?" selected":""}>Knit flat</option>
          <option value="round"${spec.construction==="round"?" selected":""}>Knit in the round</option>
        </select>
      </label>
    </div>

    <div class="spec-options">
      ${checkboxField("Mirror this panel", "mirror", spec.mirror)}
      ${checkboxField("Includes shoulder shaping", "shoulderShaping", spec.shoulderShaping)}
    </div>

    <div class="spec-subsection">
      <strong>Chart guides</strong>
      <div class="spec-options">
        ${checkboxField("Center line", "guideCenter", spec.guideCenter)}
        ${checkboxField("Quarter marks", "guideQuarters", spec.guideQuarters)}
        ${checkboxField("Repeat boundaries", "guideRepeats", spec.guideRepeats)}
        ${checkboxField("Underarm markers", "guideUnderarm", spec.guideUnderarm)}
        ${checkboxField("Side seams", "guideSideSeams", spec.guideSideSeams)}
      </div>
    </div>

    ${specActivePanel==="Gusset"?`
    <div class="spec-subsection gusset-settings">
      <strong>Gusset geometry</strong>
      <p class="small">Traditional gussets default to a diamond chart. Cells outside the shaped gusset are disabled in previews.</p>
      <div class="spec-grid">
       <label>Shape
        <select data-spec="gussetShape">
         <option value="diamond"${spec.gussetShape==="diamond"?" selected":""}>Symmetrical diamond</option>
         <option value="elongated"${spec.gussetShape==="elongated"?" selected":""}>Elongated diamond</option>
         <option value="wide"${spec.gussetShape==="wide"?" selected":""}>Short / wide diamond</option>
         <option value="rectangle"${spec.gussetShape==="rectangle"?" selected":""}>Rectangular chart</option>
        </select>
       </label>
       <label>Size preset
        <select data-spec="gussetPreset">
         <option value="small"${spec.gussetPreset==="small"?" selected":""}>Small</option>
         <option value="medium"${spec.gussetPreset==="medium"?" selected":""}>Medium</option>
         <option value="large"${spec.gussetPreset==="large"?" selected":""}>Large</option>
         <option value="custom"${spec.gussetPreset==="custom"?" selected":""}>Custom</option>
        </select>
       </label>
       <label>Tip stitches<input data-spec="gussetTip" type="number" min="1" value="${spec.gussetTip}"></label>
       <label>Maximum width<input data-spec="gussetMaxWidth" type="number" min="3" value="${spec.gussetMaxWidth}"></label>
       <label>Center rows<input data-spec="gussetCenterRows" type="number" min="1" value="${spec.gussetCenterRows}"></label>
       <label>Increase/decrease every<input data-spec="gussetIncreaseEvery" type="number" min="1" value="${spec.gussetIncreaseEvery}"></label>
      </div>
    </div>`:""}

    <label class="spec-notes">Panel notes
      <textarea data-spec="notes" rows="5" placeholder="Construction reminders, shaping plans, motif placement notes…">${escapeSpecValue(spec.notes)}</textarea>
    </label>
  </div>`;
 host.appendChild(renderSpecValidation(spec));

 host.querySelectorAll("[data-spec]").forEach(control=>{
  const event=control.type==="checkbox"?"change":"input";
  control.addEventListener(event,()=>{
   const key=control.dataset.spec;
   spec[key]=control.type==="checkbox"?control.checked:
    control.type==="number"?Number(control.value):control.value;
   if(key==="gussetPreset"){
    const presets={small:{gussetTip:1,gussetMaxWidth:13,gussetCenterRows:1,gussetIncreaseEvery:2},
      medium:{gussetTip:1,gussetMaxWidth:21,gussetCenterRows:1,gussetIncreaseEvery:2},
      large:{gussetTip:1,gussetMaxWidth:29,gussetCenterRows:3,gussetIncreaseEvery:2}};
    if(presets[spec.gussetPreset])Object.assign(spec,presets[spec.gussetPreset]);
   }
   renderSpecDashboard();
   if(["working","repeatMultiple","selvage","centerMode"].includes(key)){
    const old=host.querySelector(".spec-validation");
    old?.replaceWith(renderSpecValidation(spec));
   }
   if((key.startsWith("guide")||key.startsWith("gusset"))&&typeof renderChart==="function")renderChart();
   if(key==="gussetPreset")renderPanelSpecifications();
  });
 });
 renderSpecDashboard();
}
function escapeSpecValue(value){
 return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function renderSpecDashboard(){
 ensurePanelSpecs();
 const host=$("specProjectDashboard"),totals=$("specProjectTotals");
 if(!host||!totals)return;
 host.innerHTML="";
 let totalRows=0,totalCells=0,totalWorking=0;
 panelNames.forEach(name=>{
  const spec=panelSpecs[name],rows=typeof panelTotalHeight==="function"?panelTotalHeight(name):0;
  const v=specValidation(spec);
  totalRows+=rows;totalCells+=rows*Math.max(1,+spec.working||1);totalWorking+=Math.max(1,+spec.working||1);
  const button=document.createElement("button");
  button.type="button";
  button.className="spec-dashboard-card"+(name===specActivePanel?" active":"");
  button.innerHTML=`
   <div><strong>${name}</strong><span>${spec.working} sts × ${rows} rows</span></div>
   <div class="${v.remainder===0&&v.centerValid?"spec-card-valid":"spec-card-warning"}">${v.remainder===0&&v.centerValid?"Ready":"Review"}</div>`;
  button.onclick=()=>{specActivePanel=name;renderPanelSpecifications();$("panelSpecificationsCard")?.scrollIntoView({behavior:"smooth",block:"start"})};
  host.appendChild(button);
 });
 totals.innerHTML=`
  <div><span>Total specified working stitches</span><strong>${totalWorking.toLocaleString()}</strong></div>
  <div><span>Total chart rows</span><strong>${totalRows.toLocaleString()}</strong></div>
  <div><span>Total specified chart cells</span><strong>${totalCells.toLocaleString()}</strong></div>`;
}
$("applyActiveSpecWidth")?.addEventListener("click",()=>{
 const spec=activePanelSpec();
 activePanel=specActivePanel;
 $("targetWidth").value=Math.max(1,+spec.working||1);
 document.querySelectorAll("[data-panel]").forEach(x=>x.classList.toggle("active",x.dataset.panel===activePanel));
 renderPanel();
 renderPanelSpecifications();
});
