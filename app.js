import {
  auth,
  db,
  doc,
  getDoc,
  signInWithEmailAndPassword,
  signOut
} from "./firebase.js";

const KEY = "bf_login";
const STUDENT = "bf_student";

const emailForUsername = (username) =>
  username.trim().toLowerCase() + "@bookfairdigital.local";

function saveStudent(data) {
  localStorage.setItem(
    STUDENT,
    JSON.stringify(data)
  );
}

function showMessage(message, error = true) {
  const element = document.getElementById("m");

  if (!element) return;

  element.textContent = message;
  element.className = error
    ? "error-msg"
    : "success-msg";
}


/* =========================
   STUDENT LOGIN
========================= */

const login = document.getElementById("login");

if (login) {

  login.addEventListener("submit", async (e) => {

    e.preventDefault();

    const username =
      document.getElementById("u").value.trim();

    const password =
      document.getElementById("p").value;

    const button =
      login.querySelector(
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

      /*
       * Clear any previous session.
       */
      try {
        await signOut(auth);
      } catch (_) {}


      /*
       * Firebase Authentication login.
       */
      const credential =
        await signInWithEmailAndPassword(
          auth,
          emailForUsername(username),
          password
        );


      /*
       * Student profile is stored using
       * Firebase Auth UID.
       */
      const studentRef =
        doc(
          db,
          "students",
          credential.user.uid
        );


      const snapshot =
        await getDoc(studentRef);


      if (!snapshot.exists()) {

        await signOut(auth);

        showMessage(
          "Login succeeded, but your student profile is not configured. Please contact the administrator."
        );

        return;
      }


      const data =
        snapshot.data();


      /*
       * Account disabled.
       */
      if (data.active === false) {

        await signOut(auth);

        showMessage(
          "This student account is inactive. Please contact the administrator."
        );

        return;
      }


      /*
       * Save session data.
       */
      localStorage.setItem(
        KEY,
        data.username || username
      );

      saveStudent({
        ...data,
        uid: credential.user.uid
      });


      /*
       * First login → registration.
       */
      if (data.registered !== true) {

        location.href =
          "register.html";

        return;
      }


      /*
       * Already registered.
       */
      location.href =
        "dashboard.html";


    } catch (error) {

      console.error(
        "STUDENT LOGIN ERROR:",
        error
      );

      const code =
        error?.code || "";

      let message =
        "Incorrect username or password.";

      if (
        code ===
        "auth/user-not-found"
      ) {

        message =
          "This username is not registered.";

      } else if (
        code ===
        "auth/invalid-credential"
      ) {

        message =
          "Incorrect username or password.";

      } else if (
        code ===
        "auth/wrong-password"
      ) {

        message =
          "Incorrect username or password.";

      } else if (
        code ===
        "auth/too-many-requests"
      ) {

        message =
          "Too many login attempts. Please wait a few minutes and try again.";

      } else if (
        code ===
        "auth/network-request-failed"
      ) {

        message =
          "Network error. Please check your internet connection and try again.";

      } else if (
        code ===
        "permission-denied"
      ) {

        message =
          "Your account exists, but the student profile cannot be accessed. Please contact the administrator.";

      }

      showMessage(message);

    } finally {

      button.disabled = false;

      button.innerHTML =
        'Login <span>→</span>';

    }

  });

}


/* =========================
   DASHBOARD PROTECTION
========================= */

if (
  document.getElementById("dashboard")
) {

  const student =
    localStorage.getItem(STUDENT);

  if (!student) {

    location.href =
      "login.html";
  }

}


/* =========================
   LOGOUT
========================= */

document
  .querySelectorAll("[data-logout]")
  .forEach((button) => {

    button.addEventListener(
      "click",
      async () => {

        try {
          await signOut(auth);
        } catch (error) {
          console.error(
            "LOGOUT ERROR:",
            error
          );
        }

        localStorage.removeItem(KEY);
        localStorage.removeItem(STUDENT);

        location.href =
          "login.html";

      }
    );

  });


/* =========================
   VIEWER PROTECTION
========================= */

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
