let currentUser = null;


/* ============================================================
   APPLICATION START
============================================================ */

window.onload = () => {

  showLogin();

  updateCurrentDate();

  injectSettingsStyles();

};


/* ============================================================
   LOGIN
============================================================ */

function showLogin() {

  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("resetScreen").style.display = "none";
  document.getElementById("app").style.display = "none";

  const password =
    document.getElementById("loginPassword");

  if (password) {
    password.value = "";
    password.focus();
  }

}


async function login() {

  const passwordInput =
    document.getElementById("loginPassword");

  const error =
    document.getElementById("loginError");

  const password =
    passwordInput.value.trim();

  error.textContent = "";

  if (!password) {

    error.textContent =
      "Please enter your password.";

    return;

  }

  try {

    const result =
      await window.api.login(password);

    if (!result || !result.success) {

      error.textContent =
        result?.message ||
        "Incorrect password.";

      passwordInput.value = "";

      passwordInput.focus();

      return;

    }

    currentUser = result.user;

    showApplication();

  }

  catch (errorObject) {

    console.error(
      "Login error:",
      errorObject
    );

    error.textContent =
      "Unable to log in. Please try again.";

  }

}


function showApplication() {

  document.getElementById("loginScreen").style.display = "none";

  document.getElementById("resetScreen").style.display = "none";

  document.getElementById("app").style.display = "flex";


  updateUserInterface();

  loadWelcome();

}


function updateUserInterface() {

  const name =
    currentUser?.name || "User";

  const avatar =
    name.charAt(0).toUpperCase();


  const sidebarUserName =
    document.getElementById("sidebarUserName");

  const userAvatar =
    document.getElementById("userAvatar");

  const sidebarAppName =
    document.getElementById("sidebarAppName");


  if (sidebarUserName) {

    sidebarUserName.textContent =
      name;

  }


  if (userAvatar) {

    userAvatar.textContent =
      avatar || "U";

  }


  if (sidebarAppName) {

    sidebarAppName.textContent =
      currentUser?.app_name ||
      "Trevos Watch";

  }

}


/* ============================================================
   LOGOUT
============================================================ */

function logout() {

  currentUser = null;

  const password =
    document.getElementById("loginPassword");

  if (password) {
    password.value = "";
  }

  showLogin();

}


/* ============================================================
   GREETING
============================================================ */

function greeting() {

  const hour =
    new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";

}


/* ============================================================
   DATE
============================================================ */

function updateCurrentDate() {

  const element =
    document.getElementById("currentDate");

  if (!element) {
    return;
  }

  const now =
    new Date();

  element.textContent =
    now.toLocaleDateString(
      undefined,
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );

}


/* ============================================================
   NAVIGATION
============================================================ */

function setActiveNav(id) {

  document
    .querySelectorAll(".nav-item")
    .forEach(item => {

      item.classList.remove("active");

    });


  const selected =
    document.getElementById(id);

  if (selected) {

    selected.classList.add("active");

  }

}


/* ============================================================
   WELCOME
============================================================ */

async function loadWelcome() {

  setActiveNav("navWelcome");

  document.getElementById("pageTitle")
    .textContent = "Welcome";


  const products =
    await window.api.getProducts();


  const total =
    products.length;


  const inbound =
    products.filter(
      p =>
        (p.type || "INBOUND")
          .toUpperCase() === "INBOUND"
    ).length;


  const outbound =
    products.filter(
      p =>
        (p.type || "")
          .toUpperCase() === "OUTBOUND"
    ).length;


  const expired =
    products.filter(
      p =>
        getStatus(p.expiry).text === "Expired"
    ).length;


  const soon =
    products.filter(
      p =>
        getStatus(p.expiry).text === "Soon to expire"
    ).length;


  const about =
    products.filter(
      p =>
        getStatus(p.expiry).text === "About to expire"
    ).length;


  const userName =
    currentUser?.name || "User";


  document.getElementById("content").innerHTML = `

    <div class="welcome-header">

      <div>

        <p class="eyebrow">
          OVERVIEW
        </p>

        <h2>
          ${greeting()},
          ${escapeHtml(userName)}
        </h2>

        <p>
          Keep track of your inbound and outbound products
          and never miss an expiry date.
        </p>

      </div>


      <div class="welcome-actions">

        <button
          class="primary-button"
          onclick="showAddForm('INBOUND')"
        >
          + Add Inbound
        </button>

        <button
          class="secondary-button"
          onclick="showAddForm('OUTBOUND')"
        >
          + Add Outbound
        </button>

      </div>

    </div>


    <div class="stats-grid">

      <div class="stat-card">

        <div class="stat-icon blue">
          ▦
        </div>

        <div>

          <span>Total Products</span>

          <strong>
            ${total}
          </strong>

        </div>

      </div>


      <div class="stat-card">

        <div class="stat-icon green">
          ↓
        </div>

        <div>

          <span>Inbound</span>

          <strong>
            ${inbound}
          </strong>

        </div>

      </div>


      <div class="stat-card">

        <div class="stat-icon purple">
          ↑
        </div>

        <div>

          <span>Outbound</span>

          <strong>
            ${outbound}
          </strong>

        </div>

      </div>


      <div class="stat-card">

        <div class="stat-icon red">
          !
        </div>

        <div>

          <span>Expired</span>

          <strong>
            ${expired}
          </strong>

        </div>

      </div>

    </div>


    <div class="dashboard-grid">

      <div class="card">

        <div class="card-header">

          <div>

            <h3>
              Expiry Overview
            </h3>

            <p>
              Products requiring attention.
            </p>

          </div>

        </div>


        <div class="expiry-summary">

          <div class="summary-item yellow">

            <span>
              About to expire
            </span>

            <strong>
              ${about}
            </strong>

          </div>


          <div class="summary-item orange">

            <span>
              Soon to expire
            </span>

            <strong>
              ${soon}
            </strong>

          </div>


          <div class="summary-item red">

            <span>
              Expired
            </span>

            <strong>
              ${expired}
            </strong>

          </div>

        </div>

      </div>


      <div class="card">

        <div class="card-header">

          <div>

            <h3>
              Quick Actions
            </h3>

            <p>
              Manage your records.
            </p>

          </div>

        </div>


        <div class="quick-actions">

          <button onclick="loadInbound()">
            View Inbound
          </button>

          <button onclick="loadOutbound()">
            View Outbound
          </button>

          <button onclick="showAddForm('INBOUND')">
            Add Product
          </button>

        </div>

      </div>

    </div>

  `;

}


