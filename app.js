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
    return JSON.parse(
      localStorage.getItem(STUDENT) || "null"
    );
  } catch (e) {
    return null;
  }
}

function putStudent(data) {
  localStorage.setItem(
    STUDENT,
    JSON.stringify(data)
  );
}

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

    button.innerHTML =
      "Signing in…";

    message.textContent = "";

    try {

      /*
       * Student username is converted into the
       * internal Firebase Authentication email.
       *
       * Example:
       * TEST26-00001
       * becomes
       * test26-00001@bookfairdigital.local
       */

      const email =
        username.toLowerCase() +
        "@bookfairdigital.local";


      /*
       * Firebase Authentication login
       */

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );


      /*
       * Student Firestore document uses
       * the username as the document ID.
       *
       * students/TEST26-00001
       */

      const ref =
        doc(
          db,
          "students",
          username
        );


      const snap =
        await getDoc(ref);


      /*
       * Student document must exist.
       */

      if (!snap.exists()) {

        await signOut(auth);

        message.textContent =
          "Student account was found in Login, but the Firestore student record was not found.";

        message.className =
          "error-msg";

        return;
      }


      const data =
        snap.data();


      /*
       * Check account status.
       */

      if (data.active === false) {

        await signOut(auth);

        message.textContent =
          "This student account is inactive. Please contact the administrator.";

        message.className =
          "error-msg";

        return;
      }


      /*
       * Save username locally only as a
       * session helper.
       *
       * Student data itself remains in Firestore.
       */

      localStorage.setItem(
        KEY,
        username
      );

      putStudent(data);


      /*
       * First-time student:
       * registered = false
       *
       * Go to registration.
       */

      if (data.registered !== true) {

        location.href =
          "register.html";

        return;
      }


      /*
       * Already registered:
       * Go directly to dashboard.
       */

      location.href =
        "dashboard.html";

    } catch (err) {

      console.error(
        "LOGIN ERROR:",
        err
      );


      /*
       * Show the REAL Firebase error
       * temporarily so we can identify
       * the exact problem.
       */

      let errorText =
        err?.code ||
        err?.message ||
        "Unknown error";


      message.textContent =
        "Login error: " +
        errorText;

      message.className =
        "error-msg";

    } finally {

      button.disabled = false;

      button.innerHTML =
        'Login <span>→</span>';
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

  location.href =
    "login.html";
}


/*
 * Logout
 */

document
  .querySelectorAll("[data-logout]")
  .forEach((button) => {

    button.addEventListener(
      "click",
      async () => {

        try {

          await signOut(auth);

        } catch (e) {

          console.error(
            "Logout error:",
            e
          );
        }

        localStorage.removeItem(
          KEY
        );

        localStorage.removeItem(
          STUDENT
        );

        location.href =
          "login.html";
      }
    );
  });


/*
 * View-only answer protection
 */

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
