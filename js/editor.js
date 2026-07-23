function blank(w,h){return Array.from({length:h},()=>Array(w).fill(K))}
function resizeEditor(){
 const w=+$("motifWidth").value,h=+$("motifHeight").value,next=blank(w,h);
 for(let r=0;r<Math.min(h,editorData.length);r++)for(let c=0;c<Math.min(w,editorData[r]?.length||0);c++)next[r][c]=editorData[r][c];
 editorData=next;
 $("repeatW").value=Math.min(+$("repeatW").value,w);$("repeatH").value=Math.min(+$("repeatH").value,h);
 renderEditor();
}
function inRepeat(c,r){
 const x=+$("repeatX").value-1,y=+$("repeatY").value-1,w=+$("repeatW").value,h=+$("repeatH").value;
 return c>=x&&c<x+w&&r>=y&&r<y+h;
}
function renderEditor(){
 const w=+$("motifWidth").value,g=$("editorGrid");g.innerHTML="";g.style.gridTemplateColumns=`repeat(${w},25px)`;
 editorData.forEach((row,r)=>row.forEach((v,c)=>{
   const el=document.createElement("div");el.className="cell"+(inRepeat(c,r)?" repeat":"");el.dataset.stitch=v;
   el.onclick=()=>{editorData[r][c]=activeStitch;renderEditor()};g.appendChild(el);
 }));
}
document.querySelectorAll(".stitch-btn").forEach(b=>b.onclick=()=>{
 document.querySelectorAll(".stitch-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");activeStitch=b.dataset.stitch;
});
["motifWidth","motifHeight"].forEach(id=>$(id).onchange=resizeEditor);
["repeatX","repeatY","repeatW","repeatH"].forEach(id=>$(id).oninput=renderEditor);

function motifPreview(m,data=m.data){
 const el=document.createElement("div");el.className="preview";el.style.gridTemplateColumns=`repeat(${data[0]?.length||m.width},8px)`;
 data.forEach((row,r)=>row.forEach((v,c)=>{
   const d=document.createElement("div");d.className="preview-cell "+v;
   const rx=m.repeat?.x-1,ry=m.repeat?.y-1;
   if(m.repeat&&c>=rx&&c<rx+m.repeat.width&&r>=ry&&r<ry+m.repeat.height)d.classList.add("repeat");
   el.appendChild(d);
 }));return el;
}
function familyOptions(){
 const fams=[...new Set(motifs.map(m=>m.family))].sort(),sel=$("familyFilter"),old=sel.value;
 sel.innerHTML='<option value="">All families</option>'+fams.map(f=>`<option>${f}</option>`).join("");sel.value=old;
}
function filteredMotifs(){
 const q=$("searchBox").value.toLowerCase(),fam=$("familyFilter").value,wf=$("widthFilter").value,fav=$("favoritesOnly").checked,sort=$("sortFilter").value;
 const result=motifs.filter(m=>{
   const text=(m.name+" "+m.family+" "+m.tags.join(" ")).toLowerCase();
   const widthOk=!wf||(wf==="small"&&m.width<=8)||(wf==="medium"&&m.width>=9&&m.width<=16)||(wf==="large"&&m.width>=17);
   return (!q||text.includes(q))&&(!fam||m.family===fam)&&widthOk&&(!fav||m.favorite);
 });
 result.sort((a,b)=>{
   if(sort==="family")return a.family.localeCompare(b.family)||a.name.localeCompare(b.name);
   if(sort==="width")return a.width-b.width||a.name.localeCompare(b.name);
   if(sort==="favorite")return Number(b.favorite)-Number(a.favorite)||a.name.localeCompare(b.name);
   return a.name.localeCompare(b.name);
 });
 return result;
}
function renderLibrary(){
 familyOptions();const lib=$("library");lib.innerHTML="",visible=filteredMotifs();
 $("libraryCount").textContent=`${visible.length} of ${motifs.length} motifs`;
 visible.forEach(m=>{
  const card=document.createElement("div");card.className="motif-card"+(m.id===selectedMotifId?" selected":"");card.draggable=true;card.dataset.motifId=m.id;
  card.innerHTML=`<button class="fav">${m.favorite?"★":"☆"}</button><div class="motif-name">${m.name}</div>
  <div class="meta">${m.family}<br>${m.width} sts × ${m.height} rows · repeat ${m.repeat.width}×${m.repeat.height}</div>`;
  card.appendChild(motifPreview(m));
  card.onclick=e=>{if(e.target.classList.contains("fav")){m.favorite=!m.favorite;renderLibrary();return}selectedMotifId=m.id;loadMotif(m);renderLibrary()};
  card.ondragstart=e=>{e.dataTransfer.setData("application/x-gansey-motif",m.id);e.dataTransfer.effectAllowed="copy"};
  lib.appendChild(card);
 });
 if(!lib.children.length)lib.innerHTML='<div class="empty">No motifs match those filters.</div>';
}
["searchBox","familyFilter","widthFilter","sortFilter","favoritesOnly"].forEach(id=>$(id).oninput=renderLibrary);

function loadMotif(m){
 $("motifName").value=m.name;$("motifWidth").value=m.width;$("motifHeight").value=m.height;$("motifFamily").value=m.family;
 $("motifTags").value=m.tags.join(", ");$("repeatX").value=m.repeat.x;$("repeatY").value=m.repeat.y;
 $("repeatW").value=m.repeat.width;$("repeatH").value=m.repeat.height;editorData=m.data.map(r=>[...r]);renderEditor();
}
function newMotif(){
 selectedMotifId=null;$("motifName").value="New Motif";$("motifWidth").value=8;$("motifHeight").value=8;$("motifTags").value="";
 $("repeatX").value=1;$("repeatY").value=1;$("repeatW").value=8;$("repeatH").value=8;editorData=blank(8,8);renderEditor();renderLibrary();
}
function saveMotif(){
 const obj={id:selectedMotifId||uid(),name:$("motifName").value.trim()||"Untitled Motif",family:$("motifFamily").value,
 tags:$("motifTags").value.split(",").map(s=>s.trim()).filter(Boolean),favorite:false,width:+$("motifWidth").value,height:+$("motifHeight").value,
 repeat:{x:+$("repeatX").value,y:+$("repeatY").value,width:+$("repeatW").value,height:+$("repeatH").value},data:editorData.map(r=>[...r])};
 const i=motifs.findIndex(m=>m.id===obj.id);if(i>=0){obj.favorite=motifs[i].favorite;motifs[i]=obj}else motifs.push(obj);
 selectedMotifId=obj.id;renderLibrary();renderPanel();
}
$("saveMotif").onclick=saveMotif;$("newMotif").onclick=newMotif;
$("clearGrid").onclick=()=>{editorData=blank(+$("motifWidth").value,+$("motifHeight").value);renderEditor()};
$("deleteMotif").onclick=()=>{
 if(!selectedMotifId)return;
 motifs=motifs.filter(m=>m.id!==selectedMotifId);
 Object.values(panels).forEach(sections=>sections.forEach(section=>{
  if(Array.isArray(section.items))section.items=section.items.filter(item=>item.motifId!==selectedMotifId);
 }));
 newMotif();renderPanel();
};

document.querySelectorAll("[data-panel]").forEach(b=>b.onclick=()=>{
 document.querySelectorAll("[data-panel]").forEach(x=>x.classList.remove("active"));b.classList.add("active");
 activePanel=b.dataset.panel;selectedSectionId=null;$("composerStatus").textContent="";ensureSections();renderPanel();
});

