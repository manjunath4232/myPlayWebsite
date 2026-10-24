export const defaultSettings={id:1,business_name:'MyPlay',tagline:'Good things, simply found.',description:'A little inspiration for your everyday. Explore our collection, find something you love, and talk to us on WhatsApp.',whatsapp_number:''};
export const sampleProducts=[
  ['arc-lamp','The Arc table lamp','Lighting',1890,'A warm glow and a sculptural silhouette. An illustrated example of how your product details will appear.',true],
  ['everyday-tote','Everyday canvas tote','Accessories',690,'A simple carryall for everyday essentials. Sample product for design preview.',true],
  ['ceramic-vase','Earth ceramic vase','Home & living',850,'Soft curves, earthy tones and a little space for your favourite stems. Sample product.',true],
  ['lounge-chair','Sunday lounge chair','Home & living',5490,'An inviting corner, wherever you put it. Sample product for design preview.',false],
  ['stoneware-mug','Morning stoneware mug','Kitchen',450,'For slow mornings and a well-earned pause. Sample product for design preview.',true],
  ['desk-clock','Little desk clock','Accessories',990,'A quiet companion for your shelf or desk. Sample product for design preview.',true]
].map(([id,name,category,price,description,available],i)=>({id,name,category,price,description,available,published:true,image_url:`/images/${id}.svg`,created_at:new Date(Date.UTC(2026,9,24-i)).toISOString()}));