/* ============================================================
   INBOUND
============================================================ */

async function loadInbound() {

  setActiveNav("navInbound");

  document.getElementById("pageTitle")
    .textContent = "Inbound";


  const products =
    await window.api.getProducts();


  const inboundProducts =
    products.filter(
      p =>
        (p.type || "INBOUND")
          .toUpperCase() === "INBOUND"
    );


  renderProductList(
    inboundProducts,
    "Inbound",
    "Products and items coming into the business.",
    "INBOUND"
  );

}


/* ============================================================
   OUTBOUND
============================================================ */

async function loadOutbound() {

  setActiveNav("navOutbound");

  document.getElementById("pageTitle")
    .textContent = "Outbound";


  const products =
    await window.api.getProducts();


  const outboundProducts =
    products.filter(
      p =>
        (p.type || "")
          .toUpperCase() === "OUTBOUND"
    );


  renderProductList(
    outboundProducts,
    "Outbound",
    "Products and items going out of the business.",
    "OUTBOUND"
  );

}


/* ============================================================
   PRODUCT LIST
============================================================ */

function renderProductList(
  products,
  title,
  description,
  type
) {

  let cards = "";


  if (products.length === 0) {

    cards = `

      <div class="empty-state">

        <div class="empty-icon">
          ${type === "INBOUND" ? "↓" : "↑"}
        </div>

        <h3>
          No ${title.toLowerCase()} records yet
        </h3>

        <p>
          Add your first ${title.toLowerCase()} product
          to start tracking it.
        </p>

        <button
          class="primary-button"
          onclick="showAddForm('${type}')"
        >
          + Add ${title}
        </button>

      </div>

    `;

  }

  else {

    cards =
      products
        .map(product => {

          const status = getStatus(product);


          return `

            <div class="product-card">

              <div class="product-card-top">

                <div>

                  <div class="product-type">
                    ${
                      type === "INBOUND"
                        ? "↓ INBOUND"
                        : "↑ OUTBOUND"
                    }
                  </div>

                  <h3>
                    ${escapeHtml(
                      product.name ||
                      "Unnamed Product"
                    )}
                  </h3>

                </div>


                <span class="${status.class}">
                  ${status.text}
                </span>

              </div>


              <div class="product-details">

                <div>

                  <span>
                    Invoice
                  </span>

                  <strong>
                    ${escapeHtml(
                      product.invoice ||
                      "—"
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Purchase Date
                  </span>

                  <strong>
                    ${formatDate(
                      product.purchase_date
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Expiry Date
                  </span>

                  <strong>
                    ${formatDate(
                      product.expiry
                    )}
                  </strong>

                </div>

              </div>


              <div class="product-description">

                <span>
                  Description
                </span>

                <p>
                  ${escapeHtml(
                    product.description ||
                    "No description provided."
                  )}
                </p>

              </div>


              <div class="product-actions">

                <button
                  class="secondary-button small"
                  onclick="editProduct(${product.id})"
                >
                  Edit
                </button>


                <button
                  class="danger-button small"
                  onclick="deleteProduct(${product.id})"
                >
                  Delete
                </button>

              </div>

            </div>

          `;

        })
        .join("");

  }


  document.getElementById("content").innerHTML = `

    <div class="section-header">

      <div>

        <p class="eyebrow">
          ${type}
        </p>

        <h2>
          ${title} Products
        </h2>

        <p>
          ${description}
        </p>

      </div>


      <button
        class="primary-button"
        onclick="showAddForm('${type}')"
      >
        + Add ${title}
      </button>

    </div>


        <div class="product-tools">

      <input
        type="text"
        id="productSearch"
        class="product-search"
        placeholder="Search by product name or invoice..."
      />

      <select
        id="statusFilter"
        class="product-filter"
      >
        <option value="ALL">
          All Statuses
        </option>

        <option value="Safe">
          Safe
        </option>

        <option value="About to expire">
          About to Expire
        </option>

        <option value="Soon to expire">
          Soon to Expire
        </option>

        <option value="Expired">
          Expired
        </option>

      </select>

      <select
        id="productSort"
        class="product-filter"
      >
        <option value="name">
          Sort: Product Name
        </option>

        <option value="purchase">
          Sort: Purchase Date
        </option>

        <option value="expiry">
          Sort: Expiry Date
        </option>

        <option value="status">
          Sort: Status
        </option>

      </select>

      <div
  id="productResultCount"
  class="product-result-count"
>
  Showing ${products.length} of ${products.length} products
</div>

    </div>


    <div
      class="product-list"
      id="productList"
    >
      ${cards}
    </div>

  `;

    initializeProductTools(
    products,
    type
  );

}


/* ============================================================
   ADD PRODUCT FORM
============================================================ */

function showAddForm(
  type = "INBOUND"
) {

  const title =
    type === "OUTBOUND"
      ? "Add Outbound Product"
      : "Add Inbound Product";


  setActiveNav(
    type === "OUTBOUND"
      ? "navOutbound"
      : "navInbound"
  );


  document.getElementById("pageTitle")
    .textContent = title;


  document.getElementById("content").innerHTML = `

    <div class="section-header">

      <div>

        <p class="eyebrow">
          ${type}
        </p>

        <h2>
          ${title}
        </h2>

        <p>
          Enter the details below to create a new record.
        </p>

      </div>

    </div>


    <div class="form-card">

      <div class="form-grid">

        <div class="form-field">

          <label>
            Product Name *
          </label>

          <input
            id="productName"
            type="text"
            placeholder="Enter product name"
          >

        </div>


        <div class="form-field">

          <label>
            Invoice
          </label>

          <input
            id="productInvoice"
            type="text"
            placeholder="Enter invoice number"
          >

        </div>


        <div class="form-field full">

          <label>
            Product Description
          </label>

          <textarea
            id="productDescription"
            placeholder="Enter product description"
          ></textarea>

        </div>


        <div class="form-field">

          <label>
            Purchase Date
          </label>

          <input
            id="purchaseDate"
            type="date"
          >

        </div>


        <div class="form-field">

          <label>
            Expiry Date *
          </label>

          <input
            id="expiryDate"
            type="date"
          >

        </div>

      </div>


      ${notificationFields("")}


      <div class="form-actions">

        <button
          class="secondary-button"
          onclick="cancelProductForm('${type}')"
        >
          Cancel
        </button>


        <button
          class="primary-button"
          onclick="saveProduct('${type}')"
        >
          Save Product
        </button>

      </div>

    </div>

  `;

}


