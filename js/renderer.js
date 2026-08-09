function repeatSlice(m){
 const x=m.repeat.x-1,y=m.repeat.y-1,w=m.repeat.width,h=m.repeat.height;
 return m.data.slice(y,y+h).map(r=>r.slice(x,x+w));
}
function normalizeItem(item){
 if(item.type==="spacer")return Object.assign({width:2,stitch:K},item);
 return Object.assign({
   type:"motif",hRepeat:1,vRepeat:1,vMode:"count",align:"center",
   rowOffset:0,stitchOffset:0,gapBefore:0,gapAfter:0,fillStitch:K,mirrored:false
 },item,{hRepeat:item.hRepeat||item.repeat||1});
}
function motifTile(item){
 const m=motifs.find(x=>x.id===item.motifId);if(!m)return [[]];
 let base=repeatSlice(m).map(r=>[...r]);
 if(item.mirrored){
  const mirrorStitch=stitch=>stitch===CR?CL:stitch===CL?CR:stitch;
  base=base.map(r=>[...r].reverse().map(mirrorStitch));
 }
 const horizontal=Array.from({length:base.length},()=>[]);
 for(let n=0;n<item.hRepeat;n++)base.forEach((r,i)=>horizontal[i].push(...r));

 // Stitch offset is a cyclic horizontal phase shift of the motif itself.
 // Positive values move the visible pattern right; negative values move it left.
 const rawOffset=Number(item.stitchOffset||0);
 return horizontal.map(row=>{
  if(!row.length||!rawOffset)return row;
  const rightShift=((rawOffset%row.length)+row.length)%row.length;
  if(!rightShift)return row;
  return [...row.slice(-rightShift),...row.slice(0,-rightShift)];
 });
}
function naturalHeight(item){
 if(item.type==="spacer")return 0;
 const m=motifs.find(x=>x.id===item.motifId);if(!m)return 0;
 return m.repeat.height*Math.max(1,item.vRepeat);
}
function fieldHeight(section){
 if(section.heightMode==="fixed")return Math.max(1,+section.height||1);
 const heights=section.items.map(raw=>{
   const i=normalizeItem(raw);
   if(i.type==="spacer")return 0;
   if(i.vMode==="fill")return motifs.find(m=>m.id===i.motifId)?.repeat.height||1;
   return naturalHeight(i)+Math.max(0,i.rowOffset);
 });
 return Math.max(1,...heights,1);
}
function verticalized(raw,panelH){
 const item=normalizeItem(raw);
 if(item.type==="spacer")return Array.from({length:panelH},()=>Array(item.width).fill(item.stitch));
 const base=motifTile(item),unitH=Math.max(1,base.length),w=base[0]?.length||0;
 let reps=item.vMode==="fill"?Math.max(1,Math.ceil(panelH/unitH)):Math.max(1,item.vRepeat);
 let tiled=[];
 for(let n=0;n<reps;n++)tiled.push(...base.map(r=>[...r]));
 if(item.vMode==="fill"&&tiled.length>panelH)tiled=tiled.slice(0,panelH);
 const available=Math.max(0,panelH-tiled.length);
 let top=0;
 if(item.align==="center")top=Math.floor(available/2);
 if(item.align==="bottom")top=available;
 top=Math.max(0,Math.min(available,top+Number(item.rowOffset||0)));
 let rows=Array.from({length:panelH},(_,r)=>{
   if(r>=top&&r<top+tiled.length)return tiled[r-top]||Array(w).fill(item.fillStitch);
   return Array(w).fill(item.fillStitch);
 });
 const before=Math.max(0,+item.gapBefore||0),after=Math.max(0,+item.gapAfter||0);
 return rows.map(r=>[...Array(before).fill(item.fillStitch),...r,...Array(after).fill(item.fillStitch)]);
}
function itemWidth(raw){
 const i=normalizeItem(raw);
 if(i.type==="spacer")return i.width;
 const m=motifs.find(x=>x.id===i.motifId);
 return m?(m.repeat.width*i.hRepeat+i.gapBefore+i.gapAfter):0;
}
function fieldRows(section){
 const h=fieldHeight(section);
 const chunks=section.items.map(i=>verticalized(i,h));
 return Array.from({length:h},(_,r)=>chunks.flatMap(c=>c[r]||[]));
}
function horizontalUnitRows(section){
 const items=(section.items||[]).map(normalizeItem);
 if(!items.length)return [[section.filler||K]];
 const temp={type:"field",heightMode:"auto",height:1,items};
 return fieldRows(temp);
}
function bandRows(section,target){
 const unit=horizontalUnitRows(section),unitH=Math.max(1,unit.length),unitW=Math.max(1,unit[0]?.length||1);
 const fillUnits=Math.max(0,Math.floor(target/unitW));
 const reps=section.horizontalBehavior==="fixed"
  ?Math.max(1,Math.min(fillUnits||1,Number(section.fixedUnits)||1))
  :fillUnits;
 const used=Math.min(target,reps*unitW),leftover=Math.max(0,target-used);
 let before=0,after=leftover;
 if(section.fitMode==="center"){before=Math.floor(leftover/2);after=leftover-before}
 if(section.fitMode==="custom"){before=Math.max(0,Math.min(leftover,+section.offset||0));after=leftover-before}
 const oneBand=unit.map(row=>{
  let body=[];
  for(let n=0;n<reps;n++){
   let piece=[...row];
   if(section.mirrorAlternate&&n%2===1)piece.reverse();
   body.push(...piece);
  }
  return [...Array(before).fill(section.filler),...body,...Array(after).fill(section.filler)];
 });
 let rows=[];
 for(let v=0;v<Math.max(1,+section.verticalRepeats||1);v++)rows.push(...oneBand.map(r=>[...r]));
 return rows;
}
function dividerRows(section,target){
 return Array.from({length:Math.max(1,+section.rows||1)},()=>Array(target).fill(section.stitch||P));
}
function sectionRows(section,target){
 if(section.type==="field")return fieldRows(section);
 if(section.type==="band")return bandRows(section,target);
 return dividerRows(section,target);
}
function sectionHeight(section){
 if(section.type==="field")return fieldHeight(section);
 if(section.type==="band"){
  return horizontalUnitRows(section).length*Math.max(1,+section.verticalRepeats||1);
 }
 return Math.max(1,+section.rows||1);
}

