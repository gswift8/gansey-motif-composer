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
 if(item.mirrored)base=base.map(r=>[...r].reverse());
 const horizontal=Array.from({length:base.length},()=>[]);
 for(let n=0;n<item.hRepeat;n++)base.forEach((r,i)=>horizontal[i].push(...r));
 return horizontal;
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
 const stitchOffset=Number(item.stitchOffset||0);
 return rows.map(r=>{
  let full=[...Array(before).fill(item.fillStitch),...r,...Array(after).fill(item.fillStitch)];
  if(stitchOffset>0){
   full=[...Array(stitchOffset).fill(item.fillStitch),...full].slice(0,full.length);
  }else if(stitchOffset<0){
   const amount=Math.min(full.length,Math.abs(stitchOffset));
   full=[...full.slice(amount),...Array(amount).fill(item.fillStitch)];
  }
  return full;
 });
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
 const reps=Math.max(0,Math.floor(target/unitW)),used=reps*unitW,leftover=Math.max(0,target-used);
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
