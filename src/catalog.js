export const SHEET_URL='https://docs.google.com/spreadsheets/d/e/2PACX-1vRVdafluBoJbO23133BKohRJQsCYAdSA6AL1Jt4eznhLsPVXScNSxyOh9ttMdBMCg/pub?gid=877140092&single=true&output=csv';
export const WHATSAPP='56929859920';

export function parseCSV(text){
  const records=[]; let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"') {if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(field);field='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(x=>x!==''))records.push(row);row=[];field='';}
    else field+=c;
  }
  if(field||row.length){row.push(field);records.push(row);}
  const headers=(records.shift()||[]).map(s=>s.replace(/^\uFEFF/,'').trim().toLowerCase());
  return records.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||'').trim()])));
}

export function parsePrice(input){
  let s=String(input??'').replace(/[^\d.,]/g,'');
  if(!s)return NaN;
  // CLP entero: 3.990, 3,990, $3990. También acepta celdas numéricas con .0.
  if(/^\d+[.,]0{1,2}$/.test(s))return Number(s.replace(/[.,]0{1,2}$/,''));
  if(/[.,]/.test(s))s=s.replace(/[.,]/g,'');
  return Number(s);
}

export function available(stock){return ['sí','si','yes','true','1','disponible','en stock'].includes(String(stock||'').trim().toLowerCase());}
export function normalise(row){return {id:row.id||row.nombre,name:row.nombre||'',category:row['categoría']||row.categoria||'Otros',description:row['descripción']||row.descripcion||'',options:row['opciones/tamaños']||row.opciones||'',price:parsePrice(row.precio),stock:available(row.stock),photo:(row.foto||'').trim()};}
export const money=n=>'$'+Number(n||0).toLocaleString('es-CL');

export function optionGroups(text){
  if(!text)return [];
  const chunks=text.split(/\.\s+(?=[A-ZÁÉÍÓÚÑ][^:]{0,30}:)/).map(x=>x.trim()).filter(Boolean);
  let groups=[];
  for(const chunk of chunks){
    const colon=chunk.indexOf(':');
    if(colon>=0){const label=chunk.slice(0,colon).trim();const choices=chunk.slice(colon+1).split('|').map(x=>x.trim()).filter(Boolean);if(choices.length>1)groups.push({label,choices});}
    else if(chunk.includes('|'))groups.push({label:'Elige una opción',choices:chunk.split('|').map(x=>x.trim())});
  }
  return groups;
}

export function orderURL(items){
  const lines=['Hola, quiero hacer un pedido en Casa Pinto:',''];
  for(const item of items){lines.push(`• ${item.quantity} × ${item.name} — ${money(item.price*item.quantity)}`);if(item.choice)lines.push(`  Opción: ${item.choice}`);if(item.note)lines.push(`  Indicaciones: ${item.note}`);}
  const total=items.reduce((s,i)=>s+i.price*i.quantity,0);
  lines.push('',`Total: ${money(total)}`,'', '¿Me confirman disponibilidad y entrega?');
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
}
