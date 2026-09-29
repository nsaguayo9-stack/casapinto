import {SHEET_URL,parseCSV,normalise,money,optionGroups,orderURL} from './catalog.js';

const $=id=>document.getElementById(id);
const state={products:[],cart:[],category:'Todos',query:'',source:''};
const storeKey='casa-pinto-cart-v1';
try{state.cart=JSON.parse(localStorage.getItem(storeKey))||[];}catch{}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function setStatus(text){$('catalogStatus').textContent=text;}
async function loadCatalog(){
  setStatus('Actualizando la carta…');
  let response,source='online';
  try{response=await fetch(`${SHEET_URL}&_=${Date.now()}`,{cache:'no-store'});if(!response.ok)throw Error(`HTTP ${response.status}`);}
  catch{source='respaldo';try{response=await fetch('/catalogo-respaldo.csv',{cache:'no-store'});}catch{setStatus('No se pudo cargar la carta. Intenta actualizarla.');return;}}
  if(!response?.ok){setStatus('No se pudo cargar la carta. Intenta actualizarla.');return;}
  const raw=parseCSV(await response.text());
  if(!raw.length||!('nombre' in raw[0])||!('precio' in raw[0])){setStatus('La carta no tiene el formato esperado. Intenta actualizarla.');return;}
  state.products=raw.map(normalise).filter(p=>p.name&&Number.isFinite(p.price));state.source=source;
  state.cart=state.cart.filter(item=>state.products.some(p=>p.id===item.id&&p.stock));
  for(const item of state.cart){const current=state.products.find(p=>p.id===item.id);item.price=current.price;item.name=current.name;}
  saveCart();renderCategories();renderProducts();renderCart();
  setStatus(`${state.products.length} productos · ${source==='online'?'Carta actualizada':'Mostrando una copia de la carta; pulsa «Actualizar carta» para reintentar.'}`);
}
function renderCategories(){
  const categories=['Todos',...new Set(state.products.map(p=>p.category))];
  if(!categories.includes(state.category))state.category='Todos';
  $('categories').innerHTML=categories.map(c=>`<button type="button" class="category ${c===state.category?'active':''}" data-category="${escape(c)}" aria-pressed="${c===state.category}">${escape(c)}</button>`).join('');
}
function renderProducts(){
  const q=state.query.toLocaleLowerCase('es-CL');
  const list=state.products.filter(p=>(state.category==='Todos'||p.category===state.category)&&(!q||`${p.name} ${p.description} ${p.options}`.toLocaleLowerCase('es-CL').includes(q)));
  $('emptyState').hidden=!!list.length;
  $('products').innerHTML=list.map(p=>`<article class="product" data-id="${escape(p.id)}">${p.photo?`<div class="product-image"><img src="${escape(p.photo)}" alt="${escape(p.name)}" loading="lazy" referrerpolicy="no-referrer"></div>`:''}${!p.stock?'<span class="out-badge">Agotado</span>':''}<div class="product-body"><span class="product-type">${escape(p.category)}</span><h3>${escape(p.name)}</h3>${p.description?`<p class="product-desc" title="${escape(p.description)}">${escape(p.description)}</p>`:''}${p.options?`<p class="product-options">${escape(p.options)}</p>`:''}<div class="product-footer"><span class="product-price">${money(p.price)}</span><button class="add-button" type="button" data-add="${escape(p.id)}" ${p.stock?'':'disabled'}>${p.stock?'Agregar +':'Agotado'}</button></div></div></article>`).join('');
  for(const img of $('products').querySelectorAll('.product-image img'))img.addEventListener('error',()=>img.parentElement?.remove(),{once:true});
}
function saveCart(){try{localStorage.setItem(storeKey,JSON.stringify(state.cart));}catch{}}
function addItem(product,choice='',note=''){
  const key=JSON.stringify([product.id,choice,note]);
  const existing=state.cart.find(i=>i.key===key);
  if(existing)existing.quantity++;else state.cart.push({key,id:product.id,name:product.name,price:product.price,choice,note,quantity:1});
  saveCart();renderCart();openCart();
}
function renderCart(){
  const totalCount=state.cart.reduce((n,i)=>n+i.quantity,0);
  $('cartCount').textContent=totalCount;$('mobileCartCount').textContent=totalCount;
  $('cartItems').innerHTML=state.cart.length?state.cart.map((i,n)=>`<div class="cart-item"><div class="cart-item-top"><div><strong>${escape(i.name)}</strong>${i.choice?`<small>${escape(i.choice)}</small>`:''}${i.note?`<small>Nota: ${escape(i.note)}</small>`:''}</div><strong>${money(i.price*i.quantity)}</strong></div><div class="qty"><button type="button" data-qty="${n}" data-delta="-1" aria-label="Restar ${escape(i.name)}">−</button><span>${i.quantity}</span><button type="button" data-qty="${n}" data-delta="1" aria-label="Sumar ${escape(i.name)}">+</button><button type="button" class="remove" data-remove="${n}">Eliminar</button></div></div>`).join(''):'<p class="cart-empty">Tu pedido está vacío. Elige algo rico de la carta para empezar.</p>';
  $('cartTotal').textContent=money(state.cart.reduce((sum,i)=>sum+i.price*i.quantity,0));
  $('checkout').href=state.cart.length?orderURL(state.cart):'#';$('checkout').classList.toggle('disabled',!state.cart.length);
}
function openCart(){$('cartDrawer').hidden=false;$('drawerBackdrop').hidden=false;document.body.style.overflow='hidden';$('closeCart').focus();}
function closeCart(){$('cartDrawer').hidden=true;$('drawerBackdrop').hidden=true;document.body.style.overflow='';}
let pendingProduct=null;
function openOptions(product){
  pendingProduct=product;$('optionTitle').textContent=product.name;$('optionDescription').textContent=product.description||'';$('itemNote').value='';
  $('optionFields').innerHTML=optionGroups(product.options).map((g,i)=>`<label class="field-label">${escape(g.label)}<select name="group${i}" required>${g.choices.map(x=>`<option value="${escape(x)}">${escape(x)}</option>`).join('')}</select></label>`).join('');
  $('optionDialog').hidden=false;$('optionBackdrop').hidden=false;document.body.style.overflow='hidden';$('closeOptions').focus();
}
function closeOptions(){$('optionDialog').hidden=true;$('optionBackdrop').hidden=true;pendingProduct=null;document.body.style.overflow='';}

