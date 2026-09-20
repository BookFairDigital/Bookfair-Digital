import {
  db,
  collection,
  getDocs
} from "./firebase.js";


/* =========================
   STORAGE KEYS
========================= */

const LOGIN_KEY = "bf_login";
const STUDENT_KEY = "bf_student";


/* =========================
   SAVE STUDENT
========================= */

function saveStudent(student) {

  localStorage.setItem(
    STUDENT_KEY,
    JSON.stringify(student)
  );

}


/* =========================
   MESSAGE
========================= */

function showMessage(
  message,
  error = true
) {

  const element =
    document.getElementById("m");

  if (!element) return;

  element.textContent =
    message;

  element.className =
    error
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
        document
          .getElementById("p")
          .value;


      const button =
        login.querySelector(
          'button[type="submit"]'
        );


      /* =====================
         VALIDATION
      ===================== */

      if (!username || !password) {

        showMessage(
          "Please enter your username and password."
        );

        return;

      }


      button.disabled =
        true;

      button.innerHTML =
        "Checking…";


      showMessage(
        "Checking your account…",
        false
      );


      try {

        /* =====================
           GET STUDENTS
        ===================== */

        const snapshot =
          await getDocs(
            collection(
              db,
              "students"
            )
          );


        let foundStudent =
          null;

        let foundId =
          null;


        /* =====================
           EXACT MATCH
        ===================== */

        snapshot.forEach(
          (item) => {

            if (foundStudent) {
              return;
            }


            const data =
              item.data();


            /*
             * Username
             *
             * Exact match.
             */
            const storedUsername =
              String(
                data.username ||
                data.Username ||
                item.id ||
                ""
              ).trim();


            /*
             * Password
             *
             * No modification.
             */
            const storedPassword =
              String(
                data.password ||
                data.Password ||
                ""
              );


            if (
              storedUsername === username &&
              storedPassword === password
            ) {

              foundStudent =
                data;

              foundId =
                item.id;

            }

          }
        );


        /* =====================
           INVALID LOGIN
        ===================== */

        if (!foundStudent) {

          showMessage(
            "Incorrect username or password."
          );

          return;

        }


        /* =====================
           ACTIVE CHECK
        ===================== */

        if (
          foundStudent.active === false
        ) {

          showMessage(
            "This student account is inactive. Please contact the administrator."
          );

          return;

        }


        /* =====================
           STUDENT DATA
        ===================== */

        const assignedBook =
          foundStudent.assignedBook ||
          foundStudent["Assigned Book"] ||
          "";


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
            foundStudent.Username ||
            username,

          assignedBook:
            String(
              assignedBook
            ).trim()

        };


        /* =====================
           SAVE LOGIN
        ===================== */

        localStorage.setItem(
          LOGIN_KEY,
          student.username
        );


        saveStudent(
          student
        );


        /* =====================
           REGISTRATION CHECK
        ===================== */

        if (
          foundStudent.registered !== true
        ) {

          showMessage(
            "Login successful. Please complete your registration.",
            false
          );


          setTimeout(
            () => {

              location.href =
                "register.html";

            },
            300
          );


          return;

        }


        /* =====================
           DASHBOARD
        ===================== */

        showMessage(
          "Login successful. Opening your books…",
          false
        );


        setTimeout(
          () => {

            location.href =
              "dashboard.html";

          },
          300
        );


      } catch (error) {

        console.error(
          "STUDENT LOGIN ERROR:",
          error
        );


        showMessage(
          "Could not connect to the student database. Please try again."
        );


      } finally {

        button.disabled =
          false;

        button.innerHTML =
          'Login <span>→</span>';

      }

    }
  );

}


/* =========================
   PROTECTED PAGES
========================= */

const protectedPages = [
  "dashboard.html",
  "register.html"
];


const currentPage =
  location.pathname
    .split("/")
    .pop();


if (
  protectedPages.includes(
    currentPage
  )
) {

  const student =
    localStorage.getItem(
      STUDENT_KEY
    );


  if (!student) {

    location.href =
      "login.html";

  }

}


/* =========================
   LOGOUT
========================= */

const logout =
  document.getElementById(
    "logout"
  );


if (logout) {

  logout.addEventListener(
    "click",
    () => {

      localStorage.removeItem(
        LOGIN_KEY
      );

      localStorage.removeItem(
        STUDENT_KEY
      );


      location.href =
        "login.html";

    }
  );

}
