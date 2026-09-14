import {
  db,
  doc,
  getDoc,
  signOut
} from "./firebase.js";

const KEY = "bf_login";
const STUDENT = "bf_student";

function saveStudent(data) {
  localStorage.setItem(
    STUDENT,
    JSON.stringify(data)
  );
}

function getStudent() {
  try {
    return JSON.parse(
      localStorage.getItem(STUDENT) || "null"
    );
  } catch {
    return null;
  }
}


// =========================
// SIMPLE STUDENT LOGIN
// =========================

const login = document.getElementById("login");

if (login) {

  login.addEventListener("submit", async (e) => {

    e.preventDefault();

    const username =
      document.getElementById("u").value.trim();

    const password =
      document.getElementById("p").value;

    const message =
      document.getElementById("m");

    const button =
      login.querySelector(
        'button[type="submit"]'
      );

    if (!username || !password) {
      message.textContent =
        "Please enter your username and password.";

      message.className =
        "error-msg";

      return;
    }

    button.disabled = true;
    button.innerHTML = "Checking…";
    message.textContent = "";

    try {

      // Find student document using username
      const ref =
        doc(
          db,
          "students",
          username
        );

      const snap =
        await getDoc(ref);

      if (!snap.exists()) {

        message.textContent =
          "Invalid username or password.";

        message.className =
          "error-msg";

        return;
      }

      const data =
        snap.data();

      // Check active status
      if (data.active === false) {

        message.textContent =
          "This account is inactive. Please contact the administrator.";

        message.className =
          "error-msg";

        return;
      }

      // Check password
      if (
        data.password !== password
      ) {

        message.textContent =
          "Invalid username or password.";

        message.className =
          "error-msg";

        return;
      }

      // Save login
      localStorage.setItem(
        KEY,
        data.username || username
      );

      saveStudent(data);

      // First login
      if (
        data.registered !== true
      ) {

        location.href =
          "register.html";

        return;
      }

      // Already registered
      location.href =
        "dashboard.html";

    } catch (err) {

      console.error(
        "LOGIN ERROR:",
        err
      );

      message.textContent =
        "Could not connect to the database. Please try again.";

      message.className =
        "error-msg";

    } finally {

      button.disabled = false;

      button.innerHTML =
        'Login <span>→</span>';
    }
  });
}


// =========================
// DASHBOARD PROTECTION
// =========================

if (
  document.getElementById("dashboard") &&
  !getStudent()
) {

  location.href =
    "login.html";
}


// =========================
// LOGOUT
// =========================

document
  .querySelectorAll("[data-logout]")
  .forEach((button) => {

    button.addEventListener(
      "click",
      async () => {

        localStorage.removeItem(KEY);
        localStorage.removeItem(STUDENT);

        location.href =
          "login.html";
      }
    );
  });


// =========================
// VIEWER PROTECTION
// =========================

document.addEventListener(
  "contextmenu",
  (e) => {

    if (
      document.body.classList.contains(
        "viewer"
      )
    ) {
      e.preventDefault();
    }
  }
);


document.addEventListener(
  "keydown",
  (e) => {

    if (
      !document.body.classList.contains(
        "viewer"
      )
    ) {
      return;
    }

    const key =
      e.key.toLowerCase();

    if (
      (e.ctrlKey || e.metaKey) &&
      ["p", "s", "u"].includes(key)
    ) {

      e.preventDefault();
    }

    if (
      key === "printscreen"
    ) {

      e.preventDefault();
    }
  }
);
