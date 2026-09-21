import { db, collection, getDocs } from "./firebase.js";

function normalize(v){return String(v||"").trim().toLowerCase();}
function price(v){return "Rs. " + Number(v||0).toLocaleString("en-LK");}

async function loadPublicBooks(){
  try{
    const snap=await getDocs(collection(db,"books"));
    if(snap.empty)return;

    const books=snap.docs.map(d=>d.data()).filter(b=>b.published!==false);
    const byCode=new Map(books.map(b=>[normalize(b.code),b]));

    document.querySelectorAll(".product-card").forEach(card=>{
      const code=normalize(card.querySelector(".product-number")?.textContent);
      const book=byCode.get(code);
      if(!book)return;

      const priceEl=card.querySelector(".price");
      if(priceEl){
        const small=priceEl.querySelector("small");
        priceEl.textContent=price(book.price);
        if(small)priceEl.appendChild(small);
      }

      const title=card.querySelector("h3");
      if(title&&book.title)title.textContent=book.title;

      const sub=card.querySelector(".subtitle");
      if(sub&&book.subtitle)sub.textContent=book.subtitle;

      const img=card.querySelector(".product-image img");
      if(img&&book.image)img.src=book.image;

      const buy=card.querySelector(".buy-btn");
      if(buy){
        buy.addEventListener("click",e=>{
          e.preventDefault();
          e.stopImmediatePropagation();
          if(typeof window.openOrder==="function"){
            window.openOrder(book.code,book.title,Number(book.price||0),book.image||"");
          }
        },true);
      }
    });
  }catch(e){
    console.warn("Public catalog could not load:",e);
  }
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",loadPublicBooks);
}else{
  loadPublicBooks();
}