function shapedPanelMatrix(panelName,matrix,target){
 if(panelName!=="Gusset"||typeof panelSpecs==="undefined")return matrix;
 ensurePanelSpecs();
 const spec=panelSpecs.Gusset||{};
 if((spec.gussetShape||"diamond")==="rectangle")return matrix;
 const rows=matrix.length;
 if(!rows)return matrix;
 const maxW=Math.max(3,Math.min(target,Number(spec.gussetMaxWidth)||target));
 const tip=Math.max(1,Math.min(maxW,Number(spec.gussetTip)||1));
 const centerRows=Math.max(1,Number(spec.gussetCenterRows)||1);
 const shape=spec.gussetShape||"diamond";
 const growth=shape==="wide"?1.45:shape==="elongated"?.72:1;
 return matrix.map((row,r)=>{
  const mid=(rows-1)/2;
  const centerHalf=Math.max(0,(centerRows-1)/2);
  const distance=Math.max(0,Math.abs(r-mid)-centerHalf);
  const usableHalf=Math.max(1,mid-centerHalf);
  const fraction=Math.max(0,1-distance/usableHalf);
  const eased=Math.pow(fraction,growth);
  let width=Math.round(tip+(maxW-tip)*eased);
  if(width%2!==maxW%2)width=Math.max(tip,width-1);
  width=Math.max(tip,Math.min(maxW,width));
  const start=Math.floor((target-width)/2);
  const normalized=[...row.slice(0,target),...Array(Math.max(0,target-row.length)).fill(K)].slice(0,target);
  return normalized.map((v,c)=>c>=start&&c<start+width?v:"inactive");
 });
}
