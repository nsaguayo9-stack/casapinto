import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {parseCSV,parsePrice,normalise,optionGroups,orderURL} from '../src/catalog.js';
test('CSV real conserva filas, categorías, precios, stock y fotos',async()=>{
  const text=await fs.readFile(new URL('../catalogo-respaldo.csv',import.meta.url),'utf8');
  const rows=parseCSV(text).map(normalise);
  assert.equal(rows.length,141);assert.equal(new Set(rows.map(x=>x.id)).size,141);
  assert.equal(rows.find(x=>x.name==='Gyozas (5 unidades)').price,3990);
  assert.equal(rows.find(x=>x.name==='Papas fritas grandes').price,5000);
  assert.ok(rows.every(x=>x.stock&&x.photo===''));
});
test('CSV con comillas, saltos de línea y stock agotado',()=>{
  const row=parseCSV('id,categoría,nombre,descripción,precio,stock,foto\r\n1,Roll,"Sushi, especial","Línea 1\nLínea 2",$8.990,no,https://example.com/a.jpg')[0];
  assert.equal(row.nombre,'Sushi, especial');assert.equal(row.descripción,'Línea 1\nLínea 2');
  assert.equal(normalise(row).stock,false);assert.equal(normalise(row).photo,'https://example.com/a.jpg');
});
test('precios CLP de Sheet y opciones',()=>{
  for(const value of ['$3,990','$3.990','3990'])assert.equal(parsePrice(value),3990);
  assert.deepEqual(optionGroups('Envoltura: palta | salmón. Proteína: pollo | camarón').map(g=>g.choices.length),[2,2]);
});
test('WhatsApp conserva cantidades, opciones y total',()=>{
  const url=orderURL([{name:'Roll',price:5990,quantity:2,choice:'Pollo',note:'Sin cebollín'}]);
  const text=new URL(url).searchParams.get('text');
  assert.match(url,/56929859920/);assert.match(text,/2 × Roll/);assert.match(text,/\$11\.980/);assert.match(text,/Sin cebollín/);
});
