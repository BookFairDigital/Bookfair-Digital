import {
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

  const saved =
    localStorage.getItem(
      "bf_student"
    );

  if (!saved) {

    location.href =
      "login.html";

    return;
  }


  const student =
    JSON.parse(saved);

  const docId =
    student.docId;


  if (!docId) {

    showMessage(
      "Your login session is invalid. Please login again."
    );

    return;
  }


  try {

    const ref =
      doc(
        db,
        "students",
        docId
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


    if (
      data.active === false
    ) {

      showMessage(
        "This student account is inactive."
      );

      return;
    }


    usernameInput.value =
      data.username ||
      student.username ||
      "";

    usernameInput.dataset.username =
      data.username ||
      student.username ||
      "";

    nameInput.value =
      data.fullName ||
      "";

    districtInput.value =
      data.district ||
      "";

    phoneInput.value =
      data.contact ||
      "";


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
   SAVE REGISTRATION
========================= */

form.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();


    const saved =
      localStorage.getItem(
        "bf_student"
      );

    if (!saved) {

      location.href =
        "login.html";

      return;
    }


    const student =
      JSON.parse(saved);

    const docId =
      student.docId;


    if (!docId) {

      showMessage(
        "Your login session is invalid. Please login again."
      );

      return;
    }


    const fullName =
      nameInput.value.trim();

    const district =
      districtInput.value;

    const contact =
      phoneInput.value.trim();


    if (
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

      const ref =
        doc(
          db,
          "students",
          docId
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
        old.active === false
      ) {

        throw new Error(
          "This student account is inactive."
        );

      }


      await setDoc(
        ref,
        {
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


      const updatedStudent = {

        ...old,

        ...student,

        docId,

        username:
          old.username ||
          student.username,

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


      setTimeout(
        () => {

          location.href =
            "dashboard.html";

        },
        300
      );


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
