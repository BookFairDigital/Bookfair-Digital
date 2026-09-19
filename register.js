import {
  auth,
  db,
  doc,
  getDoc,
  setDoc
} from "./firebase.js";

const form =
  document.getElementById("reg");

const message =
  document.getElementById("rm");

const usernameInput =
  document.getElementById("ru");

const nameInput =
  document.getElementById("name");

const districtInput =
  document.getElementById("district");

const phoneInput =
  document.getElementById("phone");


function showMessage(
  text,
  error = true
) {

  message.textContent =
    text;

  message.className =
    error
      ? "error-msg"
      : "success-msg";
}


/* =========================
   LOAD STUDENT
========================= */

async function loadStudent() {

  const user =
    auth.currentUser;

  if (!user) {

    location.href =
      "login.html";

    return;
  }


  try {

    const ref =
      doc(
        db,
        "students",
        user.uid
      );


    const snap =
      await getDoc(ref);


    if (!snap.exists()) {

      showMessage(
        "Student account was not found. Please contact the administrator."
      );

      return;
    }


    const data =
      snap.data();


    if (data.active === false) {

      showMessage(
        "This student account is inactive."
      );

      return;
    }


    usernameInput.value =
      data.username || "";

    usernameInput.dataset.username =
      data.username || "";


    nameInput.value =
      data.fullName || "";

    districtInput.value =
      data.district || "";

    phoneInput.value =
      data.contact || "";


  } catch (error) {

    console.error(
      "LOAD REGISTRATION ERROR:",
      error
    );

    showMessage(
      "Could not load your account. Please refresh and try again."
    );

  }

}


/* =========================
   REGISTRATION
========================= */

form.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();


    const user =
      auth.currentUser;


    if (!user) {

      location.href =
        "login.html";

      return;
    }


    const username =
      usernameInput.dataset.username ||
      usernameInput.value.trim();

    const fullName =
      nameInput.value.trim();

    const district =
      districtInput.value;

    const contact =
      phoneInput.value.trim();


    if (
      !username ||
      !fullName ||
      !district ||
      !contact
    ) {

      showMessage(
        "Please complete all registration fields."
      );

      return;
    }


    const button =
      form.querySelector(
        'button[type="submit"]'
      );


    button.disabled =
      true;

    button.innerHTML =
      "Saving…";


    showMessage(
      "Saving your registration…",
      false
    );


    try {

      /*
       * IMPORTANT:
       * Use Firebase Auth UID,
       * NOT username, for the document.
       */
      const ref =
        doc(
          db,
          "students",
          user.uid
        );


      const snap =
        await getDoc(ref);


      if (!snap.exists()) {

        throw new Error(
          "Student profile not found."
        );
      }


      const old =
        snap.data();


      if (
        old.authUid &&
        old.authUid !== user.uid
      ) {

        throw new Error(
          "This account is not authorized for this student profile."
        );
      }


      if (old.active === false) {

        throw new Error(
          "This student account is inactive."
        );
      }


      /*
       * Only update registration fields.
       */
      await setDoc(
        ref,
        {
          username:
            old.username ||
            username,

          fullName:
            fullName,

          district:
            district,

          contact:
            contact,

          registered:
            true

        },
        {
          merge: true
        }
      );


      /*
       * Update local session.
       */
      const updatedStudent = {
        ...old,

        uid:
          user.uid,

        username:
          old.username ||
          username,

        fullName,

        district,

        contact,

        registered:
          true
      };


      localStorage.setItem(
        "bf_login",
        updatedStudent.username
      );


      localStorage.setItem(
        "bf_student",
        JSON.stringify(
          updatedStudent
        )
      );


      showMessage(
        "Registration saved successfully.",
        false
      );


      /*
       * Give Firestore a moment to finish
       * before changing page.
       */
      setTimeout(() => {

        location.href =
          "dashboard.html";

      }, 300);


    } catch (error) {

      console.error(
        "REGISTRATION SAVE ERROR:",
        error
      );


      showMessage(
        error.message ||
        "Could not save registration. Please try again."
      );


    } finally {

      button.disabled =
        false;

      button.innerHTML =
        'Complete Registration <span>→</span>';

    }

  }
);


/* =========================
   START
========================= */

loadStudent();
