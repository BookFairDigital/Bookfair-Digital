import {
  db,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  deleteDoc
} from "./firebase.js";

const DEFAULT_BOOKS = [
  { code:"Book 01", title:"A/L Accounting", subtitle:"Advanced Level Accounting learning resource.", price:1500, image:"assets/accounting.jpg", published:true },
  { code:"Book 02", title:"LKAS & SLFRS Part-I", subtitle:"ප්‍රශ්නෝත්තර සංග්‍රහය · Part-I", price:1800, image:"assets/book-02.jpg", published:true },
  { code:"Book 03", title:"LKAS & SLFRS Part-II", subtitle:"ප්‍රශ්නෝත්තර සංග්‍රහය · Part-II", price:1800, image:"assets/book-03.jpg", published:true }
];

const $ = id => document.getElementById(id);

function esc(v){
  return String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function money(v){
  return "Rs. " + Number(v||0).toLocaleString("en-LK");
}

function activity(action, detail){
  const key="bf_admin_activity";
  const list=JSON.parse(localStorage.getItem(key)||"[]");
  list.unshift({action,detail,date:new Date().toISOString()});
  localStorage.setItem(key,JSON.stringify(list.slice(0,100)));
  renderActivity();
}

function renderActivity(){
  const box=$("activityList");
  if(!box) return;
  const list=JSON.parse(localStorage.getItem("bf_admin_activity")||"[]");
  if(!list.length){
    box.innerHTML='<div class="empty">No activity recorded yet.</div>';
    return;
  }
  box.innerHTML=list.map(x=>`
    <div class="activity">
      <div class="activity-icon">✓</div>
      <div><b>${esc(x.action)}</b><small>${esc(x.detail)} · ${esc(new Date(x.date).toLocaleString("en-LK"))}</small></div>
    </div>`).join("");
}

let books=[];

async function ensureDefaults(){
  const snap=await getDocs(collection(db,"books"));
  if(snap.empty){
    for(const book of DEFAULT_BOOKS){
      await setDoc(doc(db,"books",book.code.replace(/\s+/g,"-").toLowerCase()),{
        ...book, updatedAt:new Date().toISOString()
      });
    }
  }
}

async function loadBooks(){
  const status=$("booksStatus");
  try{
    if(status) status.textContent="Loading catalog…";
    await ensureDefaults();
    const snap=await getDocs(collection(db,"books"));
    books=snap.docs.map(d=>({id:d.id,...d.data()}));
    books.sort((a,b)=>String(a.code).localeCompare(String(b.code),undefined,{numeric:true}));
    renderBooks();
    if(status){status.textContent="● Catalog connected";status.className="status ok";}
  }catch(e){
    console.error("BOOK CATALOG ERROR",e);
    if(status){status.textContent="● Catalog unavailable — update Firestore rules for books.";status.className="status error";}
  }
}

function renderBooks(){
  const grid=$("booksGrid");
  if(!grid)return;
  grid.innerHTML=books.map(book=>`
    <article class="book-card">
      <div class="book-cover"><img src="${esc(book.image||"")}" alt="${esc(book.title||book.code)}" onerror="this.style.opacity='.15'"></div>
      <div class="book-body">
        <div class="book-code">${esc(book.code)}</div>
        <h3>${esc(book.title||"Untitled Book")}</h3>
        <p>${esc(book.subtitle||"")}</p>
        <div class="book-price">${money(book.price)}</div>
        <div class="book-meta">
          <span class="pill ${book.published!==false?"green":"gold"}">${book.published!==false?"PUBLISHED":"UNPUBLISHED"}</span>
          <button class="btn" data-edit-book="${esc(book.id)}">Edit</button>
        </div>
        <div class="book-actions">
          <button class="btn ${book.published!==false?"danger":"primary"}" data-toggle-book="${esc(book.id)}">${book.published!==false?"Unpublish":"Publish"}</button>
          <button class="btn danger" data-delete-book="${esc(book.id)}">Delete</button>
        </div>
      </div>
    </article>`).join("");
}

function openBook(book=null){
  $("bookModalTitle").textContent=book?"Edit Book":"Publish New Book";
  $("bookCode").value=book?.code||"";
  $("bookCode").disabled=!!book;
  $("bookPrice").value=book?.price??"";
  $("bookTitle").value=book?.title||"";
  $("bookSubtitle").value=book?.subtitle||"";
  $("bookImage").value=book?.image||"";
  $("bookPublished").value=String(book?.published!==false);
  $("bookModal").classList.add("show");
}

function closeBook(){
  $("bookModal").classList.remove("show");
}

$("newBookBtn")?.addEventListener("click",()=>openBook());
$("bookClose")?.addEventListener("click",closeBook);
$("bookCancel")?.addEventListener("click",closeBook);

$("bookSave")?.addEventListener("click",async()=>{
  const code=$("bookCode").value.trim();
  const title=$("bookTitle").value.trim();
  const price=Number($("bookPrice").value);
  if(!code||!title||!Number.isFinite(price)||price<0){
    alert("Book code, title and a valid price are required.");
    return;
  }
  const existing=books.find(b=>b.code===code);
  const id=existing?.id||code.toLowerCase().replace(/[^a-z0-9]+/g,"-");
  const data={
    code,title,
    subtitle:$("bookSubtitle").value.trim(),
    price,
    image:$("bookImage").value.trim(),
    published:$("bookPublished").value==="true",
    updatedAt:new Date().toISOString()
  };
  const btn=$("bookSave");
  btn.disabled=true;btn.textContent="Saving…";
  try{
    await setDoc(doc(db,"books",id),data,{merge:true});
    await loadBooks();
    closeBook();
    activity(existing?"Book Updated":"Book Published",`${code} · ${money(price)}`);
  }catch(e){
    console.error(e);
    alert("Could not save the book. Check Firestore books permissions.");
  }finally{
    btn.disabled=false;btn.textContent="Save Book";
  }
});

$("booksGrid")?.addEventListener("click",async(e)=>{
  const edit=e.target.closest("[data-edit-book]");
  const toggle=e.target.closest("[data-toggle-book]");
  const del=e.target.closest("[data-delete-book]");
  if(edit){
    const b=books.find(x=>x.id===edit.dataset.editBook);
    if(b)openBook(b);
    return;
  }
  if(toggle){
    const b=books.find(x=>x.id===toggle.dataset.toggleBook);
    if(!b)return;
    try{
      await setDoc(doc(db,"books",b.id),{published:b.published===false,updatedAt:new Date().toISOString()},{merge:true});
      await loadBooks();
      activity(b.published===false?"Book Published":"Book Unpublished",b.code);
    }catch(e){alert("Could not update publication status.");}
    return;
  }
  if(del){
    const b=books.find(x=>x.id===del.dataset.deleteBook);
    if(!b)return;
    if(!confirm(`Delete ${b.code} from the catalog?`))return;
    try{
      await deleteDoc(doc(db,"books",b.id));
      await loadBooks();
      activity("Book Deleted",b.code);
    }catch(e){alert("Could not delete the book.");}
  }
});

$("clearActivityBtn")?.addEventListener("click",()=>{
  if(!confirm("Clear the activity log on this admin browser?"))return;
  localStorage.removeItem("bf_admin_activity");
  renderActivity();
});

document.addEventListener("click",e=>{
  if(e.target.id==="importBtn" || e.target.closest("#importBtn"))
    activity("Excel Import Started","Student account import");
  if(e.target.id==="refreshOrdersBtn" || e.target.closest("#refreshOrdersBtn"))
    activity("Orders Refreshed","Google Sheet order list");
});

renderActivity();
loadBooks();
