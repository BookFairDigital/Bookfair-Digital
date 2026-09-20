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
   ELEMENTS
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
   AUTO SESSION LOGIN
========================================= */

onAuthStateChanged(
  auth,
  async (user) => {

    /*
     * No existing session.
     * Stay on login page.
     */

    if (!user) {
      return;
    }


    /*
     * Existing Firebase session belongs
     * to the administrator.
     */

    if (
      user.uid ===
      ADMIN_UID
    ) {

      window.location.replace(
        "admin.html"
      );

      return;
    }


    /*
     * A different Firebase account is
     * currently logged in.
     *
     * Automatically remove that session.
     */

    try {

      await signOut(auth);

    } catch (_) {}

  }
);


/* =========================================
   LOGIN
========================================= */

if (form) {

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


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


      /*
       * Basic validation
       */

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


      /*
       * Visible admin username.
       *
       * Firebase uses the internal email
       * behind the scenes.
       */

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


      /*
       * Loading state
       */

      button.disabled =
        true;

      button.innerHTML =
        "Authenticating…";


      message.textContent =
        "Checking administrator access…";

      message.className =
        "";


      try {

        /*
         * Firebase authentication
         */

        const credential =
          await signInWithEmailAndPassword(
            auth,
            ADMIN_INTERNAL_EMAIL,
            password
          );


        /*
         * Double-check UID.
         *
         * Even if the internal email exists,
         * only the configured admin UID may
         * access the dashboard.
         */

        if (
          credential.user.uid !==
          ADMIN_UID
        ) {

          await signOut(auth);

          throw new Error(
            "Unauthorized administrator."
          );

        }


        /*
         * Success
         */

        message.textContent =
          "Access granted. Opening dashboard…";

        message.className =
          "success-msg";


        setTimeout(
          () => {

            window.location.replace(
              "admin.html"
            );

          },
          250
        );


      } catch (error) {

        console.error(
          "ADMIN LOGIN ERROR:",
          error
        );


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
