import {
  auth,
  db,
  signInWithEmailAndPassword,
  signOut,
  doc,
  getDoc
} from "./firebase.js";

const KEY = "bf_login";
const STUDENT = "bf_student";

function student() {
  try {
    return JSON.parse(localStorage.getItem(STUDENT) || "null");
  } catch (e) {
    return null;
  }
}

function putStudent(data) {
  localStorage.setItem(STUDENT, JSON.stringify(data));
}

const login = document.getElementById("login");

if (login) {
  login.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("u").value.trim();
    const password = document.getElementById("p").value;
    const message = document.getElementById("m");
    const button = login.querySelector('button[type="submit"]');

    if (!username || !password) {
      message.textContent = "Please enter your username and password.";
      message.className = "error-msg";
      return;
    }

    button.disabled = true;
    button.innerHTML = "Signing in…";

    try {
      /*
       * Firebase Authentication uses an internal email format.
       * Students still use only their assigned username/password
       * on the website.
       */
      const email =
        username.toLowerCase() + "@bookfairdigital.local";

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      /*
       * Student data is stored using the username as the
       * Firestore document ID.
       *
       * students/TEST26-00001
       */
      const ref = doc(db, "students", username);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await signOut(auth);

        message.textContent =
          "This student account is not configured yet. Please contact the administrator.";
        message.className = "error-msg";
        return;
      }

      const data = snap.data();

      if (data.active === false) {
        await signOut(auth);

        message.textContent =
          "This account is inactive. Please contact the administrator.";
        message.className = "error-msg";
        return;
      }

      /*
       * Keep the username in the browser only as a session helper.
       * The actual student record remains in Firestore.
       */
      localStorage.setItem(KEY, username);
      putStudent(data);

      if (data.registered === true) {
        location.href = "dashboard.html";
      } else {
        location.href = "register.html";
      }

    } catch (err) {
      console.error("Login error:", err);

      let text = "Login failed. Please check your username and password.";

      if (
        err?.code === "auth/invalid-credential" ||
        err?.code === "auth/wrong-password" ||
        err?.code === "auth/user-not-found"
      ) {
        text = "Incorrect username or password.";
      }

      message.textContent = text;
      message.className = "error-msg";

    } finally {
      button.disabled = false;
      button.innerHTML = "Login <span>→</span>";
    }
  });
}

/*
 * Dashboard protection
 */
if (
  document.getElementById("dashboard") &&
  !student()
) {
  location.href = "login.html";
}

/*
 * Logout
 */
document.querySelectorAll("[data-logout]").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Logout error:", e);
    }

    localStorage.removeItem(KEY);
    localStorage.removeItem(STUDENT);

    location.href = "login.html";
  });
});

/*
 * View-only answer protection
 */
document.addEventListener("contextmenu", (e) => {
  if (document.body.classList.contains("viewer")) {
    e.preventDefault();
  }
});

document.addEventListener("keydown", (e) => {
  if (!document.body.classList.contains("viewer")) {
    return;
  }

  const key = e.key.toLowerCase();

  if (
    (e.ctrlKey || e.metaKey) &&
    ["p", "s", "u"].includes(key)
  ) {
    e.preventDefault();
  }

  if (key === "printscreen") {
    e.preventDefault();
  }
});