$('categories').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;state.category=b.dataset.category;renderCategories();renderProducts();});
$('products').addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(!b)return;const p=state.products.find(x=>x.id===b.dataset.add);if(!p?.stock)return;if(p.options)openOptions(p);else addItem(p);});
$('searchInput').addEventListener('input',e=>{state.query=e.target.value.trim();renderProducts();});
$('refreshButton').addEventListener('click',loadCatalog);
$('promoLink').addEventListener('click',()=>{state.category='Promociones mixtas';renderCategories();renderProducts();});
$('openCart').addEventListener('click',openCart);$('mobileCart').addEventListener('click',openCart);$('closeCart').addEventListener('click',closeCart);$('drawerBackdrop').addEventListener('click',closeCart);
$('cartItems').addEventListener('click',e=>{const r=e.target.closest('[data-remove]'),b=e.target.closest('[data-qty]');if(r)state.cart.splice(Number(r.dataset.remove),1);else if(b){const i=state.cart[Number(b.dataset.qty)];if(!i)return;i.quantity+=Number(b.dataset.delta);if(i.quantity<1)state.cart.splice(Number(b.dataset.qty),1);}else return;saveCart();renderCart();});
$('closeOptions').addEventListener('click',closeOptions);$('optionBackdrop').addEventListener('click',closeOptions);
$('optionForm').addEventListener('submit',e=>{e.preventDefault();if(!pendingProduct)return;const form=new FormData(e.target);const choice=optionGroups(pendingProduct.options).map((g,i)=>`${g.label}: ${form.get('group'+i)}`).join('; ');const p=pendingProduct,note=$('itemNote').value.trim();closeOptions();addItem(p,choice,note);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('optionDialog').hidden)closeOptions();else if(!$('cartDrawer').hidden)closeCart();}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastLoad>5*60*1000)reload();});
let lastLoad=0;async function reload(){lastLoad=Date.now();await loadCatalog();}
setInterval(()=>{if(!document.hidden)reload();},5*60*1000);
renderCart();reload();
