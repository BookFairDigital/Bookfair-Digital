import {
  db,
  collection,
  getDocs
} from "./firebase.js";

const KEY = "bf_login";
const STUDENT = "bf_student";

function saveStudent(data) {
  localStorage.setItem(STUDENT, JSON.stringify(data));
}

function showMessage(message, error = true) {
  const element = document.getElementById("m");

  if (!element) return;

  element.textContent = message;
  element.className = error
    ? "error-msg"
    : "success-msg";
}

const login = document.getElementById("login");

if (login) {
  login.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document
      .getElementById("u")
      .value
      .trim();

    const password = document
      .getElementById("p")
      .value;

    const button = login.querySelector(
      'button[type="submit"]'
    );

    if (!username || !password) {
      showMessage(
        "Please enter your username and password."
      );
      return;
    }

    button.disabled = true;
    button.innerHTML = "Checking…";

    showMessage(
      "Checking your account…",
      false
    );

    try {
      const snapshot = await getDocs(
        collection(db, "students")
      );

      let foundStudent = null;
      let foundId = null;

      snapshot.forEach((item) => {
        if (foundStudent) return;

        const data = item.data();

        const storedUsername = String(
          data.username || item.id || ""
        ).trim();

        const storedPassword = String(
          data.password || ""
        );

        if (
          storedUsername === username &&
          storedPassword === password
        ) {
          foundStudent = data;
          foundId = item.id;
        }
      });

      if (!foundStudent) {
        showMessage(
          "Incorrect username or password."
        );
        return;
      }

      if (foundStudent.active === false) {
        showMessage(
          "This student account is inactive. Please contact the administrator."
        );
        return;
      }

      const student = {
        ...foundStudent,
        uid:
          foundStudent.authUid ||
          foundStudent.uid ||
          "",
        docId: foundId,
        username:
          foundStudent.username ||
          username
      };

      localStorage.setItem(
        KEY,
        student.username
      );

      saveStudent(student);

      if (foundStudent.registered !== true) {
        location.href = "register.html";
        return;
      }

      location.href = "dashboard.html";

    } catch (error) {
      console.error(
        "STUDENT LOGIN ERROR:",
        error
      );

      showMessage(
        "Could not connect to the student database. Please try again."
      );

    } finally {
      button.disabled = false;
      button.innerHTML =
        'Login <span>→</span>';
    }
  });
}


// ===============================
// DASHBOARD PROTECTION
// ===============================

const protectedPages = [
  "dashboard.html",
  "register.html"
];

const currentPage =
  location.pathname
    .split("/")
    .pop();

if (
  protectedPages.includes(currentPage)
) {
  const student =
    localStorage.getItem(STUDENT);

  if (!student) {
    location.href = "login.html";
  }
}


// ===============================
// LOGOUT
// ===============================

const logout =
  document.getElementById("logout");

if (logout) {
  logout.addEventListener(
    "click",
    () => {
      localStorage.removeItem(KEY);
      localStorage.removeItem(STUDENT);

      location.href = "login.html";
    }
  );
}
