import {auth,signInWithEmailAndPassword} from "./firebase.js";

const f = document.getElementById("adminLogin");
const m = document.getElementById("adminMsg");

// Firebase Email/Password requires an email internally.
// The admin only enters the visible username "admin".
const ADMIN_USERNAME = "admin";
const ADMIN_INTERNAL_EMAIL = "admin@bookfairdigital.local";

f.onsubmit = async (e) => {
  e.preventDefault();
  m.textContent = "Signing in…";
  m.className = "";

  const username = document.getElementById("adminUsername").value.trim().toLowerCase();
  const password = document.getElementById("adminPassword").value;

  if (username !== ADMIN_USERNAME) {
    m.textContent = "Invalid admin username or password.";
    m.className = "error-msg";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, ADMIN_INTERNAL_EMAIL, password);
    location.href = "admin.html";
  } catch (err) {
    m.textContent = "Invalid admin username or password.";
    m.className = "error-msg";
  }
};
