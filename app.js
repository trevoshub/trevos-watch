const db = require('../db/database');

let password = "password123";
let userName = "User";

function greeting() {
  let h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function loadWelcome() {
  document.getElementById("content").innerHTML = `
    <div class="card">
      <h1>Trevos Hub Suite List</h1>
      <h2>${greeting()} ${userName}</h2>
    </div>
  `;
}

function unlock(page) {
  let pass = prompt("Enter Password");
  if (pass === password) {
    if (page === "products") loadProducts();
    if (page === "settings") loadSettings();
  } else alert("Wrong password");
}

function loadSettings() {
  document.getElementById("content").innerHTML = `
    <div class="card">
      <h2>Settings</h2>
      <input id="name" placeholder="Enter Name">
      <button onclick="saveName()">Update</button>
    </div>
  `;
}

function saveName() {
  userName = document.getElementById("name").value;
  alert("Name updated");
}

function loadProducts() {
  db.all("SELECT * FROM products", [], (err, rows) => {
    let html = `<div class="card">
      <h2>Products</h2>
      <button onclick="showAddForm()">Add New Product</button>
    </div>`;

    rows.forEach(r => {
      let status = getStatus(r.expiry);
      html += `
      <div class="card">
        <h3>${r.name}</h3>
        <p>${r.description}</p>
        <p class="${status.class}">${status.text}</p>
        <button onclick="editProduct(${r.id})">Edit</button>
      </div>`;
    });

    document.getElementById("content").innerHTML = html;
    checkNotifications(rows);
  });
}

function showAddForm() {
  document.getElementById("content").innerHTML = `
    <div class="card">
      <h2>Add Product</h2>
      <input id="name" placeholder="Product Name">
      <input id="desc" placeholder="Description">
      <input id="expiry" type="date">
      <button onclick="saveProduct()">Save</button>
    </div>
  `;
}

function saveProduct() {
  let name = document.getElementById("name").value;
  let desc = document.getElementById("desc").value;
  let expiry = document.getElementById("expiry").value;

  db.run("INSERT INTO products (name, description, expiry) VALUES (?, ?, ?)", [name, desc, expiry], () => {
    loadProducts();
  });
}

function getStatus(expiry) {
  const today = new Date();
  const exp = new Date(`${expiry}T00:00:00`);

  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const expiryDate = new Date(
    exp.getFullYear(),
    exp.getMonth(),
    exp.getDate()
  );

  const diff =
    (expiryDate - todayDate) /
    (1000 * 60 * 60 * 24);

  if (diff <= 0) {
    return {
      text: "Expired",
      class: "status-red"
    };
  }

  if (diff <= 3) {
    return {
      text: "Soon to expire",
      class: "status-orange"
    };
  }

  if (diff <= 7) {
    return {
      text: "About to expire",
      class: "status-yellow"
    };
  }

  return {
    text: "Safe",
    class: "status-green"
  };
}



loadWelcome();