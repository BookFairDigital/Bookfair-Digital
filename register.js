import { auth, db, doc, getDoc, setDoc } from "./firebase.js";

const form = document.getElementById("reg");
const message = document.getElementById("rm");

const usernameInput = document.getElementById("ru");
const nameInput = document.getElementById("name");
const districtInput = document.getElementById("district");
const phoneInput = document.getElementById("phone");

function showMessage(text, error = true) {
  message.textContent = text;
  message.className = error ? "error-msg" : "success-msg";
}

async function loadRegistration() {
  const user = auth.currentUser;

  if (!user) {
    location.href = "login.html";
    return;
  }

  try {
    const ref = doc(db, "students", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      showMessage(
        "This student account is not configured yet. Please contact the administrator."
      );
      return;
    }

    const data = snap.data();

    if (data.active === false) {
      showMessage(
        "This student account is inactive. Please contact the administrator."
      );
      return;
    }

    // Username comes from the assigned Firebase/Firestore account.
    // It cannot be changed by the student.
    const username =
      data.username || localStorage.getItem("bf_login") || "";

    usernameInput.value = username;
    usernameInput.dataset.username = username;

    if (data.fullName) {
      nameInput.value = data.fullName;
    }

    if (data.district) {
      districtInput.value = data.district;
    }

    if (data.contact) {
      phoneInput.value = data.contact;
    }

    localStorage.setItem("bf_login", username);

  } catch (err) {
    console.error("Registration profile load error:", err);

    showMessage(
      "Could not load your account. Please refresh and try again."
    );
  }
}

form.onsubmit = async (e) => {
  e.preventDefault();

  const user = auth.currentUser;

  if (!user) {
    location.href = "login.html";
    return;
  }

  const username =
    usernameInput.dataset.username ||
    usernameInput.value.trim();

  const fullName = nameInput.value.trim();
  const district = districtInput.value;
  const contact = phoneInput.value.trim();

  if (!username) {
    showMessage(
      "Your assigned username could not be loaded. Please log in again."
    );
    return;
  }

  if (!fullName || !district || !contact) {
    showMessage("Please complete all registration fields.");
    return;
  }

  const button = form.querySelector('button[type="submit"]');

  button.disabled = true;
  button.innerHTML = "Saving…";

  showMessage("Saving your registration…", false);

  try {
    const ref = doc(db, "students", user.uid);
    const existing = await getDoc(ref);

    if (!existing.exists()) {
      showMessage(
        "Your assigned account was not found in the database. Please contact the administrator."
      );
      return;
    }

    const old = existing.data();

    if (old.active === false) {
      showMessage(
        "This student account is inactive. Please contact the administrator."
      );
      return;
    }

    await setDoc(
      ref,
      {
        // Keep the original assigned username.
        username: old.username || username,

        // Student-entered information.
        fullName: fullName,
        district: district,
        contact: contact,

        registered: true,

        // Preserve account settings.
        active: old.active !== false,
        book: old.book || "01"
      },
      { merge: true }
    );

    localStorage.setItem(
      "bf_login",
      old.username || username
    );

    location.href = "dashboard.html";

  } catch (err) {
    console.error("Registration save error:", err);

    if (err?.code === "permission-denied") {
      showMessage(
        "Registration is not permitted for this account. Please contact the administrator."
      );
    } else {
      showMessage(
        "Could not save registration. Please try again."
      );
    }

  } finally {
    button.disabled = false;
    button.innerHTML =
      'Complete Registration <span>→</span>';
  }
};

loadRegistration();
