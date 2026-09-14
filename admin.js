import {
  auth,
  db,
  doc,
  setDoc,
  getDocs,
  getDoc,
  collection,
  deleteDoc
} from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


const ADMIN_UID =
  "SU2kLL2ovwPXGyJ436s8PJpLJQZ2";


/* =========================
   ADMIN AUTH
========================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    location.href = "admin-login.html";
    return;
  }

  if (user.uid !== ADMIN_UID) {

    await signOut(auth);

    alert(
      "This account is not authorized as an administrator."
    );

    location.href = "admin-login.html";
    return;
  }

  initAdmin();
});


/* =========================
   ADMIN
========================= */

async function initAdmin() {

  const $ = (id) =>
    document.getElementById(id);

  const rows = $("rows");
  const empty = $("empty");
  const modal = $("modal");
  const toast = $("toast");
  const detailModal =
    $("detailModal");

  let students = [];


  /* =========================
     HELPERS
  ========================= */

  const esc = (value) =>
    String(value ?? "")
      .replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char]));


  function bookName(book) {

    if (book === "01")
      return "Book 01 · A/L Accounting";

    if (book === "02")
      return "Book 02";

    if (book === "03")
      return "Book 03";

    return "Not assigned";
  }


  function normalizeBook(value) {

    const text =
      String(value ?? "")
        .trim()
        .toLowerCase();

    if (
      text === "01" ||
      text === "book 01" ||
      text.includes("book 01")
    ) {
      return "01";
    }

    if (
      text === "02" ||
      text === "book 02" ||
      text.includes("book 02")
    ) {
      return "02";
    }

    if (
      text === "03" ||
      text === "book 03" ||
      text.includes("book 03")
    ) {
      return "03";
    }

    return "";
  }


  function validUsername(username) {

    return /^[A-Za-z0-9._-]{3,40}$/.test(
      username
    );

  }


  function randomPassword() {

    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

    return Array.from(
      { length: 10 },
      () =>
        chars[
          Math.floor(
            Math.random() * chars.length
          )
        ]
    ).join("");

  }


  function showToast(
    text,
    error = false
  ) {

    toast.textContent = text;

    toast.className =
      "toast show" +
      (error ? " error" : "");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);

  }


  /* =========================
     LOAD STUDENTS
  ========================= */

  async function loadStudents() {

    const status =
      $("dbStatus");

    try {

      const snapshot =
        await getDocs(
          collection(
            db,
            "students"
          )
        );


      students =
        snapshot.docs.map(
          (item) => ({
            id: item.id,
            ...item.data()
          })
        );


      if (status) {

        status.textContent =
          "● Firestore connected";

        status.classList.remove(
          "error"
        );
      }


      render();

    } catch (error) {

      console.error(
        "LOAD STUDENTS ERROR:",
        error
      );


      if (status) {

        status.textContent =
          "● Firestore unavailable";

        status.classList.add(
          "error"
        );

      }


      showToast(
        "Could not load students from Firestore.",
        true
      );

    }

  }


  /* =========================
     RENDER
  ========================= */

  function render() {

    const search =
      (
        $("search")?.value || ""
      )
        .toLowerCase()
        .trim();


    const bookFilter =
      $("bookFilter")?.value ||
      "all";


    const registrationFilter =
      $("registrationFilter")?.value ||
      "all";


    const filtered =
      students.filter(
        (student) => {

          const searchable =
            `
              ${student.username || ""}
              ${student.fullName || ""}
              ${student.district || ""}
              ${student.contact || ""}
            `
              .toLowerCase();


          const matchesSearch =
            searchable.includes(
              search
            );


          const matchesBook =
            bookFilter === "all" ||
            student.assignedBook ===
              `Book ${bookFilter}` ||
            student.book === bookFilter;


          const matchesRegistration =
            registrationFilter ===
              "all" ||

            (
              registrationFilter ===
                "registered" &&
              student.registered === true
            ) ||

            (
              registrationFilter ===
                "pending" &&
              student.registered !== true
            );


          return (
            matchesSearch &&
            matchesBook &&
            matchesRegistration
          );

        }
      );


    rows.innerHTML =
      filtered
        .map(
          (student) => {

            const book =
              student.assignedBook ||
              (
                student.book
                  ? `Book ${student.book}`
                  : ""
              );


            return `
              <tr
                class="student-row"
                data-id="${esc(student.id)}"
              >

                <td>
                  <strong>
                    ${esc(
                      student.username ||
                      student.id
                    )}
                  </strong>
                </td>


                <td>
                  <span class="muted">
                    ${esc(
                      student.password ||
                      "—"
                    )}
                  </span>
                </td>


                <td>
                  ${esc(
                    bookName(
                      student.book ||
                      normalizeBook(book)
                    )
                  )}
                </td>


                <td>
                  ${esc(
                    student.fullName ||
                    "Not registered"
                  )}
                </td>


                <td>
                  ${esc(
                    student.district ||
                    "—"
                  )}
                </td>


                <td>
                  ${esc(
                    student.contact ||
                    "—"
                  )}
                </td>


                <td>

                  <span
                    class="pill ${
                      student.registered
                        ? "green"
                        : "gold"
                    }"
                  >

                    ${
                      student.registered
                        ? "REGISTERED"
                        : "PENDING"
                    }

                  </span>

                </td>


                <td>

                  <span
                    class="pill ${
                      student.active === false
                        ? "gold"
                        : "green"
                    }"
                  >

                    ${
                      student.active === false
                        ? "INACTIVE"
                        : "ACTIVE"
                    }

                  </span>

                </td>


                <td>

                  <button
                    class="delete-student admin-btn danger"
                    data-id="${esc(student.id)}"
                    data-username="${esc(
                      student.username ||
                      student.id
                    )}"
                    type="button"
                  >
                    Delete
                  </button>

                </td>

              </tr>
            `;

          }
        )
        .join("");


    empty.style.display =
      filtered.length
        ? "none"
        : "block";


    /* =========================
       STATISTICS
    ========================= */

    $("total").textContent =
      students.length;


    $("b1").textContent =
      students.filter(
        (student) =>
          student.book === "01" ||
          student.assignedBook === "Book 01"
      ).length;


    $("b2").textContent =
      students.filter(
        (student) =>
          student.book === "02" ||
          student.assignedBook === "Book 02"
      ).length;


    $("b3").textContent =
      students.filter(
        (student) =>
          student.book === "03" ||
          student.assignedBook === "Book 03"
      ).length;


    $("registered").textContent =
      students.filter(
        (student) =>
          student.registered === true
      ).length;


    $("pending").textContent =
      students.filter(
        (student) =>
          student.registered !== true
      ).length;


    $("active").textContent =
      students.filter(
        (student) =>
          student.active !== false
      ).length;


    $("inactive").textContent =
      students.filter(
        (student) =>
          student.active === false
      ).length;


    /* =========================
       ROW EVENTS
    ========================= */

    document
      .querySelectorAll(
        ".student-row"
      )
      .forEach((row) => {

        row.onclick = (event) => {

          if (
            event.target.closest(
              ".delete-student"
            )
          ) {
            return;
          }

          showDetails(
            row.dataset.id
          );

        };

      });


    document
      .querySelectorAll(
        ".delete-student"
      )
      .forEach((button) => {

        button.onclick =
          async (event) => {

            event.stopPropagation();

            const id =
              button.dataset.id;

            const username =
              button.dataset.username;


            const confirmed =
              confirm(
                `Delete student account "${username}"?\n\nThis will permanently delete the Firestore student record.\n\nThis action cannot be undone.`
              );


            if (!confirmed) {
              return;
            }


            button.disabled = true;

            button.textContent =
              "Deleting…";


            try {

              await deleteDoc(
                doc(
                  db,
                  "students",
                  id
                )
              );


              students =
                students.filter(
                  (student) =>
                    student.id !== id
                );


              render();


              showToast(
                `Student ${username} deleted successfully.`
              );


            } catch (error) {

              console.error(
                "DELETE ERROR:",
                error
              );


              button.disabled =
                false;

              button.textContent =
                "Delete";


              showToast(
                "Could not delete this student.",
                true
              );

            }

          };

      });

  }


  /* =========================
     DETAILS
  ========================= */

  function showDetails(id) {

    const student =
      students.find(
        (item) =>
          item.id === id
      );


    if (!student) {
      return;
    }


    $("detailContent").innerHTML = `

      <div class="detail-grid">

        <div>
          <small>USERNAME</small>
          <strong>
            ${esc(
              student.username ||
              student.id
            )}
          </strong>
        </div>


        <div>
          <small>PASSWORD</small>
          <strong>
            ${esc(
              student.password ||
              "—"
            )}
          </strong>
        </div>


        <div>
          <small>ASSIGNED BOOK</small>
          <strong>
            ${esc(
              bookName(
                student.book ||
                normalizeBook(
                  student.assignedBook
                )
              )
            )}
          </strong>
        </div>


        <div>
          <small>FULL NAME</small>
          <strong>
            ${esc(
              student.fullName ||
              "Not registered"
            )}
          </strong>
        </div>


        <div>
          <small>DISTRICT</small>
          <strong>
            ${esc(
              student.district ||
              "Not provided"
            )}
          </strong>
        </div>


        <div>
          <small>CONTACT NUMBER</small>
          <strong>
            ${esc(
              student.contact ||
              "Not provided"
            )}
          </strong>
        </div>


        <div>
          <small>REGISTRATION</small>
          <strong>
            ${
              student.registered
                ? "Registered"
                : "First Login / Pending"
            }
          </strong>
        </div>


        <div>
          <small>ACCOUNT</small>
          <strong>
            ${
              student.active === false
                ? "Inactive"
                : "Active"
            }
          </strong>
        </div>

      </div>

    `;


    detailModal.classList.add(
      "show"
    );

  }


  /* =========================
     CREATE STUDENT
  ========================= */

  async function createStudent(
    username,
    password,
    book
  ) {

    username =
      username.trim();

    password =
      password.trim();


    if (
      !validUsername(username)
    ) {

      throw new Error(
        "Username must contain 3–40 letters, numbers, dot, underscore or hyphen."
      );

    }


    if (
      password.length < 6
    ) {

      throw new Error(
        "Password must be at least 6 characters."
      );

    }


    if (
      !["01","02","03"]
        .includes(book)
    ) {

      throw new Error(
        "Invalid book assignment."
      );

    }


    const ref =
      doc(
        db,
        "students",
        username
      );


    const existing =
      await getDoc(ref);


    if (existing.exists()) {

      throw new Error(
        "That username already exists."
      );

    }


    await setDoc(
      ref,
      {
        username,
        password,
        assignedBook:
          `Book ${book}`,

        fullName: "",
        district: "",
        contact: "",

        registered: false,
        active: true,

        createdAt:
          new Date().toISOString()
      }
    );


    return {
      username,
      password,
      book
    };

  }


  /* =========================
     NEW STUDENT MODAL
  ========================= */

  $("newBtn").onclick =
    () => {

      modal.classList.add(
        "show"
      );

      $("newUser").value =
        "";

      $("newPass").value =
        randomPassword();

      $("newUser").focus();

    };


  function closeModal() {

    modal.classList.remove(
      "show"
    );

  }


  $("close").onclick =
    closeModal;


  $("cancel").onclick =
    closeModal;


  $("detailClose").onclick =
    () => {

      detailModal.classList.remove(
        "show"
      );

    };


  $("gen").onclick =
    () => {

      $("newPass").value =
        randomPassword();

    };


  $("create").onclick =
    async () => {

      const button =
        $("create");


      const username =
        $("newUser")
          .value
          .trim();


      const password =
        $("newPass")
          .value
          .trim();


      const book =
        $("newBook")
          .value;


      if (!username || !password) {

        showToast(
          "Username and password are required.",
          true
        );

        return;

      }


      button.disabled =
        true;

      button.textContent =
        "Creating…";


      try {

        await createStudent(
          username,
          password,
          book
        );


        closeModal();


        showToast(
          `Student ${username} created successfully.`
        );


        await loadStudents();


        alert(
          `STUDENT ACCOUNT CREATED\n\nUsername: ${username}\nPassword: ${password}\nAssigned: ${bookName(book)}\n\nSave these credentials securely.`
        );


      } catch (error) {

        console.error(
          "CREATE ERROR:",
          error
        );


        showToast(
          error.message ||
          "Account creation failed.",
          true
        );

      } finally {

        button.disabled =
          false;

        button.textContent =
          "Create Student";

      }

    };


  /* =========================
     EXCEL EXPORT
  ========================= */

  function downloadExcel(
    list,
    filename
  ) {

    const rows =
      list.map(
        (student) => ({

          "Username":
            student.username || "",

          "Password":
            student.password || "",

          "Assigned Book":
            student.book
              ? `Book ${student.book}`
              : student.assignedBook || "",

          "Full Name":
            student.fullName || "",

          "District":
            student.district || "",

          "Contact Number":
            student.contact || ""

        })
      );


    const worksheet =
      XLSX.utils.json_to_sheet(
        rows,
        {
          header: [
            "Username",
            "Password",
            "Assigned Book",
            "Full Name",
            "District",
            "Contact Number"
          ]
        }
      );


    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 28 },
      { wch: 25 },
      { wch: 18 },
      { wch: 18 }
    ];


    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Student Accounts"
    );


    XLSX.writeFile(
      workbook,
      filename
    );

  }


  $("downloadBtn").onclick =
    () => {

      downloadExcel(
        students,
        "bookfair-students-export.xlsx"
      );

    };


  /* =========================
     EXCEL TEMPLATE
  ========================= */

  function downloadTemplate() {

    const exampleRows = [

      {
        "Username":
          "BF26-00001",

        "Password":
          "BookFair@123",

        "Assigned Book":
          "Book 01",

        "Full Name":
          "",

        "District":
          "",

        "Contact Number":
          ""
      },

      {
        "Username":
          "BF26-00002",

        "Password":
          "BookFair@456",

        "Assigned Book":
          "Book 02",

        "Full Name":
          "",

        "District":
          "",

        "Contact Number":
          ""
      }

    ];


    const worksheet =
      XLSX.utils.json_to_sheet(
        exampleRows
      );


    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
      { wch: 18 },
      { wch: 18 }
    ];


    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Student Accounts"
    );


    const instructions =
      XLSX.utils.aoa_to_sheet([

        [
          "BookFair Digital — Student Import"
        ],

        [],

        [
          "Username",
          "Required. Must be unique."
        ],

        [
          "Password",
          "Required. Minimum 6 characters."
        ],

        [
          "Assigned Book",
          "Book 01, Book 02 or Book 03."
        ],

        [
          "Full Name",
          "Optional. Student can complete later."
        ],

        [
          "District",
          "Optional. Student can complete later."
        ],

        [
          "Contact Number",
          "Optional. Student can complete later."
        ],

        [],

        [
          "Delete the example rows before importing real students."
        ],

        [
          "Keep this Excel file secure because it contains passwords."
        ]

      ]);


    instructions["!cols"] = [
      { wch: 25 },
      { wch: 80 }
    ];


    XLSX.utils.book_append_sheet(
      workbook,
      instructions,
      "Instructions"
    );


    XLSX.writeFile(
      workbook,
      "BookFair-Student-Template.xlsx"
    );

  }


  $("templateBtn").onclick =
    downloadTemplate;


  /* =========================
     EXCEL IMPORT
  ========================= */

  $("importBtn").onclick =
    () => {

      $("fileInput").click();

    };


  $("fileInput").onchange =
    async () => {

      const file =
        $("fileInput").files[0];


      if (!file) {
        return;
      }


      const button =
        $("importBtn");


      button.disabled =
        true;

      button.textContent =
        "Importing…";


      try {

        const workbook =
          XLSX.read(
            await file.arrayBuffer(),
            {
              type: "array"
            }
          );


        const sheet =
          workbook.Sheets[
            workbook.SheetNames[0]
          ];


        const excelRows =
          XLSX.utils.sheet_to_json(
            sheet,
            {
              defval: ""
            }
          );


        if (
          !excelRows.length
        ) {

          throw new Error(
            "The Excel sheet is empty."
          );

        }


        const columns = {};


        Object.keys(
          excelRows[0]
        ).forEach(
          (key) => {

            columns[
              key
                .trim()
                .toLowerCase()
            ] = key;

          }
        );


        const usernameColumn =
          columns["username"];

        const passwordColumn =
          columns["password"];

        const bookColumn =
          columns["assigned book"];

        const fullNameColumn =
          columns["full name"];

        const districtColumn =
          columns["district"];

        const contactColumn =
          columns["contact number"];


        if (
          !usernameColumn ||
          !passwordColumn ||
          !bookColumn
        ) {

          throw new Error(
            "Excel must contain Username, Password and Assigned Book columns."
          );

        }


        let success = 0;
        let failed = 0;
        let skipped = 0;

        const failedRows = [];

        const total =
          excelRows.length;


        $("importStatus")
          ?.classList
          .add("visible");


        $("importTitle").textContent =
          "Importing students…";


        $("importCount").textContent =
          `0 / ${total}`;


        $("importProgress").style.width =
          "0%";


        for (
          let index = 0;
          index < total;
          index++
        ) {

          const row =
            excelRows[index];


          const username =
            String(
              row[usernameColumn] ?? ""
            ).trim();


          const password =
            String(
              row[passwordColumn] ?? ""
            ).trim();


          const book =
            normalizeBook(
              row[bookColumn]
            );


          const fullName =
            String(
              row[fullNameColumn] ?? ""
            ).trim();


          const district =
            String(
              row[districtColumn] ?? ""
            ).trim();


          const contact =
            String(
              row[contactColumn] ?? ""
            ).trim();


          if (
            !username &&
            !password &&
            !book
          ) {

            skipped++;

          } else {

            try {

              if (
                !validUsername(
                  username
                )
              ) {

                throw new Error(
                  "Invalid username."
                );

              }


              if (
                password.length < 6
              ) {

                throw new Error(
                  "Password must be at least 6 characters."
                );

              }


              if (!book) {

                throw new Error(
                  "Invalid assigned book."
                );

              }


              const ref =
                doc(
                  db,
                  "students",
                  username
                );


              const existing =
                await getDoc(ref);


              if (
                existing.exists()
              ) {

                throw new Error(
                  "Username already exists."
                );

              }


              await setDoc(
                ref,
                {
                  username,

                  password,

                  assignedBook:
                    `Book ${book}`,

                  fullName,

                  district,

                  contact,

                  registered:
                    Boolean(
                      fullName &&
                      district &&
                      contact
                    ),

                  active: true,

                  createdAt:
                    new Date().toISOString()
                }
              );


              success++;

            } catch (error) {

              failed++;


              failedRows.push({

                username:
                  username ||
                  `Row ${index + 2}`,

                reason:
                  error.message ||
                  "Import failed."

              });

            }

          }


          const processed =
            index + 1;


          $("importCount").textContent =
            `${processed} / ${total}`;


          $("importProgress").style.width =
            `${Math.round(
              processed / total * 100
            )}%`;


          $("importSuccess").textContent =
            `${success} successful`;


          $("importFailed").textContent =
            `${failed} failed`;


          $("importSkipped").textContent =
            `${skipped} skipped`;

        }


        $("importTitle").textContent =
          "Import complete";


        await loadStudents();


        $("resultSuccess").textContent =
          success;


        $("resultFailed").textContent =
          failed;


        $("resultSkipped").textContent =
          skipped;


        const failedWrap =
          $("failedWrap");

        const failedList =
          $("failedList");


        if (failedRows.length) {

          failedWrap.style.display =
            "block";


          failedList.innerHTML =
            failedRows
              .map(
                (item) => `
                  <div class="failed-item">

                    <strong>
                      ${esc(
                        item.username
                      )}
                    </strong>

                    <span>
                      ${esc(
                        item.reason
                      )}
                    </span>

                  </div>
                `
              )
              .join("");

        } else {

          failedWrap.style.display =
            "none";

          failedList.innerHTML =
            "";

        }


        $("importResultModal")
          .classList
          .add("show");


        showToast(
          `${success} student account(s) imported successfully.`
        );


      } catch (error) {

        console.error(
          "IMPORT ERROR:",
          error
        );


        showToast(
          error.message ||
          "Excel import failed.",
          true
        );

      } finally {

        $("fileInput").value =
          "";

        button.disabled =
          false;

        button.textContent =
          "Import Excel";

      }

    };


  /* =========================
     FILTERS
  ========================= */

  $("search").oninput =
    render;


  $("bookFilter").onchange =
    render;


  $("registrationFilter").onchange =
    render;


  /* =========================
     MODAL CLOSE
  ========================= */

  $("importResultClose").onclick =
    () => {

      $("importResultModal")
        .classList
        .remove("show");

    };


  $("importResultCloseBtn").onclick =
    () => {

      $("importResultModal")
        .classList
        .remove("show");

    };


  /* =========================
     INITIAL LOAD
  ========================= */

  await loadStudents();

}
