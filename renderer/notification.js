/* =========================
   NOTIFICATION DATA
========================= */

let notificationData = null;


/* =========================
   LOAD NOTIFICATION
========================= */

window.addEventListener(
  "DOMContentLoaded",
  async () => {

    try {

      notificationData =
        await window.api.getNotificationData();

      if (!notificationData) {
        return;
      }

      displayNotification(notificationData);

    } catch (error) {

      console.error(
        "Notification loading error:",
        error
      );

    }

  }
);


/* =========================
   DISPLAY NOTIFICATION
========================= */

function displayNotification(data) {

  const screen =
    document.getElementById(
      "notificationScreen"
    );

  const icon =
    document.getElementById(
      "notificationIcon"
    );

  const level =
    document.getElementById(
      "notificationLevel"
    );

  const title =
    document.getElementById(
      "notificationTitle"
    );

  const productName =
    document.getElementById(
      "productName"
    );

  const invoice =
    document.getElementById(
      "invoice"
    );

  const expiryDate =
    document.getElementById(
      "expiryDate"
    );

  const message =
    document.getElementById(
      "notificationMessage"
    );


  if (data.type === "ABOUT") {

    screen.classList.add("about");

    icon.textContent = "!";

    level.textContent =
      "ABOUT TO EXPIRE";

    title.textContent =
      "Product Expiry Reminder";

    message.textContent =
      "This product is approaching its expiry date. Please review it.";

  }


  else if (data.type === "SOON") {

    screen.classList.add("soon");

    icon.textContent = "!";

    level.textContent =
      "SOON TO EXPIRE";

    title.textContent =
      "Expiry Requires Attention";

    message.textContent =
      "This product will expire soon. Please take the necessary action.";

  }


  else if (data.type === "EXPIRED") {

    screen.classList.add("expired");

    icon.textContent = "×";

    level.textContent =
      "EXPIRED";

    title.textContent =
      "Product Has Expired";

    message.textContent =
      "This product has reached its expiry date and requires attention.";

  }


  productName.textContent =
    data.name || "Unnamed Product";


  invoice.textContent =
    data.invoice || "—";


  expiryDate.textContent =
    formatDate(data.expiry);


  /*
    Make sure the notification window
    receives keyboard focus.
  */

  document
    .getElementById("closeNotification")
    .focus();

}


/* =========================
   CLOSE
========================= */

document
  .getElementById("closeNotification")
  .addEventListener(
    "click",
    async () => {

      await window.api.closeNotification();

    }
  );


/* =========================
   ESCAPE KEY
========================= */

document.addEventListener(
  "keydown",
  async (event) => {

    if (event.key === "Escape") {

      await window.api.closeNotification();

    }

  }
);


/* =========================
   DATE FORMAT
========================= */

function formatDate(date) {

  if (!date) {
    return "—";
  }

  const value =
    new Date(date + "T00:00:00");

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    return date;
  }

  return value.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

}