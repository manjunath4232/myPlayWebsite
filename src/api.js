import {createClient} from '@supabase/supabase-js';
import {validateProduct,phoneDigits} from './domain';
export const configured=Boolean(import.meta.env.VITE_SUPABASE_URL&&import.meta.env.VITE_SUPABASE_ANON_KEY);
export const supabase=configured?createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY):null;
function check(result){if(result.error)throw result.error;return result.data;}
export async function loadCatalog(owner=false){
  let query=supabase.from('products').select('*').order('created_at',{ascending:false});
  if(!owner)query=query.eq('published',true);
  const [products,settings]=await Promise.all([query,supabase.from('store_settings').select('*').eq('id',1).single()]);
  const rows=check(products);const paths=rows.map(p=>p.image_path).filter(Boolean);
  let signed=[];
  if(paths.length)signed=check(await supabase.storage.from('product-images').createSignedUrls(paths,3600));
  const urls=new Map(signed.filter(i=>!i.error).map(i=>[i.path,i.signedUrl]));
  return {products:rows.map(p=>({...p,image_url:urls.get(p.image_path)||null})),settings:check(settings)};
}
export async function isOwner(){return check(await supabase.rpc('is_owner'));}
export async function compressPhoto(file){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPG, PNG or WebP image.');
  if(file.size>15*1024*1024)throw Error('Choose an image smaller than 15 MB.');
  const image=await createImageBitmap(file);
  try{const scale=Math.min(1,1400/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.8));if(!blob||blob.size>2*1024*1024)throw Error('This photo is too large after compression. Choose a smaller image.');return blob;}finally{image.close();}
}
export async function saveProduct(raw,file,old){
  const valid=validateProduct(raw);const id=old?.id||crypto.randomUUID();let path=old?.image_path||null;
  if(file){const photo=await compressPhoto(file);path=`${id}/${crypto.randomUUID()}.webp`;check(await supabase.storage.from('product-images').upload(path,photo,{contentType:'image/webp',upsert:false}));}
  if(!path)throw Error('Add a product photo.');
  const payload={id,name:valid.name,category:valid.category,price:valid.price,description:valid.description,available:valid.available,published:valid.published,image_path:path};
  const result=await supabase.from('products').upsert(payload);
  if(result.error){if(file)await supabase.storage.from('product-images').remove([path]);throw result.error;}
  if(file&&old?.image_path)await supabase.storage.from('product-images').remove([old.image_path]);
}
export async function deleteProduct(product){check(await supabase.from('products').delete().eq('id',product.id));if(product.image_path){const result=await supabase.storage.from('product-images').remove([product.image_path]);if(result.error)throw Error('Product deleted, but its photo cleanup failed. Remove the unused photo from Storage.');}}
export async function saveSettings(values){
  if(!values.business_name.trim()||values.business_name.trim().length>80)throw Error('Enter a business name with up to 80 characters.');
  if(values.whatsapp_number&&!phoneDigits(values.whatsapp_number))throw Error('Use a WhatsApp number with country code, for example +91 followed by your 10-digit number.');
  check(await supabase.from('store_settings').update({...values,business_name:values.business_name.trim(),whatsapp_number:values.whatsapp_number?phoneDigits(values.whatsapp_number):''}).eq('id',1));
}
