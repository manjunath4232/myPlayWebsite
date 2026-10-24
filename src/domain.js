export const money = value => new Intl.NumberFormat('en-IN', {style:'currency',currency:'INR',minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(value));
export function phoneDigits(value) {
  const digits = String(value || '').replace(/[\s()+-]/g,'');
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : '';
}
export function whatsappLink(phone, product, siteName) {
  const number=phoneDigits(phone);
  if(!number) return null;
  const message=product ? `Hi! I'm interested in ${product.name} (${money(product.price)}) from ${siteName}. Is it available?` : `Hi! I'd like to know more about the ${siteName} collection.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
export function filterProducts(products,{search='',category='All',availableOnly=false,sort='newest'}={}) {
  const query=search.trim().toLowerCase();
  return products.filter(p=>(category==='All'||p.category===category)&&(!availableOnly||p.available)&&(!query||`${p.name} ${p.category} ${p.description}`.toLowerCase().includes(query))).sort((a,b)=>sort==='price-low'?a.price-b.price:sort==='price-high'?b.price-a.price:new Date(b.created_at)-new Date(a.created_at));
}
export function validateProduct(p) {
  if(!p.name.trim()||p.name.trim().length>100) throw Error('Enter a product name with up to 100 characters.');
  if(!p.category.trim()||p.category.trim().length>50) throw Error('Enter a category with up to 50 characters.');
  if(String(p.price).trim()===''||!Number.isFinite(Number(p.price))||Number(p.price)<0||Number(p.price)>99999999) throw Error('Enter a valid price between ₹0 and ₹99,999,999.');
  if((p.description||'').length>2000) throw Error('Keep the description under 2,000 characters.');
  return {...p,name:p.name.trim(),category:p.category.trim(),price:Math.round(Number(p.price)*100)/100};
}
