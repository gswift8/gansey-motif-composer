function renderChart(){
 ensureSections();
 const target=Math.max(1,+$("targetWidth").value||1),sections=panels[activePanel];
 const all=sections.map(section=>({section,rows:sectionRows(section,target)}));
 const totalH=all.reduce((s,x)=>s+x.rows.length,0);
 $("totalWidth").textContent=`${target} stitches`;$("totalWidth").className="total target-ok";
 $("totalHeight").textContent=`${totalH} rows`;
 const p=$("chartPreview");p.innerHTML="";
 if(!all.length){p.innerHTML='<div class="empty">The assembled section chart will appear here.</div>';return}
 all.forEach((entry,index)=>{
  const label=document.createElement("div");label.className="chart-section-label";
  label.textContent=`${index+1}. ${entry.section.name} · ${entry.rows.length} rows`;
  p.appendChild(label);
  const grid=document.createElement("div");grid.className="composed-grid";grid.style.gridTemplateColumns=`repeat(${target},19px)`;
  entry.rows.forEach(row=>{
   const normalized=[...row.slice(0,target),...Array(Math.max(0,target-row.length)).fill(K)].slice(0,target);
   normalized.forEach(v=>{const c=document.createElement("div");c.className="composed-cell "+v;grid.appendChild(c)})
  });
  p.appendChild(grid);
  if(index<all.length-1){const d=document.createElement("div");d.className="chart-section-divider";p.appendChild(d)}
 });
}

$("smartSuggest").onclick=()=>{
 const section=activeSection(),target=+$("targetWidth").value,q=$("smartQuery").value.toLowerCase(),s=$("suggestions");s.innerHTML="";
 if(!section||section.type!=="field"){s.innerHTML='<div class="suggestion">Select a vertical band first.</div>';return}
 const candidates=motifs.filter(m=>!q||m.name.toLowerCase().includes(q)||m.tags.some(t=>q.includes(t.toLowerCase()))||m.family.toLowerCase().includes(q));
 let combos=[];
 for(const a of candidates)for(const b of motifs)for(let ra=1;ra<=6;ra++)for(let rb=0;rb<=6;rb++){
   const width=a.repeat.width*ra+b.repeat.width*rb;if(width===target)combos.push([{m:a,r:ra},{m:b,r:rb}]);
   if(combos.length>=4)break;
 }
 if(!combos.length){s.innerHTML='<div class="suggestion">No exact two-motif combination found. Try a different target or use spacers.</div>';return}
 combos.slice(0,4).forEach((combo,i)=>{
   const d=document.createElement("div");d.className="suggestion";
   d.innerHTML=`<strong>Option ${i+1}</strong><br>${combo.filter(x=>x.r).map(x=>`${x.m.name} × ${x.r}`).join(" + ")} <button style="float:right">Use</button>`;
   d.querySelector("button").onclick=()=>{remember();section.items=combo.filter(x=>x.r).map(x=>normalizeItem({type:"motif",motifId:x.m.id,hRepeat:x.r}));renderPanel()};s.appendChild(d);
 });
};

