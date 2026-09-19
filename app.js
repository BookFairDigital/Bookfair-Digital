import {
  db,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc
} from "./firebase.js";

const KEY = "bf_login";
const STUDENT = "bf_student";

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

const login =
  document.getElementById("login");

if (login) {

  login.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      const username =
        document
          .getElementById("u")
          .value
          .trim();

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
         * Read existing student records.
         *
         * This supports both:
         *
         * students/{username}
         *
         * and
         *
         * students/{firebaseUid}
         *
         * where the document contains:
         * username
         * password
         */

        const snapshot =
          await getDocs(
            collection(
              db,
              "students"
            )
          );

        let foundStudent = null;
        let foundId = null;

        snapshot.forEach(
          (item) => {

            if (foundStudent) {
              return;
            }

            const data =
              item.data();

            const storedUsername =
              String(
                data.username ||
                item.id ||
                ""
              ).trim();

            const storedPassword =
              String(
                data.password ||
                ""
              );

            if (
              storedUsername === username &&
              storedPassword === password
            ) {

              foundStudent = data;
              foundId = item.id;

            }

          }
        );


        /*
         * No matching student.
         */

        if (!foundStudent) {

          showMessage(
            "Incorrect username or password."
          );

          return;
        }


        /*
         * Check active status.
         */

        if (
          foundStudent.active === false
        ) {

          showMessage(
            "This student account is inactive. Please contact the administrator."
          );

          return;
        }


        /*
         * Save login session.
         */

        const student = {

          ...foundStudent,

          uid:
            foundStudent.authUid ||
            foundStudent.uid ||
            "",

          docId:
            foundId,

          username:
            foundStudent.username ||
            username

        };


        localStorage.setItem(
          KEY,
          student.username
        );

        saveStudent(
          student
        );


        /*
         * First login.
         */

        if (
          foundStudent.registered !== true
        ) {

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

        showMessage(
          "Could not connect to the student database. Please try again."
        );

      } finally {

        button.disabled = false;

        button.innerHTML =
          'Login <span>→</span>';

      }

    }
  );

}


/* =========================
   DASHBOARD PROTECTION
========================= */

if (
  document.getElementById(
    "dashboard"
  )
) {

  const student =
    localStorage.getItem(
      STUDENT
    );

  if (!student) {

    location.href =
      "login.html";

  }

}


/* =========================
   LOGOUT
========================= */

document
  .querySelectorAll(
    "[data-logout]"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

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

    }
  );


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
