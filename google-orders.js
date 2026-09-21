/* BookFair Digital - Google Apps Script order override */
const BOOKFAIR_ORDER_API = "https://script.google.com/macros/s/AKfycbyJPyMYQy10tYPWoonku6i319WIT7dIukMaXjJXeIgYIRWEKXkeVUzfHebxkLx_ygYdUA/exec";

(function () {
  function money(value) {
    return "Rs. " + Number(value || 0).toLocaleString("en-LK");
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        const comma = text.indexOf(",");
        resolve(comma >= 0 ? text.slice(comma + 1) : text);
      };
      reader.onerror = () => reject(new Error("Could not read the bank slip."));
      reader.readAsDataURL(file);
    });
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  async function submitToGoogle(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const button = document.getElementById("submitOrderBtn");
    const name = document.getElementById("customerName")?.value.trim() || "";
    const mobile = document.getElementById("customerMobile")?.value.trim() || "";
    const district = document.getElementById("customerDistrict")?.value || "";
    const quantity = Math.max(1, Math.min(20, parseInt(document.getElementById("quantity")?.value, 10) || 1));
    const postcode = document.getElementById("postcode")?.value.trim() || "";
    const address = document.getElementById("deliveryAddress")?.value.trim() || "";
    const slip = document.getElementById("bankSlip")?.files?.[0] || null;
    const bookCode = document.getElementById("selectedBookCode")?.textContent.trim() || "";
    const bookName = document.getElementById("selectedBookName")?.textContent.trim() || "";
    const priceText = document.getElementById("summaryPrice")?.textContent || "0";
    const price = Number(String(priceText).replace(/[^0-9.]/g, "")) || 0;

    if (!name || !mobile || !district || !postcode || !address) {
      alert("Please complete all required customer details.");
      return false;
    }
    if (!/^\d{5}$/.test(postcode)) {
      alert("Please enter a valid 5-digit postcode.");
      return false;
    }
    if (!slip) {
      alert("Please upload your bank deposit slip before placing the order.");
      return false;
    }
    if (slip.size > 5 * 1024 * 1024) {
      alert("Bank slip file must be smaller than 5MB.");
      return false;
    }

    try {
      if (button) { button.disabled = true; button.textContent = "Preparing slip…"; }
      const base64 = await fileToBase64(slip);
      if (button) button.textContent = "Saving order…";

      const response = await fetch(BOOKFAIR_ORDER_API, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "createOrder",
          bookCode,
          book: bookName,
          price,
          quantity,
          customer: { fullName: name, mobile, district, postcode, address },
          slip: { fileName: slip.name, mimeType: slip.type || "application/octet-stream", base64 }
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Could not save the order.");

      const order = {
        orderNumber: data.orderNo,
        bookCode,
        book: bookName,
        price,
        quantity,
        total: Number(data.total || price * quantity),
        customer: { fullName: name, mobile, district, postcode, address },
        payment: "Bank Deposit",
        delivery: "FREE",
        status: data.status || "Payment Checking",
        slipFileName: slip.name,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem("bf_last_order", JSON.stringify(order));
      setText("successOrderNumber", order.orderNumber);
      setText("successBook", order.book);
      setText("successQty", order.quantity);
      setText("successTotal", money(order.total));
      setText("successSlip", order.slipFileName);

      const preview = document.getElementById("successSlipPreview");
      const image = document.getElementById("successSlipImage");
      if (preview && image && slip.type.startsWith("image/")) {
        image.src = URL.createObjectURL(slip);
        preview.style.display = "block";
      } else if (preview) {
        preview.style.display = "none";
      }

      const whatsapp = document.getElementById("whatsappOrderBtn");
      if (whatsapp) {
        whatsapp.onclick = () => {
          const message = `Hello BookFair Digital,\n\nI would like to confirm my book order.\n\nOrder No: ${order.orderNumber}\nBook: ${order.book}\nQuantity: ${order.quantity}\nTotal: ${money(order.total)}\n\nCustomer Details\nName: ${name}\nMobile: ${mobile}\nDistrict: ${district}\nPostcode: ${postcode}\nDelivery Address: ${address}\n\nPayment: Bank Deposit\nDelivery: FREE\nBank Slip: ${slip.name}\nStatus: Payment Checking\n\nI have uploaded my bank deposit slip on the website. I will attach the same slip to this WhatsApp chat for verification.\n\nThank you,\nBookFair Digital`;
          window.open("https://wa.me/94715680746?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
        };
      }

      document.getElementById("orderModal")?.classList.remove("show");
      document.getElementById("successModal")?.classList.add("show");
      document.body.style.overflow = "hidden";
    } catch (error) {
      console.error("GOOGLE ORDER ERROR:", error);
      alert(error.message || "Could not place the order. Please try again.");
    } finally {
      if (button) { button.disabled = false; button.textContent = "Place Order & Continue →"; }
    }
    return false;
  }

  document.addEventListener("submit", function (event) {
    if (event.target?.id === "orderForm") submitToGoogle(event);
  }, true);
})();
