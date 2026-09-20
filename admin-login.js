import {
  auth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "./firebase.js";


/* =========================================
   ADMIN CONFIG
========================================= */

const ADMIN_UID =
  "SU2kLL2ovwPXGyJ436s8PJpLJQZ2";

const ADMIN_USERNAME =
  "admin";

const ADMIN_INTERNAL_EMAIL =
  "admin@bookfairdigital.local";


/* =========================================
   LOGIN FORM
========================================= */

const form =
  document.getElementById(
    "adminLogin"
  );

const message =
  document.getElementById(
    "adminMsg"
  );


/* =========================================
   CHECK EXISTING LOGIN SESSION
========================================= */

onAuthStateChanged(
  auth,
  async (user) => {

    /*
      No existing session.
      Stay on login page.
    */

    if (!user) {
      return;
    }


    /*
      Existing admin session found.

      Automatically open dashboard.
      No password required again.
    */

    if (
      user.uid === ADMIN_UID
    ) {

      window.location.replace(
        "admin.html"
      );

      return;
    }


    /*
      A different Firebase account is logged in.
      Remove that session.
    */

    try {

      await signOut(auth);

    } catch (error) {

      console.error(
        "SESSION SIGN OUT ERROR:",
        error
      );

    }

  }
);


/* =========================================
   ADMIN LOGIN
========================================= */

if (form) {

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      /* -------------------------------------
         GET INPUTS
      ------------------------------------- */

      const username =
        document
          .getElementById(
            "adminUsername"
          )
          .value
          .trim()
          .toLowerCase();


      const password =
        document
          .getElementById(
            "adminPassword"
          )
          .value;


      const button =
        form.querySelector(
          "button[type='submit']"
        );


      /* -------------------------------------
         VALIDATION
      ------------------------------------- */

      if (
        !username ||
        !password
      ) {

        message.textContent =
          "Please enter your username and password.";

        message.className =
          "error-msg";

        return;

      }


      /* -------------------------------------
         ADMIN USERNAME
      ------------------------------------- */

      if (
        username !==
        ADMIN_USERNAME
      ) {

        message.textContent =
          "Invalid admin username or password.";

        message.className =
          "error-msg";

        return;

      }


      /* -------------------------------------
         LOGIN STATE
      ------------------------------------- */

      button.disabled =
        true;

      button.innerHTML =
        "Signing in…";


      message.textContent =
        "Checking administrator access...";

      message.className = "";


      /* -------------------------------------
         FIREBASE LOGIN
      ------------------------------------- */

      try {

        const credential =
          await signInWithEmailAndPassword(
            auth,
            ADMIN_INTERNAL_EMAIL,
            password
          );


        /* -----------------------------------
           VERIFY ADMIN UID
        ----------------------------------- */

        if (
          credential.user.uid !==
          ADMIN_UID
        ) {

          await signOut(auth);

          throw new Error(
            "Unauthorized administrator."
          );

        }


        /* -----------------------------------
           LOGIN SUCCESS
        ----------------------------------- */

        message.textContent =
          "Login successful. Opening dashboard…";

        message.className =
          "success-msg";


        /*
          Open dashboard ONCE.

          There is NO repeating refresh.
        */

        setTimeout(
          () => {

            window.location.replace(
              "admin.html"
            );

          },
          300
        );


      } catch (error) {

        console.error(
          "ADMIN LOGIN ERROR:",
          error
        );


        /* -----------------------------------
           LOGIN FAILED
        ----------------------------------- */

        message.textContent =
          "Invalid admin username or password.";

        message.className =
          "error-msg";


        button.disabled =
          false;

        button.innerHTML =
          "Sign in to Dashboard <span>→</span>";

      }

    }
  );

}
