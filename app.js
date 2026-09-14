const $=id=>document.getElementById(id);
document.addEventListener('DOMContentLoaded',()=>{
 const l=$('login'); if(l) l.onsubmit=e=>{e.preventDefault();localStorage.setItem('bf_login',$('u').value.trim());location='register.html'};
 const r=$('reg'); if(r){$('ru').value=localStorage.getItem('bf_login')||'';r.onsubmit=e=>{e.preventDefault();localStorage.setItem('bf_student',JSON.stringify({username:$('ru').value,name:$('name').value,district:$('district').value,phone:$('phone').value}));localStorage.removeItem('bf_login');location='dashboard.html'}};
 const w=$('welcome'); if(w){let s=JSON.parse(localStorage.getItem('bf_student')||'null');if(!s)location='login.html';else w.textContent='Welcome, '+s.name};
 if(document.body.classList.contains('viewer'))document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&['p','s','u'].includes(e.key.toLowerCase()))e.preventDefault();if(e.key==='PrintScreen')e.preventDefault()});
});
function logout(){localStorage.removeItem('bf_student');location='login.html'}