/* ============================================================
   NOTIFICATION FIELDS
============================================================ */

function notificationFields(
  product
) {

  return `

    <div class="notification-settings">

      <div class="form-section-title">
        Notification Dates
      </div>

      <p>
        Choose when Trevos Watch should notify you about this product.
      </p>


      <div class="form-grid">

        <div class="form-field">

          <label class="notification-label yellow-label">
            About to Expire
          </label>

          <input
            id="notificationAbout"
            type="date"
            value="${
              escapeAttribute(
                product?.notification_about || ""
              )
            }"
          >

        </div>


        <div class="form-field">

          <label class="notification-label orange-label">
            Soon to Expire
          </label>

          <input
            id="notificationSoon"
            type="date"
            value="${
              escapeAttribute(
                product?.notification_soon || ""
              )
            }"
          >

        </div>


        <div class="form-field">

          <label class="notification-label red-label">
            Expired
          </label>

          <input
            id="notificationExpired"
            type="date"
            value="${
              escapeAttribute(
                product?.notification_expired || ""
              )
            }"
          >

        </div>

      </div>

    </div>

  `;

}


/* ============================================================
   SAVE PRODUCT
============================================================ */

async function saveProduct(
  type
) {

  const name =
    document
      .getElementById("productName")
      .value
      .trim();


  const expiry =
    document
      .getElementById("expiryDate")
      .value;


  if (!name) {

    alert(
      "Please enter the product name."
    );

    return;

  }


  if (!expiry) {

    alert(
      "Please select an expiry date."
    );

    return;

  }


  const product = {

    type,

    name,

    invoice:
      document
        .getElementById("productInvoice")
        .value
        .trim(),

    description:
      document
        .getElementById("productDescription")
        .value
        .trim(),

    purchase_date:
      document
        .getElementById("purchaseDate")
        .value,

    expiry,

    notification_about:
      document
        .getElementById("notificationAbout")
        .value,

    notification_soon:
      document
        .getElementById("notificationSoon")
        .value,

    notification_expired:
      document
        .getElementById("notificationExpired")
        .value

  };


  const result =
    await window.api.addProduct(
      product
    );


  if (!result?.success) {

    alert(
      result?.message ||
      "Unable to save the product."
    );

    return;

  }


  if (type === "OUTBOUND") {

    loadOutbound();

  }

  else {

    loadInbound();

  }

}


/* ============================================================
   EDIT PRODUCT
============================================================ */

async function editProduct(
  id
) {

  const products =
    await window.api.getProducts();


  const product =
    products.find(
      p =>
        Number(p.id) ===
        Number(id)
    );


  if (!product) {

    alert(
      "Product could not be found."
    );

    return;

  }


  const type =
    (
      product.type ||
      "INBOUND"
    ).toUpperCase();


  setActiveNav(
    type === "OUTBOUND"
      ? "navOutbound"
      : "navInbound"
  );


  document.getElementById("pageTitle")
    .textContent = "Edit Product";


  document.getElementById("content").innerHTML = `

    <div class="section-header">

      <div>

        <p class="eyebrow">
          ${type}
        </p>

        <h2>
          Edit Product
        </h2>

        <p>
          Update the product information below.
        </p>

      </div>

    </div>


    <div class="form-card">

      <div class="form-grid">

        <div class="form-field">

          <label>
            Product Name *
          </label>

          <input
            id="productName"
            value="${escapeAttribute(
              product.name || ""
            )}"
          >

        </div>


        <div class="form-field">

          <label>
            Invoice
          </label>

          <input
            id="productInvoice"
            value="${escapeAttribute(
              product.invoice || ""
            )}"
          >

        </div>


        <div class="form-field full">

          <label>
            Product Description
          </label>

          <textarea
            id="productDescription"
          >${escapeHtml(
            product.description || ""
          )}</textarea>

        </div>


        <div class="form-field">

          <label>
            Purchase Date
          </label>

          <input
            id="purchaseDate"
            type="date"
            value="${escapeAttribute(
              product.purchase_date || ""
            )}"
          >

        </div>


        <div class="form-field">

          <label>
            Expiry Date *
          </label>

          <input
            id="expiryDate"
            type="date"
            value="${escapeAttribute(
              product.expiry || ""
            )}"
          >

        </div>

      </div>


      ${notificationFields(product)}


      <div class="form-actions">

        <button
          class="secondary-button"
          onclick="${
            type === "OUTBOUND"
              ? "loadOutbound()"
              : "loadInbound()"
          }"
        >
          Cancel
        </button>


        <button
          class="primary-button"
          onclick="updateProduct(${product.id}, '${type}')"
        >
          Update Product
        </button>

      </div>

    </div>

  `;

}


/* ============================================================
   UPDATE PRODUCT
============================================================ */

async function updateProduct(
  id,
  type
) {

  const name =
    document
      .getElementById("productName")
      .value
      .trim();


  const expiry =
    document
      .getElementById("expiryDate")
      .value;


  if (!name) {

    alert(
      "Please enter the product name."
    );

    return;

  }


  if (!expiry) {

    alert(
      "Please select an expiry date."
    );

    return;

  }


  const product = {

    id,

    type,

    name,

    invoice:
      document
        .getElementById("productInvoice")
        .value
        .trim(),

    description:
      document
        .getElementById("productDescription")
        .value
        .trim(),

    purchase_date:
      document
        .getElementById("purchaseDate")
        .value,

    expiry,

    notification_about:
      document
        .getElementById("notificationAbout")
        .value,

    notification_soon:
      document
        .getElementById("notificationSoon")
        .value,

    notification_expired:
      document
        .getElementById("notificationExpired")
        .value

  };


  const result =
    await window.api.updateProduct(
      product
    );


  if (!result?.success) {

    alert(
      result?.message ||
      "Unable to update the product."
    );

    return;

  }


  if (type === "OUTBOUND") {

    loadOutbound();

  }

  else {

    loadInbound();

  }

}


