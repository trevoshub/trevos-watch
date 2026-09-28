const {
  app,
  BrowserWindow,
  ipcMain,
  screen
} = require("electron");

const path = require("path");
const sqlite3 = require("sqlite3").verbose();


// ============================================================
// DATABASE
// ============================================================

const db = new sqlite3.Database("./products.db");


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let mainWindow = null;
let notificationWindow = null;

let isQuitting = false;

let activeNotification = null;
let notificationCheckInterval = null;


// ============================================================
// DATABASE HELPERS
// ============================================================

function addColumnIfMissing(
  table,
  column,
  definition
) {
  return new Promise((resolve, reject) => {

    db.all(
      `PRAGMA table_info(${table})`,
      [],
      (error, columns) => {

        if (error) {
          reject(error);
          return;
        }

        const exists = columns.some(
          columnInfo =>
            columnInfo.name === column
        );

        if (exists) {
          resolve();
          return;
        }

        db.run(
          `ALTER TABLE ${table}
           ADD COLUMN ${column} ${definition}`,
          [],
          error => {

            if (error) {
              reject(error);
              return;
            }

            resolve();
          }
        );
      }
    );
  });
}


async function initializeDatabase() {

  // ----------------------------------------------------------
  // USERS TABLE
  // ----------------------------------------------------------

  await new Promise((resolve, reject) => {

    db.run(
      `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        password TEXT,
        security_question TEXT,
        security_answer TEXT
      )
      `,
      [],
      error => {

        if (error) {
          reject(error);
          return;
        }

        resolve();
      }
    );
  });


  // ----------------------------------------------------------
  // PRODUCTS TABLE
  // ----------------------------------------------------------

  await new Promise((resolve, reject) => {

    db.run(
      `
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        expiry TEXT
      )
      `,
      [],
      error => {

        if (error) {
          reject(error);
          return;
        }

        resolve();
      }
    );
  });


  // ----------------------------------------------------------
  // PRODUCT MIGRATIONS
  // ----------------------------------------------------------

  await addColumnIfMissing(
    "products",
    "type",
    "TEXT NOT NULL DEFAULT 'INBOUND'"
  );

  await addColumnIfMissing(
    "products",
    "invoice",
    "TEXT DEFAULT ''"
  );

  await addColumnIfMissing(
    "products",
    "purchase_date",
    "TEXT DEFAULT ''"
  );

  await addColumnIfMissing(
    "products",
    "notification_about",
    "TEXT DEFAULT ''"
  );

  await addColumnIfMissing(
    "products",
    "notification_soon",
    "TEXT DEFAULT ''"
  );

  await addColumnIfMissing(
    "products",
    "notification_expired",
    "TEXT DEFAULT ''"
  );

  await addColumnIfMissing(
    "products",
    "notification_about_count",
    "INTEGER NOT NULL DEFAULT 0"
  );

  await addColumnIfMissing(
    "products",
    "notification_soon_count",
    "INTEGER NOT NULL DEFAULT 0"
  );

  await addColumnIfMissing(
    "products",
    "notification_expired_count",
    "INTEGER NOT NULL DEFAULT 0"
  );

  await addColumnIfMissing(
    "products",
    "notification_about_last_shown",
    "TEXT DEFAULT ''"
  );

  await addColumnIfMissing(
    "products",
    "notification_soon_last_shown",
    "TEXT DEFAULT ''"
  );

  await addColumnIfMissing(
    "products",
    "notification_expired_last_shown",
    "TEXT DEFAULT ''"
  );


  // ----------------------------------------------------------
  // USER SETTINGS / BRANDING MIGRATIONS
  // ----------------------------------------------------------

  await addColumnIfMissing(
    "users",
    "app_name",
    "TEXT DEFAULT 'Trevos Watch'"
  );

  await addColumnIfMissing(
    "users",
    "company_name",
    "TEXT DEFAULT ''"
  );

  await addColumnIfMissing(
    "users",
    "company_logo",
    "TEXT DEFAULT ''"
  );


  // ----------------------------------------------------------
  // CREATE DEFAULT USER IF NONE EXISTS
  // ----------------------------------------------------------

  await new Promise((resolve, reject) => {

    db.get(
      `
      SELECT *
      FROM users
      ORDER BY id ASC
      LIMIT 1
      `,
      [],
      (error, user) => {

        if (error) {
          reject(error);
          return;
        }

        if (user) {
          resolve();
          return;
        }

        db.run(
          `
          INSERT INTO users
          (
            name,
            password,
            security_question,
            security_answer,
            app_name,
            company_name,
            company_logo
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            "Mr. Tochi",
            "password123",
            "Your favorite color?",
            "blue",
            "Trevos Watch",
            "",
            ""
          ],
          error => {

            if (error) {
              reject(error);
              return;
            }

            resolve();
          }
        );
      }
    );
  });


  // ----------------------------------------------------------
  // ENSURE EXISTING USERS HAVE DEFAULT APP NAME
  // ----------------------------------------------------------

  await new Promise((resolve, reject) => {

    db.run(
      `
      UPDATE users
      SET app_name = 'Trevos Watch'
      WHERE app_name IS NULL
         OR TRIM(app_name) = ''
      `,
      [],
      error => {

        if (error) {
          reject(error);
          return;
        }

        resolve();
      }
    );
  });

}


// ============================================================
// DATABASE INITIALIZATION
// ============================================================

initializeDatabase()
  .then(() => {

    console.log(
      "Database initialized successfully."
    );

    createMainWindow();

    startNotificationEngine();

  })
  .catch(error => {

    console.error(
      "Database initialization failed:",
      error
    );

  });


// ============================================================
// MAIN WINDOW
// ============================================================

function createMainWindow() {

  mainWindow = new BrowserWindow({

    width: 1400,

    height: 900,

    minWidth: 1000,

    minHeight: 650,

    backgroundColor: "#0f1115",

    webPreferences: {

      preload: path.join(
        __dirname,
        "preload.js"
      ),

      contextIsolation: true,

      nodeIntegration: false

    }

  });


  mainWindow.loadFile(
    path.join(
      __dirname,
      "renderer",
      "index.html"
    )
  );


  // ----------------------------------------------------------
  // HIDE WINDOW INSTEAD OF DESTROYING IT
  // ----------------------------------------------------------

  mainWindow.on(
    "close",
    event => {

      if (!isQuitting) {

        event.preventDefault();

        mainWindow.hide();

      }

    }
  );


  mainWindow.on(
    "closed",
    () => {

      mainWindow = null;

    }
  );
}


// ============================================================
// NOTIFICATION WINDOW
// ============================================================

function createNotificationWindow() {

  if (
    notificationWindow &&
    !notificationWindow.isDestroyed()
  ) {
    return;
  }


  const primaryDisplay =
    screen.getPrimaryDisplay();


  const {
    width,
    height
  } = primaryDisplay.bounds;


  notificationWindow =
    new BrowserWindow({

      width,

      height,

      x: 0,

      y: 0,

      frame: false,

      fullscreen: true,

      alwaysOnTop: true,

      skipTaskbar: true,

      resizable: false,

      movable: false,

      minimizable: false,

      maximizable: false,

      closable: false,

      backgroundColor: "#0f1115",

      webPreferences: {

        preload: path.join(
          __dirname,
          "preload.js"
        ),

        contextIsolation: true,

        nodeIntegration: false

      }

    });


  notificationWindow.setAlwaysOnTop(
    true,
    "screen-saver"
  );


  notificationWindow.loadFile(
    path.join(
      __dirname,
      "renderer",
      "notification.html"
    )
  );


  notificationWindow.on(
    "closed",
    () => {

      notificationWindow = null;

    }
  );
}


// ============================================================
// NOTIFICATION ENGINE
// ============================================================

function startNotificationEngine() {

  // Check immediately after application starts.
  checkNotifications();


  // Then check every 60 seconds.
  notificationCheckInterval =
    setInterval(
      () => {

        checkNotifications();

      },
      60 * 1000
    );

}


// ============================================================
// CHECK NOTIFICATIONS
// ============================================================

function checkNotifications() {

  // Do not open another notification
  // while one is already being displayed.
  if (
    notificationWindow &&
    !notificationWindow.isDestroyed()
  ) {
    return;
  }


  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );


  db.all(
    `
    SELECT *
    FROM products
    ORDER BY expiry ASC
    `,
    [],
    (error, products) => {

      if (error) {

        console.error(
          "Notification database error:",
          error
        );

        return;

      }


      if (
        !products ||
        products.length === 0
      ) {
        return;
      }


      const notification =
        findNextNotification(
          products,
          today
        );


      if (!notification) {
        return;
      }


      activeNotification =
        notification;


      createNotificationWindow();

    }
  );

}


// ============================================================
// FIND NEXT NOTIFICATION
// ============================================================

function findNextNotification(
  products,
  today
) {

  const candidates = [];


  for (const product of products) {

    // --------------------------------------------------------
    // EXPIRED
    // --------------------------------------------------------

    if (
      product.notification_expired &&
      isDateReached(
        product.notification_expired,
        today
      ) &&
      canShowNotification(
        product.notification_expired_count,
        product.notification_expired_last_shown
      )
    ) {

      candidates.push({

        priority: 1,

        type: "EXPIRED",

        id: product.id,

        name: product.name,

        invoice: product.invoice,

        expiry: product.expiry

      });

    }


    // --------------------------------------------------------
    // SOON
    // --------------------------------------------------------

    if (
      product.notification_soon &&
      isDateReached(
        product.notification_soon,
        today
      ) &&
      canShowNotification(
        product.notification_soon_count,
        product.notification_soon_last_shown
      )
    ) {

      candidates.push({

        priority: 2,

        type: "SOON",

        id: product.id,

        name: product.name,

        invoice: product.invoice,

        expiry: product.expiry

      });

    }


    // --------------------------------------------------------
    // ABOUT TO EXPIRE
    // --------------------------------------------------------

    if (
      product.notification_about &&
      isDateReached(
        product.notification_about,
        today
      ) &&
      canShowNotification(
        product.notification_about_count,
        product.notification_about_last_shown
      )
    ) {

      candidates.push({

        priority: 3,

        type: "ABOUT",

        id: product.id,

        name: product.name,

        invoice: product.invoice,

        expiry: product.expiry

      });

    }

  }


  if (candidates.length === 0) {
    return null;
  }


  // EXPIRED has highest priority,
  // then SOON,
  // then ABOUT.
  candidates.sort(
    (a, b) =>
      a.priority - b.priority
  );


  return candidates[0];

}


// ============================================================
// NOTIFICATION DATE CHECK
// ============================================================

function isDateReached(
  notificationDate,
  today
) {

  const date =
    new Date(
      notificationDate +
      "T00:00:00"
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return false;
  }


  date.setHours(
    0,
    0,
    0,
    0
  );


  return date <= today;

}


// ============================================================
// NOTIFICATION DISPLAY RULES
// ============================================================

function canShowNotification(
  count,
  lastShown
) {

  // Maximum of two displays.
  if (
    Number(count || 0) >= 2
  ) {
    return false;
  }


  // Never displayed before.
  if (!lastShown) {
    return true;
  }


  const last =
    new Date(lastShown);


  if (
    Number.isNaN(
      last.getTime()
    )
  ) {
    return true;
  }


  const now =
    Date.now();


  const elapsed =
    now - last.getTime();


  const cooldown =
    24 * 60 * 60 * 1000;


  return elapsed >= cooldown;

}


// ============================================================
// RECORD NOTIFICATION DISPLAY
// ============================================================

function recordNotificationDisplay(
  notification
) {

  if (!notification) {
    return;
  }


  const now =
    new Date().toISOString();


  let countColumn = "";
  let dateColumn = "";


  if (
    notification.type === "ABOUT"
  ) {

    countColumn =
      "notification_about_count";

    dateColumn =
      "notification_about_last_shown";

  }

  else if (
    notification.type === "SOON"
  ) {

    countColumn =
      "notification_soon_count";

    dateColumn =
      "notification_soon_last_shown";

  }

  else if (
    notification.type === "EXPIRED"
  ) {

    countColumn =
      "notification_expired_count";

    dateColumn =
      "notification_expired_last_shown";

  }


  if (
    !countColumn ||
    !dateColumn
  ) {
    return;
  }


  db.run(
    `
    UPDATE products
    SET
      ${countColumn} =
        COALESCE(${countColumn}, 0) + 1,

      ${dateColumn} = ?

    WHERE id = ?
    `,
    [
      now,
      notification.id
    ],
    error => {

      if (error) {

        console.error(
          "Failed to record notification:",
          error
        );

      }

    }
  );

}


// ============================================================
// LOGIN
// ============================================================

ipcMain.handle(
  "login",
  async (
    event,
    password
  ) => {

    return new Promise(
      resolve => {

        db.get(
          `
          SELECT *
          FROM users
          ORDER BY id ASC
          LIMIT 1
          `,
          [],
          (error, user) => {

            if (error) {

              console.error(
                "Login database error:",
                error
              );

              resolve({
                success: false,
                message:
                  "Database error."
              });

              return;

            }


            if (!user) {

              resolve({
                success: false,
                message:
                  "No user account found."
              });

              return;

            }


            if (
              String(password || "") !==
              String(user.password || "")
            ) {

              resolve({
                success: false,
                message:
                  "Incorrect password."
              });

              return;

            }


            resolve({
              success: true,

              user: sanitizeUser(
                user
              )

            });

          }
        );

      }
    );

  }
);


// ============================================================
// VERIFY PASSWORD
// ============================================================

ipcMain.handle(
  "verifyPassword",
  async (
    event,
    password
  ) => {

    return new Promise(
      resolve => {

        db.get(
          `
          SELECT password
          FROM users
          ORDER BY id ASC
          LIMIT 1
          `,
          [],
          (error, user) => {

            if (error) {

              resolve({
                success: false,
                message:
                  "Database error."
              });

              return;

            }


            if (!user) {

              resolve({
                success: false,
                message:
                  "User account not found."
              });

              return;

            }


            const valid =
              String(password || "") ===
              String(user.password || "");


            resolve({

              success: valid,

              message: valid
                ? "Password verified."
                : "Incorrect password."

            });

          }
        );

      }
    );

  }
);


// ============================================================
// GET USER PROFILE / SETTINGS
// ============================================================

ipcMain.handle(
  "getUserSettings",
  async () => {

    return new Promise(
      resolve => {

        db.get(
          `
          SELECT
            id,
            name,
            security_question,
            app_name,
            company_name,
            company_logo
          FROM users
          ORDER BY id ASC
          LIMIT 1
          `,
          [],
          (error, user) => {

            if (error) {

              console.error(
                "Get settings error:",
                error
              );

              resolve({
                success: false,
                message:
                  "Unable to load settings."
              });

              return;

            }


            if (!user) {

              resolve({
                success: false,
                message:
                  "User account not found."
              });

              return;

            }


            resolve({

              success: true,

              user

            });

          }
        );

      }
    );

  }
);


// ============================================================
// UPDATE USER NAME
// ============================================================

ipcMain.handle(
  "updateUserName",
  async (
    event,
    data
  ) => {

    return new Promise(
      resolve => {

        const name =
          String(
            data?.name || ""
          ).trim();


        if (!name) {

          resolve({
            success: false,
            message:
              "Name cannot be empty."
          });

          return;

        }


        db.run(
          `
          UPDATE users
          SET name = ?
          WHERE id = ?
          `,
          [
            name,
            data?.userId || 1
          ],
          function (error) {

            if (error) {

              console.error(
                "Update name error:",
                error
              );

              resolve({
                success: false,
                message:
                  "Unable to update name."
              });

              return;

            }


            resolve({

              success:
                this.changes > 0,

              message:
                this.changes > 0
                  ? "Name updated successfully."
                  : "User account not found."

            });

          }
        );

      }
    );

  }
);


// ============================================================
// CHANGE PASSWORD
// ============================================================

ipcMain.handle(
  "changePassword",
  async (
    event,
    data
  ) => {

    return new Promise(
      resolve => {

        const currentPassword =
          String(
            data?.currentPassword || ""
          );

        const newPassword =
          String(
            data?.newPassword || ""
          );


        if (!currentPassword) {

          resolve({
            success: false,
            message:
              "Current password is required."
          });

          return;

        }


        if (!newPassword) {

          resolve({
            success: false,
            message:
              "New password is required."
          });

          return;

        }


        if (
          newPassword.length < 6
        ) {

          resolve({
            success: false,
            message:
              "New password must contain at least 6 characters."
          });

          return;

        }


        db.get(
          `
          SELECT password
          FROM users
          WHERE id = ?
          `,
          [
            data?.userId || 1
          ],
          (error, user) => {

            if (error) {

              resolve({
                success: false,
                message:
                  "Database error."
              });

              return;

            }


            if (!user) {

              resolve({
                success: false,
                message:
                  "User account not found."
              });

              return;

            }


            if (
              currentPassword !==
              String(user.password || "")
            ) {

              resolve({
                success: false,
                message:
                  "Current password is incorrect."
              });

              return;

            }


            db.run(
              `
              UPDATE users
              SET password = ?
              WHERE id = ?
              `,
              [
                newPassword,
                data?.userId || 1
              ],
              function (updateError) {

                if (updateError) {

                  resolve({
                    success: false,
                    message:
                      "Unable to change password."
                  });

                  return;

                }


                resolve({

                  success:
                    this.changes > 0,

                  message:
                    this.changes > 0
                      ? "Password changed successfully."
                      : "Password was not changed."

                });

              }
            );

          }
        );

      }
    );

  }
);


// ============================================================
// GET SECURITY QUESTION
// ============================================================

ipcMain.handle(
  "getSecurityQuestion",
  async () => {

    return new Promise(
      resolve => {

        db.get(
          `
          SELECT
            id,
            security_question
          FROM users
          ORDER BY id ASC
          LIMIT 1
          `,
          [],
          (error, user) => {

            if (error) {

              resolve({
                success: false,
                message:
                  "Unable to retrieve security question."
              });

              return;

            }


            if (!user) {

              resolve({
                success: false,
                message:
                  "User account not found."
              });

              return;

            }


            resolve({

              success: true,

              userId: user.id,

              securityQuestion:
                user.security_question || ""

            });

          }
        );

      }
    );

  }
);


// ============================================================
// VERIFY SECURITY ANSWER
// ============================================================

ipcMain.handle(
  "verifySecurityAnswer",
  async (
    event,
    data
  ) => {

    return new Promise(
      resolve => {

        db.get(
          `
          SELECT security_answer
          FROM users
          WHERE id = ?
          `,
          [
            data?.userId || 1
          ],
          (error, user) => {

            if (error) {

              resolve({
                success: false,
                message:
                  "Database error."
              });

              return;

            }


            if (!user) {

              resolve({
                success: false,
                message:
                  "User account not found."
              });

              return;

            }


            const storedAnswer =
              String(
                user.security_answer || ""
              )
                .trim()
                .toLowerCase();


            const suppliedAnswer =
              String(
                data?.answer || ""
              )
                .trim()
                .toLowerCase();


            const valid =
              storedAnswer ===
              suppliedAnswer;


            resolve({

              success: valid,

              message: valid
                ? "Security answer verified."
                : "Incorrect security answer."

            });

          }
        );

      }
    );

  }
);


ipcMain.handle("resetPasswordWithAnswer", async (event, data) => {
  return new Promise((resolve) => {
    const userId = Number(data?.userId);
    const answer = String(data?.answer || "").trim();
    const newPassword = String(data?.newPassword || "");

    if (!userId || !answer || !newPassword) {
      resolve({
        success: false,
        message: "All fields are required."
      });
      return;
    }

    if (newPassword.length < 6) {
      resolve({
        success: false,
        message: "Password must be at least 6 characters."
      });
      return;
    }

    db.get(
      `
      SELECT id, security_answer
      FROM users
      WHERE id = ?
      `,
      [userId],
      (err, user) => {
        if (err) {
          console.error("Password reset lookup error:", err);

          resolve({
            success: false,
            message: "Unable to process password reset."
          });

          return;
        }

        if (!user) {
          resolve({
            success: false,
            message: "User not found."
          });

          return;
        }

        const savedAnswer =
          String(user.security_answer || "")
            .trim()
            .toLowerCase();

        if (savedAnswer !== answer.toLowerCase()) {
          resolve({
            success: false,
            message: "Incorrect security answer."
          });

          return;
        }

        db.run(
          `
          UPDATE users
          SET password = ?
          WHERE id = ?
          `,
          [newPassword, userId],
          function (updateErr) {
            if (updateErr) {
              console.error(
                "Password reset update error:",
                updateErr
              );

              resolve({
                success: false,
                message: "Unable to update password."
              });

              return;
            }

            resolve({
              success: true,
              message: "Password reset successfully."
            });
          }
        );
      }
    );
  });
});


// ============================================================
// UPDATE RECOVERY INFORMATION
// ============================================================

ipcMain.handle(
  "updateRecoveryInfo",
  async (
    event,
    data
  ) => {

    return new Promise(
      resolve => {

        const question =
          String(
            data?.securityQuestion || ""
          ).trim();

        const answer =
          String(
            data?.securityAnswer || ""
          ).trim();


        if (!question) {

          resolve({
            success: false,
            message:
              "Security question is required."
          });

          return;

        }


        if (!answer) {

          resolve({
            success: false,
            message:
              "Security answer is required."
          });

          return;

        }


        db.run(
          `
          UPDATE users
          SET
            security_question = ?,
            security_answer = ?
          WHERE id = ?
          `,
          [
            question,
            answer,
            data?.userId || 1
          ],
          function (error) {

            if (error) {

              console.error(
                "Recovery information update error:",
                error
              );

              resolve({
                success: false,
                message:
                  "Unable to update recovery information."
              });

              return;

            }


            resolve({

              success:
                this.changes > 0,

              message:
                this.changes > 0
                  ? "Recovery information updated successfully."
                  : "User account not found."

            });

          }
        );

      }
    );

  }
);


// ============================================================
// UPDATE BRANDING
// ============================================================

ipcMain.handle(
  "updateBranding",
  async (
    event,
    data
  ) => {

    return new Promise(
      resolve => {

        const appName =
          String(
            data?.appName || ""
          ).trim() ||
          "Trevos Watch";


        const companyName =
          String(
            data?.companyName || ""
          ).trim();


        const companyLogo =
          String(
            data?.companyLogo || ""
          );


        db.run(
          `
          UPDATE users
          SET
            app_name = ?,
            company_name = ?,
            company_logo = ?
          WHERE id = ?
          `,
          [
            appName,
            companyName,
            companyLogo,
            data?.userId || 1
          ],
          function (error) {

            if (error) {

              console.error(
                "Branding update error:",
                error
              );

              resolve({
                success: false,
                message:
                  "Unable to update branding."
              });

              return;

            }


            resolve({

              success:
                this.changes > 0,

              message:
                this.changes > 0
                  ? "Branding updated successfully."
                  : "User account not found."

            });

          }
        );

      }
    );

  }
);


// ============================================================
// GET PRODUCTS
// ============================================================

ipcMain.handle(
  "getProducts",
  async () => {

    return new Promise(
      resolve => {

        db.all(
          `
          SELECT *
          FROM products
          ORDER BY id DESC
          `,
          [],
          (error, rows) => {

            if (error) {

              console.error(
                "Get products error:",
                error
              );

              resolve([]);

              return;

            }


            resolve(
              rows || []
            );

          }
        );

      }
    );

  }
);


// ============================================================
// ADD PRODUCT
// ============================================================

ipcMain.handle(
  "addProduct",
  async (
    event,
    product
  ) => {

    return new Promise(
      resolve => {

        db.run(
          `
          INSERT INTO products
          (
            name,
            description,
            expiry,
            type,
            invoice,
            purchase_date,
            notification_about,
            notification_soon,
            notification_expired,
            notification_about_count,
            notification_soon_count,
            notification_expired_count,
            notification_about_last_shown,
            notification_soon_last_shown,
            notification_expired_last_shown
          )
          VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, '', '', '')
          `,
          [
            product?.name || "",
            product?.description || "",
            product?.expiry || "",
            product?.type || "INBOUND",
            product?.invoice || "",
            product?.purchase_date || "",
            product?.notification_about || "",
            product?.notification_soon || "",
            product?.notification_expired || ""
          ],
          function (error) {

            if (error) {

              console.error(
                "Add product error:",
                error
              );

              resolve({
                success: false,
                message:
                  "Unable to add product."
              });

              return;

            }


            resolve({

              success: true,

              id: this.lastID

            });

          }
        );

      }
    );

  }
);


// ============================================================
// UPDATE PRODUCT
// ============================================================

ipcMain.handle(
  "updateProduct",
  async (
    event,
    product
  ) => {

    return new Promise(
      resolve => {

        db.run(
          `
          UPDATE products
          SET
            name = ?,
            description = ?,
            expiry = ?,
            type = ?,
            invoice = ?,
            purchase_date = ?,
            notification_about = ?,
            notification_soon = ?,
            notification_expired = ?
          WHERE id = ?
          `,
          [
            product?.name || "",
            product?.description || "",
            product?.expiry || "",
            product?.type || "INBOUND",
            product?.invoice || "",
            product?.purchase_date || "",
            product?.notification_about || "",
            product?.notification_soon || "",
            product?.notification_expired || "",
            product?.id
          ],
          function (error) {

            if (error) {

              console.error(
                "Update product error:",
                error
              );

              resolve({
                success: false,
                message:
                  "Unable to update product."
              });

              return;

            }


            resolve({

              success:
                this.changes > 0,

              message:
                this.changes > 0
                  ? "Product updated successfully."
                  : "Product not found."

            });

          }
        );

      }
    );

  }
);


// ============================================================
// DELETE PRODUCT
// ============================================================

ipcMain.handle(
  "deleteProduct",
  async (
    event,
    id
  ) => {

    return new Promise(
      resolve => {

        db.run(
          `
          DELETE FROM products
          WHERE id = ?
          `,
          [id],
          function (error) {

            if (error) {

              console.error(
                "Delete product error:",
                error
              );

              resolve({
                success: false,
                message:
                  "Unable to delete product."
              });

              return;

            }


            resolve({

              success:
                this.changes > 0,

              message:
                this.changes > 0
                  ? "Product deleted successfully."
                  : "Product not found."

            });

          }
        );

      }
    );

  }
);


// ============================================================
// GET NOTIFICATION DATA
// ============================================================

ipcMain.handle(
  "getNotificationData",
  async () => {

    return activeNotification;

  }
);


// ============================================================
// CLOSE NOTIFICATION
// ============================================================

ipcMain.handle(
  "closeNotification",
  async () => {

    // Keep a reference before clearing
    // the active notification.
    const notification =
      activeNotification;

    // Record that this notification
    // was displayed.
    if (notification) {

      recordNotificationDisplay(
        notification
      );

    }

    // Clear the active notification
    // immediately so the notification
    // cannot be treated as active again.
    activeNotification = null;

    // Completely destroy the notification
    // window. This is intentional because
    // the notification window is a special
    // full-screen window with closable:false.
    if (
      notificationWindow &&
      !notificationWindow.isDestroyed()
    ) {

      notificationWindow.destroy();

    }

    return {
      success: true
    };

  }
);


// ============================================================
// SANITIZE USER
// ============================================================

function sanitizeUser(
  user
) {

  return {

    id: user.id,

    name:
      user.name || "",

    app_name:
      user.app_name ||
      "Trevos Watch",

    company_name:
      user.company_name ||
      "",

    company_logo:
      user.company_logo ||
      "",

    security_question:
      user.security_question ||
      ""

  };

}


// ============================================================
// APPLICATION EVENTS
// ============================================================

app.whenReady().then(() => {

  // Database initialization already creates
  // the main window.

  app.on(
    "activate",
    () => {

      if (
        mainWindow &&
        !mainWindow.isDestroyed()
      ) {

        mainWindow.show();

      }

      else {

        createMainWindow();

      }

    }
  );

});


app.on(
  "before-quit",
  () => {

    isQuitting = true;


    if (
      notificationCheckInterval
    ) {

      clearInterval(
        notificationCheckInterval
      );

      notificationCheckInterval =
        null;

    }


    if (
      db
    ) {

      db.close();

    }

  }
);


app.on(
  "window-all-closed",
  event => {

    // Keep the application alive on Windows
    // because the notification engine must
    // continue running in the background.

    event.preventDefault();

  }
);