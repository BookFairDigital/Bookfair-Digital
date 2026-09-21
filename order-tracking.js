const BOOKFAIR_TRACKING_API = "https://script.google.com/macros/s/AKfycbyJPyMYQy10tYPWoonku6i319WIT7dIukMaXjJXeIgYIRWEKXkeVUzfHebxkLx_ygYdUA/exec";
const orderInput = document.getElementById("orderNo");
const trackBtn = document.getElementById("trackBtn");
const result = document.getElementById("result");
function esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function money(value){return "Rs. "+Number(value||0).toLocaleString("en-LK");}
function formatDate(value){const d=new Date(value);return Number.isNaN(d.getTime())?String(value||"—"):d.toLocaleString("en-LK",{dateStyle:"medium",timeStyle:"short"});}
async function trackOrder(){
  const orderNo=orderInput.value.trim();
  if(!orderNo){result.innerHTML='<div class="notice">Please enter your order number.</div>';return;}
  trackBtn.disabled=true;trackBtn.textContent="Checking…";result.innerHTML='<div class="notice">Checking your order…</div>';
  try{
    const response=await fetch(BOOKFAIR_TRACKING_API+"?action=track&orderNo="+encodeURIComponent(orderNo),{cache:"no-store"});
    const data=await response.json();
    if(!data.success){result.innerHTML='<div class="notice">'+esc(data.message||"Order not found.")+'</div>';return;}
    const order=data.order||{};
    result.innerHTML=`<div class="order-head"><div><div class="order-no">${esc(order.orderNo)}</div><div class="date">${esc(formatDate(order.date))}</div></div><div class="status">${esc(order.status||"Payment Checking")}</div></div><div class="grid"><div class="item"><small>BOOK</small><strong>${esc(order.book||"—")}</strong></div><div class="item"><small>QUANTITY</small><strong>${esc(order.quantity||0)}</strong></div><div class="item"><small>CUSTOMER</small><strong>${esc(order.customer||"—")}</strong></div><div class="item"><small>TOTAL</small><strong>${esc(money(order.total))}</strong></div></div><button class="refresh" id="refreshTrack" type="button">↻ Refresh Status</button>`;
    document.getElementById("refreshTrack")?.addEventListener("click",trackOrder);
  }catch(error){console.error(error);result.innerHTML='<div class="notice">Could not connect to the order tracking service. Please try again.</div>';}finally{trackBtn.disabled=false;trackBtn.textContent="Track Order";}
}
trackBtn.addEventListener("click",trackOrder);
orderInput.addEventListener("keydown",e=>{if(e.key==="Enter")trackOrder();});
const p=new URLSearchParams(location.search);const order=p.get("order");if(order){orderInput.value=order;trackOrder();}