/* ============================================================
   CANCEL PRODUCT FORM
============================================================ */

function cancelProductForm(
  type
) {

  if (type === "OUTBOUND") {

    loadOutbound();

  }

  else {

    loadInbound();

  }

}


/* ============================================================
   DELETE PRODUCT
============================================================ */

async function deleteProduct(
  id
) {

  const confirmed =
    confirm(
      "Are you sure you want to delete this product?"
    );


  if (!confirmed) {
    return;
  }


  const products =
    await window.api.getProducts();


  const product =
    products.find(
      p =>
        Number(p.id) ===
        Number(id)
    );


  if (!product) {

    alert(
      "Product could not be found."
    );

    return;

  }


  const productType =
    (
      product.type ||
      "INBOUND"
    ).toUpperCase();


  const result =
    await window.api.deleteProduct(
      id
    );


  if (!result?.success) {

    alert(
      result?.message ||
      "Unable to delete the product."
    );

    return;

  }


  if (productType === "OUTBOUND") {

    loadOutbound();

  }

  else {

    loadInbound();

  }

}


/* ============================================================
   PRODUCT STATUS
============================================================ */


function getStatus(product) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const aboutDate = product.notification_about
    ? new Date(product.notification_about + "T00:00:00")
    : null;

  const soonDate = product.notification_soon
    ? new Date(product.notification_soon + "T00:00:00")
    : null;

  const expiredDate = product.notification_expired
    ? new Date(product.notification_expired + "T00:00:00")
    : null;

  // Expired
  if (expiredDate && today >= expiredDate) {
    return {
      text: "Expired",
      class: "status-red"
    };
  }

  // Soon to expire
  if (soonDate && today >= soonDate) {
    return {
      text: "Soon to expire",
      class: "status-orange"
    };
  }

  // About to expire
  if (aboutDate && today >= aboutDate) {
    return {
      text: "About to expire",
      class: "status-yellow"
    };
  }

  // Safe
  return {
    text: "Safe",
    class: "status-green"
  };
}

/* ============================================================
   SETTINGS ENTRY POINT
============================================================ */

async function loadSettings() {

  setActiveNav(
    "navSettings"
  );


  document.getElementById("pageTitle")
    .textContent = "Settings";


  showSettingsUnlockModal();

}


/* ============================================================
   SETTINGS PASSWORD MODAL
============================================================ */

function showSettingsUnlockModal() {

  removeSettingsModal();


  const overlay =
    document.createElement("div");


  overlay.id =
    "settingsModal";


  overlay.className =
    "tw-modal-overlay";


  overlay.innerHTML = `

    <div class="tw-modal-card">

      <div class="tw-modal-icon">
        🔐
      </div>

      <h2>
        Unlock Requested
      </h2>

      <p>
        Enter your Trevos Watch password to access Settings.
      </p>


      <label>
        Enter Password
      </label>

      <input
        id="settingsPassword"
        type="password"
        placeholder="Enter your password"
        autocomplete="current-password"
      >


      <p
        id="settingsUnlockError"
        class="tw-error"
      ></p>


      <div class="tw-modal-actions">

        <button
          class="secondary-button"
          onclick="closeSettingsModal()"
        >
          Cancel
        </button>

        <button
          class="primary-button"
          onclick="unlockSettings()"
        >
          Unlock
        </button>

      </div>


      <button
        class="link-button tw-forgot"
        onclick="startSettingsRecovery()"
      >
        Forgot Password?
      </button>

    </div>

  `;


  document.body.appendChild(
    overlay
  );


  setTimeout(
    () => {

      const input =
        document.getElementById(
          "settingsPassword"
        );

      if (input) {
        input.focus();
      }

    },
    50
  );

}


async function unlockSettings() {

  const input =
    document.getElementById(
      "settingsPassword"
    );


  const error =
    document.getElementById(
      "settingsUnlockError"
    );


  const password =
    input.value.trim();


  error.textContent = "";


  if (!password) {

    error.textContent =
      "Please enter your password.";

    return;

  }


  const result =
    await window.api.verifyPassword(
      password
    );


  if (!result?.success) {

    error.textContent =
      result?.message ||
      "Incorrect password.";

    input.value = "";

    input.focus();

    return;

  }


  removeSettingsModal();

  renderSettings();

}


function closeSettingsModal() {

  removeSettingsModal();

}


function removeSettingsModal() {

  const existing =
    document.getElementById(
      "settingsModal"
    );


  if (existing) {

    existing.remove();

  }

}


/* ============================================================
   SETTINGS DASHBOARD
============================================================ */

