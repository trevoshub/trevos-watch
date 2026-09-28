const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {

  // =========================
  // LOGIN
  // =========================

  login: (password) =>
    ipcRenderer.invoke("login", password),

  // =========================
  // PRODUCTS
  // =========================

  getProducts: () =>
    ipcRenderer.invoke("getProducts"),

  addProduct: (product) =>
    ipcRenderer.invoke("addProduct", product),

  updateProduct: (product) =>
    ipcRenderer.invoke("updateProduct", product),

  deleteProduct: (id) =>
    ipcRenderer.invoke("deleteProduct", id),

  // =========================
  // NOTIFICATIONS
  // =========================

  getNotificationData: () =>
    ipcRenderer.invoke("getNotificationData"),

  closeNotification: () =>
    ipcRenderer.invoke("closeNotification"),

  // =========================
  // SETTINGS SECURITY
  // =========================

  verifyPassword: (password) =>
    ipcRenderer.invoke("verifyPassword", password),

  // =========================
  // USER SETTINGS
  // =========================

  getUserSettings: () =>
    ipcRenderer.invoke("getUserSettings"),

  updateUserName: (name) =>
    ipcRenderer.invoke("updateUserName", name),

  changePassword: (data) =>
    ipcRenderer.invoke("changePassword", data),

  // =========================
// PASSWORD RECOVERY
// =========================

getSecurityQuestion: () =>
  ipcRenderer.invoke("getSecurityQuestion"),

verifySecurityAnswer: (answer) =>
  ipcRenderer.invoke(
    "verifySecurityAnswer",
    answer
  ),

resetPasswordWithAnswer: (data) =>
  ipcRenderer.invoke(
    "resetPasswordWithAnswer",
    data
  ),

updateRecoveryInfo: (data) =>
  ipcRenderer.invoke(
    "updateRecoveryInfo",
    data
  ),

  // =========================
  // BRANDING
  // =========================

  updateBranding: (data) =>
    ipcRenderer.invoke(
      "updateBranding",
      data
    ),

  // =========================
  // BROWSER NOTIFICATION
  // =========================

  notify: (title, body) => {
    new Notification(title, {
      body
    });
  }

});