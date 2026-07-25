
"use strict";

let measurementUnit="in";

function measurementSettings(){
 return {
  unit:measurementUnit,
  stitches:Number($("gaugeStitches")?.value||24),
  swatchWidth:Number($("gaugeWidth")?.value||4),
  rows:Number($("gaugeRows")?.value||32),
  swatchHeight:Number($("gaugeHeight")?.value||4)
 };
}

function measurementRates(){
 const settings=measurementSettings();
 return {
  stitchesPerUnit:settings.stitches/Math.max(.1,settings.swatchWidth),
  rowsPerUnit:settings.rows/Math.max(.1,settings.swatchHeight)
 };
}

function convertMeasurement(value){
 return measurementUnit==="cm"?value*2.54:value;
}

function formatMeasurement(value){
 if(!Number.isFinite(value))return "—";
 const suffix=measurementUnit==="cm"?"cm":"in";
 return `${convertMeasurement(value).toFixed(1)} ${suffix}`;
}

function panelMeasurement(panelName){
 const rates=measurementRates();
 const stitches=Math.max(1,+$("targetWidth").value||1);
 const rows=panelTotalHeight(panelName);
 return {
  stitches,
  rows,
  width:stitches/rates.stitchesPerUnit,
  height:rows/rates.rowsPerUnit
 };
}

function renderMeasurements(){
 const host=$("panelMeasurements");
 if(!host)return;

 const settings=measurementSettings();
 const rates=measurementRates();
 $("gaugeSummary").innerHTML=`
  <div><span>Stitch gauge</span><strong>${rates.stitchesPerUnit.toFixed(2)} sts per ${measurementUnit}</strong></div>
  <div><span>Row gauge</span><strong>${rates.rowsPerUnit.toFixed(2)} rows per ${measurementUnit}</strong></div>`;

 host.innerHTML="";
 Object.keys(panels).forEach(panelName=>{
  const m=panelMeasurement(panelName);
  const card=document.createElement("button");
  card.type="button";
  card.className="panel-measurement-card";
  card.innerHTML=`
    <div class="panel-measurement-heading">
      <strong>${panelName}</strong>
      <span>${m.stitches} sts × ${m.rows} rows</span>
    </div>
    <div class="panel-measurement-size">
      <span>${formatMeasurement(m.width)} wide</span>
      <span>${formatMeasurement(m.height)} tall</span>
    </div>`;
  card.onclick=()=>{
   activePanel=panelName;
   ensureSections();
   document.querySelectorAll("[data-panel]").forEach(tab=>
    tab.classList.toggle("active",tab.dataset.panel===activePanel));
   renderPanel();
   $("sectionComposerScroll")?.scrollIntoView({behavior:"smooth",block:"start"});
  };
  host.appendChild(card);
 });

 const front=panelMeasurement("Front");
 const back=panelMeasurement("Back");
 const sleeve=panelMeasurement("Sleeve");
 $("bodyCircumferenceEstimate").textContent=formatMeasurement(front.width+back.width);
 $("sleeveWidthEstimate").textContent=formatMeasurement(sleeve.width);
 $("frontHeightEstimate").textContent=formatMeasurement(front.height);

 document.querySelectorAll("[data-measure-unit]").forEach(button=>
  button.classList.toggle("active",button.dataset.measureUnit===measurementUnit));
}

["gaugeStitches","gaugeWidth","gaugeRows","gaugeHeight"].forEach(id=>{
 $(id)?.addEventListener("input",renderMeasurements);
 $(id)?.addEventListener("change",renderMeasurements);
});

document.querySelectorAll("[data-measure-unit]").forEach(button=>{
 button.onclick=()=>{
  measurementUnit=button.dataset.measureUnit;
  renderMeasurements();
 };
});