async function renderSettings() {

  const result =
    await window.api.getUserSettings();


  if (!result?.success) {

    alert(
      result?.message ||
      "Unable to load Settings."
    );

    return;

  }


  currentUser = {

    ...currentUser,

    ...result.user

  };


  updateUserInterface();


  document.getElementById("content").innerHTML = `

    <div class="section-header">

      <div>

        <p class="eyebrow">
          CONFIGURATION
        </p>

        <h2>
          Settings
        </h2>

        <p>
          Manage your profile, security, recovery and branding.
        </p>

      </div>

    </div>


    <div class="tw-settings-grid">


      <!-- USER PROFILE -->

      <div class="tw-settings-card">

        <div class="tw-settings-heading">

          <div class="tw-settings-icon">
            👤
          </div>

          <div>

            <h3>
              User Profile
            </h3>

            <p>
              Update the name displayed throughout Trevos Watch.
            </p>

          </div>

        </div>


        <div class="tw-setting-field">

          <label>
            Personal Name
          </label>

          <input
            id="settingsName"
            value="${escapeAttribute(
              currentUser.name || ""
            )}"
            placeholder="Enter your name"
          >

        </div>


        <div class="tw-setting-actions">

          <button
            class="primary-button"
            onclick="saveUserName()"
          >
            Update Name
          </button>

        </div>

      </div>


      <!-- SECURITY -->

      <div class="tw-settings-card">

        <div class="tw-settings-heading">

          <div class="tw-settings-icon">
            🔑
          </div>

          <div>

            <h3>
              Security Credentials
            </h3>

            <p>
              Change the password used to unlock Trevos Watch.
            </p>

          </div>

        </div>


        <div class="tw-setting-field">

          <label>
            Current Password *
          </label>

          <input
            id="currentPassword"
            type="password"
            placeholder="Enter current password"
          >

        </div>


        <div class="tw-setting-field">

          <label>
            New Password
          </label>

          <input
            id="newPassword"
            type="password"
            placeholder="Enter new password"
          >

        </div>


        <div class="tw-setting-field">

          <label>
            Confirm New Password
          </label>

          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm new password"
          >

        </div>


        <div class="tw-setting-actions">

          <button
            class="primary-button"
            onclick="changeUserPassword()"
          >
            Change Password
          </button>

        </div>

      </div>


      <!-- PASSWORD RECOVERY -->

      <div class="tw-settings-card">

        <div class="tw-settings-heading">

          <div class="tw-settings-icon">
            🔓
          </div>

          <div>

            <h3>
              Password Recovery
            </h3>

            <p>
              Update the question and answer used for password recovery.
            </p>

          </div>

        </div>


        <div class="tw-setting-field">

          <label>
            Security Question
          </label>

          <input
            id="settingsSecurityQuestion"
            value="${escapeAttribute(
              currentUser.security_question || ""
            )}"
            placeholder="Enter your security question"
          >

        </div>


        <div class="tw-setting-field">

          <label>
            Security Answer
          </label>

          <input
            id="settingsSecurityAnswer"
            type="password"
            placeholder="Enter your security answer"
          >

        </div>


        <div class="tw-setting-actions">

          <button
            class="primary-button"
            onclick="saveRecoveryInfo()"
          >
            Update Recovery Info
          </button>

        </div>

      </div>


      <!-- BRANDING -->

      <div class="tw-settings-card">

        <div class="tw-settings-heading">

          <div class="tw-settings-icon">
            🎨
          </div>

          <div>

            <h3>
              Branding
            </h3>

            <p>
              Customize the Workspace Name and company information.
            </p>

          </div>

        </div>


        <div class="tw-setting-field">

          <label>
            Workspace Name
          </label>

          <input
            id="settingsAppName"
            value="${escapeAttribute(
              currentUser.app_name ||
              "Trevos Watch"
            )}"
            placeholder="Trevos Watch"
          >

        </div>


        <div class="tw-setting-field">

          <label>
            Company Name
          </label>

          <input
            id="settingsCompanyName"
            value="${escapeAttribute(
              currentUser.company_name ||
              ""
            )}"
            placeholder="Enter company name"
          >

        </div>


        <div class="tw-setting-field">

          <label>
            Company Logo
          </label>

          <input
            id="settingsLogo"
            type="file"
            accept="image/*"
            onchange="previewCompanyLogo(event)"
          >

        </div>


        <div
          id="logoPreview"
          class="tw-logo-preview"
        >
          ${
            currentUser.company_logo
              ? `
                <img
                  src="${escapeAttribute(
                    currentUser.company_logo
                  )}"
                  alt="Company Logo"
                >
              `
              : `
                <span>
                  No logo selected
                </span>
              `
          }
        </div>


        <div class="tw-setting-actions">

          <button
            class="primary-button"
            onclick="saveBranding()"
          >
            Save Branding
          </button>

        </div>

      </div>


    </div>

  `;

}


/* ============================================================
   UPDATE USER NAME
============================================================ */

async function saveUserName() {

  const input =
    document.getElementById(
      "settingsName"
    );


  const name =
    input.value.trim();


  if (!name) {

    alert(
      "Please enter your name."
    );

    return;

  }


  const result =
    await window.api.updateUserName({

      userId:
        currentUser.id,

      name

    });


  if (!result?.success) {

    alert(
      result?.message ||
      "Unable to update your name."
    );

    return;

  }


  currentUser.name =
    name;


  updateUserInterface();


  alert(
    "Your name has been updated successfully."
  );


  renderSettings();

}


/* ============================================================
   CHANGE PASSWORD
============================================================ */

async function changeUserPassword() {

  const currentPassword =
    document
      .getElementById("currentPassword")
      .value;


  const newPassword =
    document
      .getElementById("newPassword")
      .value;


  const confirmPassword =
    document
      .getElementById("confirmPassword")
      .value;


  if (!currentPassword) {

    alert(
      "Please enter your current password."
    );

    return;

  }


  if (!newPassword) {

    alert(
      "Please enter a new password."
    );

    return;

  }


  if (newPassword.length < 6) {

    alert(
      "The new password must contain at least 6 characters."
    );

    return;

  }


  if (
    newPassword !==
    confirmPassword
  ) {

    alert(
      "The new passwords do not match."
    );

    return;

  }


  const result =
    await window.api.changePassword({

      userId:
        currentUser.id,

      currentPassword,

      newPassword

    });


  if (!result?.success) {

    alert(
      result?.message ||
      "Unable to change password."
    );

    return;

  }


  document.getElementById(
    "currentPassword"
  ).value = "";


  document.getElementById(
    "newPassword"
  ).value = "";


  document.getElementById(
    "confirmPassword"
  ).value = "";


  alert(
    "Password changed successfully."
  );

}


/* ============================================================
   UPDATE RECOVERY INFORMATION
============================================================ */

