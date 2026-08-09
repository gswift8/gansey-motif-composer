
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

function validateGaugeInput(input){
 const value=Number(input.value);
 const max=input.id==="gaugeRows"?300:input.id==="gaugeStitches"?200:100;
 const valid=Number.isFinite(value)&&value>0&&value<=max;
 input.setCustomValidity(valid?"":`Enter a value greater than 0 and no more than ${max}.`);
 input.classList.toggle("input-invalid",!valid);
 return valid;
}
function roundGaugeRateToHalf(countId,sizeId){
 const count=$(countId),size=$(sizeId);
 if(!validateGaugeInput(count)||!validateGaugeInput(size))return;
 const rate=Number(count.value)/Number(size.value);
 const rounded=Math.round(rate*2)/2;
 count.value=String(Math.round(rounded*Number(size.value)*10)/10);
}
["gaugeStitches","gaugeWidth","gaugeRows","gaugeHeight"].forEach(id=>{
 $(id)?.addEventListener("input",e=>{validateGaugeInput(e.target);renderMeasurements()});
 $(id)?.addEventListener("change",e=>{
  validateGaugeInput(e.target);
  if(id==="gaugeStitches"||id==="gaugeWidth")roundGaugeRateToHalf("gaugeStitches","gaugeWidth");
  if(id==="gaugeRows"||id==="gaugeHeight")roundGaugeRateToHalf("gaugeRows","gaugeHeight");
  renderMeasurements();
 });
});

document.querySelectorAll("[data-measure-unit]").forEach(button=>{
 button.onclick=()=>{
  measurementUnit=button.dataset.measureUnit;
  renderMeasurements();
 };
});