async function saveRecoveryInfo() {

  const question =
    document
      .getElementById(
        "settingsSecurityQuestion"
      )
      .value
      .trim();


  const answer =
    document
      .getElementById(
        "settingsSecurityAnswer"
      )
      .value
      .trim();


  if (!question) {

    alert(
      "Please enter a security question."
    );

    return;

  }


  if (!answer) {

    alert(
      "Please enter a security answer."
    );

    return;

  }


  const result =
    await window.api.updateRecoveryInfo({

      userId:
        currentUser.id,

      securityQuestion:
        question,

      securityAnswer:
        answer

    });


  if (!result?.success) {

    alert(
      result?.message ||
      "Unable to update recovery information."
    );

    return;

  }


  currentUser.security_question =
    question;


  document.getElementById(
    "settingsSecurityAnswer"
  ).value = "";


  alert(
    "Password recovery information updated successfully."
  );

}


/* ============================================================
   BRANDING
============================================================ */

let pendingCompanyLogo = "";


function previewCompanyLogo(
  event
) {

  const file =
    event.target.files?.[0];


  if (!file) {
    return;
  }


  const reader =
    new FileReader();


  reader.onload =
    () => {

      pendingCompanyLogo =
        reader.result;


      const preview =
        document.getElementById(
          "logoPreview"
        );


      if (preview) {

        preview.innerHTML = `

          <img
            src="${escapeAttribute(
              pendingCompanyLogo
            )}"
            alt="Company Logo"
          >

        `;

      }

    };


  reader.readAsDataURL(
    file
  );

}


async function saveBranding() {

  const appName =
    document
      .getElementById(
        "settingsAppName"
      )
      .value
      .trim();


  const companyName =
    document
      .getElementById(
        "settingsCompanyName"
      )
      .value
      .trim();


  const companyLogo =
    pendingCompanyLogo ||
    currentUser.company_logo ||
    "";


  const result =
    await window.api.updateBranding({

      userId:
        currentUser.id,

      appName:
        appName ||
        "Trevos Watch",

      companyName,

      companyLogo

    });


  if (!result?.success) {

    alert(
      result?.message ||
      "Unable to save branding."
    );

    return;

  }


  currentUser.app_name =
    appName ||
    "Trevos Watch";


  currentUser.company_name =
    companyName;


  currentUser.company_logo =
    companyLogo;


  pendingCompanyLogo = "";


  updateUserInterface();


  alert(
    "Branding updated successfully."
  );


  renderSettings();

}


/* ============================================================
   SETTINGS RECOVERY
============================================================ */

async function startSettingsRecovery() {

  removeSettingsModal();


  const result =
    await window.api.getSecurityQuestion();


  if (!result?.success) {

    alert(
      result?.message ||
      "Unable to retrieve the security question."
    );

    showSettingsUnlockModal();

    return;

  }


  const overlay =
    document.createElement("div");


  overlay.id =
    "settingsRecoveryModal";


  overlay.className =
    "tw-modal-overlay";


  overlay.innerHTML = `

    <div class="tw-modal-card">

      <div class="tw-modal-icon">
        🔓
      </div>

      <h2>
        Password Recovery
      </h2>

      <p>
        Answer your security question to verify your identity.
      </p>


      <div class="tw-question-box">

        ${escapeHtml(
          result.securityQuestion ||
          "Security question not set."
        )}

      </div>


      <label>
        Security Answer
      </label>

      <input
        id="settingsRecoveryAnswer"
        type="text"
        placeholder="Enter your answer"
      >


      <p
        id="settingsRecoveryError"
        class="tw-error"
      ></p>


      <div class="tw-modal-actions">

        <button
          class="secondary-button"
          onclick="backToSettingsUnlock()"
        >
          Back
        </button>

        <button
          class="primary-button"
          onclick="verifySettingsRecovery()"
        >
          Verify Answer
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    overlay
  );


  setTimeout(
    () => {

      const input =
        document.getElementById(
          "settingsRecoveryAnswer"
        );

      if (input) {
        input.focus();
      }

    },
    50
  );

}


async function verifySettingsRecovery() {

  const answer =
    document
      .getElementById(
        "settingsRecoveryAnswer"
      )
      .value
      .trim();


  const error =
    document.getElementById(
      "settingsRecoveryError"
    );


  if (!answer) {

    error.textContent =
      "Please enter your security answer.";

    return;

  }


  const result =
    await window.api.verifySecurityAnswer({

      userId:
        currentUser?.id || 1,

      answer

    });


  if (!result?.success) {

    error.textContent =
      result?.message ||
      "Incorrect security answer.";

    return;

  }


  removeSettingsRecoveryModal();


  renderSettings();


  alert(
    "Security answer verified. You can now review your recovery information in Settings."
  );

}


function backToSettingsUnlock() {

  removeSettingsRecoveryModal();

  showSettingsUnlockModal();

}


function removeSettingsRecoveryModal() {

  const modal =
    document.getElementById(
      "settingsRecoveryModal"
    );


  if (modal) {
    modal.remove();
  }

}


/* ============================================================
   LOGIN PASSWORD RECOVERY
============================================================ */

async function showReset() {

  document.getElementById(
    "loginScreen"
  ).style.display = "none";


  document.getElementById(
    "resetScreen"
  ).style.display = "flex";


  const question =
    document.getElementById(
      "question"
    );


  const error =
    document.getElementById(
      "resetError"
    );


  error.textContent = "";


  const result =
    await window.api.getSecurityQuestion();


  if (!result?.success) {

    question.textContent =
      result?.message ||
      "Unable to retrieve your security question.";

    return;

  }


  question.textContent =
    result.securityQuestion ||
    "Answer your security question.";

}


async function verifyAnswer() {

  const answer =
    document
      .getElementById("answer")
      .value
      .trim();

  const error =
    document.getElementById(
      "resetError"
    );

  error.style.color = "#f87171";
  error.textContent = "";

  if (!answer) {

    error.textContent =
      "Please enter your security answer.";

    return;
  }

  const result =
    await window.api.verifySecurityAnswer({

      userId: 1,

      answer

    });

  if (!result?.success) {

    error.textContent =
      result?.message ||
      "Incorrect security answer.";

    return;
  }

  /*
   * Security answer is correct.
   * Instead of sending the user back to Settings,
   * show the password reset form.
   */

  showPasswordResetForm(answer);
}

function showPasswordResetForm(answer) {

  const resetScreen =
    document.getElementById("resetScreen");

  if (!resetScreen) {
    return;
  }

  resetScreen.innerHTML = `
    <div class="login-box">

      <div class="brand-mark">TW</div>

      <h1>Reset Password</h1>

      <p class="login-subtitle">
        Create a new password for Trevos Watch.
      </p>

      <label for="newPassword">
        New Password
      </label>

      <input
        id="newPassword"
        type="password"
        placeholder="Enter your new password"
        autocomplete="new-password"
      >

      <label for="confirmNewPassword">
        Confirm New Password
      </label>

      <input
        id="confirmNewPassword"
        type="password"
        placeholder="Confirm your new password"
        autocomplete="new-password"
      >

      <button
        class="primary-button login-button"
        id="resetPasswordButton"
      >
        Reset Password
      </button>

      <button
        class="link-button"
        id="backToLoginButton"
      >
        Back to Login
      </button>

      <p
        id="passwordResetError"
        class="form-error"
      ></p>

    </div>
  `;

  const resetButton =
    document.getElementById(
      "resetPasswordButton"
    );

  if (resetButton) {

    resetButton.addEventListener(
      "click",
      () => {
        resetPassword(answer);
      }
    );

  }

async function resetPassword(answer) {

  const newPassword =
    document
      .getElementById("newPassword")
      .value
      .trim();

  const confirmPassword =
    document
      .getElementById("confirmNewPassword")
      .value
      .trim();

  const error =
    document.getElementById(
      "passwordResetError"
    );

  error.style.color = "#f87171";
  error.textContent = "";

  if (!newPassword || !confirmPassword) {
    error.textContent =
      "Please enter and confirm your new password.";
    return;
  }

  if (newPassword.length < 6) {
    error.textContent =
      "Password must be at least 6 characters.";
    return;
  }

  if (newPassword !== confirmPassword) {
    error.textContent =
      "Passwords do not match.";
    return;
  }

  const result =
    await window.api.resetPasswordWithAnswer({
      userId: 1,
      answer,
      newPassword
    });

  if (!result?.success) {
    error.textContent =
      result?.message ||
      "Unable to reset password.";
    return;
  }

  error.style.color =
    "#4ade80";

  error.textContent =
    "Password reset successfully.";

  setTimeout(() => {
    location.reload();
  }, 1200);
}



  const backButton =
    document.getElementById(
      "backToLoginButton"
    );

  if (backButton) {

    backButton.addEventListener(
      "click",
      () => {
        location.reload();
      }
    );

  }

}



/* ============================================================
   FORMATTING
============================================================ */

function formatDate(
  date
) {

  if (!date) {
    return "—";
  }


  const value =
    new Date(
      date +
      "T00:00:00"
    );


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
      month: "short",
      year: "numeric"
    }
  );

}


/* ============================================================
   SECURITY HELPERS
============================================================ */

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


/* ============================================================
   SETTINGS STYLES
============================================================ */

function injectSettingsStyles() {

  if (
    document.getElementById(
      "trevosSettingsStyles"
    )
  ) {
    return;
  }


  const style =
    document.createElement("style");


  style.id =
    "trevosSettingsStyles";


  style.textContent = `

    .tw-modal-overlay {

      position: fixed;

      inset: 0;

      z-index: 9999;

      display: flex;

      align-items: center;

      justify-content: center;

      padding: 25px;

      background:
        rgba(3, 7, 12, 0.78);

      backdrop-filter:
        blur(8px);

    }


    .tw-modal-card {

      width: 100%;

      max-width: 460px;

      padding: 30px;

      border:
        1px solid #263243;

      border-radius: 18px;

      background:
        #111923;

      box-shadow:
        0 30px 80px
        rgba(0, 0, 0, 0.55);

    }


    .tw-modal-card h2 {

      margin:
        15px 0 8px;

      font-size: 23px;

    }


    .tw-modal-card > p {

      margin:
        0 0 22px;

      color:
        #7e8b9d;

      line-height:
        1.6;

      font-size:
        13px;

    }


    .tw-modal-icon {

      width: 50px;

      height: 50px;

      display: flex;

      align-items: center;

      justify-content: center;

      border-radius: 14px;

      background:
        rgba(56, 189, 248, 0.1);

      font-size: 22px;

    }


    .tw-modal-card label {

      display: block;

      margin:
        15px 0 8px;

      color:
        #aab5c5;

      font-size:
        13px;

      font-weight:
        600;

    }


    .tw-modal-card input {

      width: 100%;

    }


    .tw-modal-actions {

      display: flex;

      justify-content: flex-end;

      gap: 10px;

      margin-top: 22px;

    }


    .tw-forgot {

      display: block;

      margin:
        20px auto 0;

    }


    .tw-error {

      min-height: 18px;

      margin:
        8px 0 0 !important;

      color:
        #f87171 !important;

      font-size:
        12px !important;

    }


    .tw-question-box {

      margin:
        15px 0;

      padding: 14px;

      border:
        1px solid #263243;

      border-radius: 10px;

      background:
        #0b111a;

      color:
        #d8e0ea;

      line-height:
        1.5;

      font-size:
        13px;

    }


    .tw-settings-grid {

      display: grid;

      grid-template-columns:
        repeat(2, minmax(0, 1fr));

      gap: 20px;

    }


    .tw-settings-card {

      padding: 23px;

      border:
        1px solid #202b3a;

      border-radius: 15px;

      background:
        #111923;

    }


    .tw-settings-heading {

      display: flex;

      align-items: flex-start;

      gap: 13px;

      margin-bottom: 22px;

    }


    .tw-settings-icon {

      width: 42px;

      height: 42px;

      flex-shrink: 0;

      display: flex;

      align-items: center;

      justify-content: center;

      border-radius: 11px;

      background:
        rgba(56, 189, 248, 0.1);

      font-size: 18px;

    }


    .tw-settings-heading h3 {

      margin:
        2px 0 5px;

    }


    .tw-settings-heading p {

      margin: 0;

      color:
        #718096;

      font-size:
        12px;

      line-height:
        1.5;

    }


    .tw-setting-field {

      margin-bottom:
        16px;

    }


    .tw-setting-field label {

      display: block;

      margin-bottom:
        8px;

      color:
        #aab5c5;

      font-size:
        12px;

      font-weight:
        600;

    }


    .tw-setting-actions {

      display: flex;

      justify-content: flex-end;

      margin-top:
        20px;

    }


    .tw-logo-preview {

      min-height: 90px;

      display: flex;

      align-items: center;

      justify-content: center;

      margin-top: 12px;

      padding: 10px;

      border:
        1px dashed #334155;

      border-radius: 12px;

      background:
        #0b111a;

      color:
        #69778b;

      font-size:
        12px;

    }


    .tw-logo-preview img {

      max-width: 180px;

      max-height: 80px;

      object-fit: contain;

    }


    @media (max-width: 900px) {

      .tw-settings-grid {

        grid-template-columns:
          1fr;

      }

    }

  `;


  document.head.appendChild(
    style
  );

}

/* ============================================================
   PRODUCT SEARCH / FILTER / SORT
============================================================ */

let currentProductList = [];
let currentProductType = "";


/* =========================
   INITIALIZE PRODUCT TOOLS
========================= */

function initializeProductTools(
  products,
  type
) {

  currentProductList = products;
  currentProductType = type;


  const searchInput =
    document.getElementById(
      "productSearch"
    );

  const statusFilter =
    document.getElementById(
      "statusFilter"
    );

  const productSort =
    document.getElementById(
      "productSort"
    );


  if (!searchInput ||
      !statusFilter ||
      !productSort) {

    return;
  }


  searchInput.addEventListener(
    "input",
    applyProductTools
  );

  statusFilter.addEventListener(
    "change",
    applyProductTools
  );

  productSort.addEventListener(
    "change",
    applyProductTools
  );

}


/* =========================
   APPLY SEARCH / FILTER / SORT
========================= */

function applyProductTools() {

  const searchInput =
    document.getElementById(
      "productSearch"
    );

  const statusFilter =
    document.getElementById(
      "statusFilter"
    );

  const productSort =
    document.getElementById(
      "productSort"
    );


  if (!searchInput ||
      !statusFilter ||
      !productSort) {

    return;
  }


  const search =
    searchInput.value
      .trim()
      .toLowerCase();


  const selectedStatus =
    statusFilter.value;


  const selectedSort =
    productSort.value;


  let filteredProducts =
    currentProductList.filter(
      product => {

        const productName =
          (
            product.name || ""
          ).toLowerCase();

        const invoice =
          (
            product.invoice || ""
          ).toLowerCase();


        const matchesSearch =
          !search ||
          productName.includes(search) ||
          invoice.includes(search);


        const status =
          getStatus(product);


        const matchesStatus =
          selectedStatus === "ALL" ||
          status.text === selectedStatus;


        return (
          matchesSearch &&
          matchesStatus
        );

      }
    );


  /* =========================
     SORT
  ========================= */

  filteredProducts.sort(
    (a, b) => {

      if (selectedSort === "name") {

        return (
          (a.name || "")
            .localeCompare(
              b.name || ""
            )
        );

      }


      if (selectedSort === "purchase") {

        return (
          getDateValue(
            a.purchase_date
          ) -
          getDateValue(
            b.purchase_date
          )
        );

      }


      if (selectedSort === "expiry") {

        return (
          getDateValue(
            a.expiry
          ) -
          getDateValue(
            b.expiry
          )
        );

      }


      if (selectedSort === "status") {

        const statusOrder = {
          "Expired": 1,
          "Soon to expire": 2,
          "About to expire": 3,
          "Safe": 4
        };


        return (
          (
            statusOrder[
              getStatus(a).text
            ] || 99
          ) -
          (
            statusOrder[
              getStatus(b).text
            ] || 99
          )
        );

      }


      return 0;

    }
  );


  renderFilteredProducts(
    filteredProducts
  );

}


/* =========================
   DATE VALUE
========================= */

function getDateValue(date) {

  if (!date) {
    return Number.MAX_SAFE_INTEGER;
  }


  const value =
    new Date(
      date + "T00:00:00"
    ).getTime();


  if (Number.isNaN(value)) {
    return Number.MAX_SAFE_INTEGER;
  }


  return value;

}


/* =========================
   RENDER FILTERED PRODUCTS
========================= */

function renderFilteredProducts(
  products
) {

  const productList =
    document.getElementById(
      "productList"
    );

    const resultCount =
  document.getElementById(
    "productResultCount"
  );


  if (!productList) {
    return;
  }


  if (products.length === 0) {

    productList.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          🔎
        </div>

        <h3>
          No matching products
        </h3>

        <p>
          Try changing your search or filter.
        </p>

      </div>

    `;

    return;

  }


  productList.innerHTML =
    products
      .map(product => {

        const status =
          getStatus(product);


        return `

          <div class="product-card">

            <div class="product-card-top">

              <div>

                <div class="product-type">
                  ${
                    currentProductType === "INBOUND"
                      ? "↓ INBOUND"
                      : "↑ OUTBOUND"
                  }
                </div>

                <h3>
                  ${escapeHtml(
                    product.name ||
                    "Unnamed Product"
                  )}
                </h3>

              </div>


              <span class="${status.class}">
                ${status.text}
              </span>

            </div>


            <div class="product-details">

              <div>

                <span>
                  Invoice
                </span>

                <strong>
                  ${escapeHtml(
                    product.invoice ||
                    "—"
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Purchase Date
                </span>

                <strong>
                  ${formatDate(
                    product.purchase_date
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Expiry Date
                </span>

                <strong>
                  ${formatDate(
                    product.expiry
                  )}
                </strong>

              </div>

            </div>


            <div class="product-description">

              <span>
                Description
              </span>

              <p>
                ${escapeHtml(
                  product.description ||
                  "No description provided."
                )}
              </p>

            </div>


            <div class="product-actions">

              <button
                class="secondary-button small"
                onclick="editProduct(${product.id})"
              >
                Edit
              </button>


              <button
                class="danger-button small"
                onclick="deleteProduct(${product.id})"
              >
                Delete
              </button>

            </div>

          </div>

        `;

      })
      .join("");

}