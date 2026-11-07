/**
 * ตลาดนัดออนไลน์ อำเภอชาติตระการ
 * ใช้ Firebase Auth + Firestore + Base64 สำหรับรูปภาพ
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

// ===== Firebase Init =====
let app, auth, db;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.warn("⚠️ ยังไม่ได้ตั้งค่า Firebase ในไฟล์ firebase-config.js");
}

const SHOPS_COLLECTION = "shops";

// ===== Utility =====
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message, type = "info") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== แปลงรูปเป็น Base64 (ย่อขนาดอัตโนมัติ) =====
function fileToBase64(file, maxWidth = 400, maxSizeKB = 200) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("ไม่มีไฟล์"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error("ไฟล์ใหญ่เกินไป (สูงสุด 2MB)"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.85;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);

        while (dataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.4) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("โหลดรูปไม่สำเร็จ"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

// ===== ดึงข้อมูลร้านค้าจาก Firestore =====
async function getShops() {
  if (!isFirebaseConfigured || !db) {
    console.warn("Firebase ยังไม่พร้อม");
    return [];
  }

  try {
    const q = query(collection(db, SHOPS_COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const shops = [];
    snapshot.forEach((docSnap) => {
      shops.push({ id: docSnap.id, ...docSnap.data() });
    });
    return shops;
  } catch (err) {
    console.error("Error getting shops:", err);
    try {
      const snapshot = await getDocs(collection(db, SHOPS_COLLECTION));
      const shops = [];
      snapshot.forEach((docSnap) => {
        shops.push({ id: docSnap.id, ...docSnap.data() });
      });
      return shops;
    } catch (e2) {
      showToast("ไม่สามารถโหลดข้อมูลร้านค้าได้", "error");
      return [];
    }
  }
}

// ===== หน้าหลัก: แสดงร้านค้า =====
async function renderShops() {
  const container = document.getElementById("shop-list");
  const emptyState = document.getElementById("empty-state");
  if (!container) return;

  container.innerHTML = `<div class="loading">กำลังโหลดร้านค้า...</div>`;

  const shops = await getShops();

  if (shops.length === 0) {
    container.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  container.innerHTML = shops
    .map((shop) => {
      const iconHtml =
        shop.icon && (shop.icon.startsWith("http") || shop.icon.startsWith("data:"))
          ? `<img src="${escapeHtml(shop.icon)}" alt="${escapeHtml(shop.name)}" />`
          : escapeHtml(shop.icon || "🛒");

      return `
      <a href="${escapeHtml(shop.link)}" target="_blank" rel="noopener noreferrer" class="shop-card">
        <div class="icon">${iconHtml}</div>
        <h3>${escapeHtml(shop.name)}</h3>
        ${shop.desc ? `<p class="desc">${escapeHtml(shop.desc)}</p>` : ""}
        <span class="visit-btn">เข้าชมร้าน →</span>
      </a>
    `;
    })
    .join("");
}

// ===== หน้า Admin =====
function initAdminPage() {
  if (!isFirebaseConfigured) {
    document.body.innerHTML = `
      <div class="config-warning">
        <h2>⚠️ ยังไม่ได้ตั้งค่า Firebase</h2>
        <p>กรุณาเปิดไฟล์ <code>firebase-config.js</code> แล้วใส่ค่า config จาก Firebase Console</p>
        <p>ดูวิธีตั้งค่าได้ใน README.md</p>
        <a href="index.html">← กลับหน้าหลัก</a>
      </div>
    `;
    return;
  }

  const loginSection = document.getElementById("login-section");
  const adminContent = document.getElementById("admin-content");
  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("logout-btn");
  const userEmailEl = document.getElementById("user-email");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (loginSection) loginSection.style.display = "none";
      if (adminContent) adminContent.style.display = "block";
      if (userEmailEl) userEmailEl.textContent = user.email;
      renderAdminList();
      setupForm();
      setupClearAll();
    } else {
      if (loginSection) loginSection.style.display = "flex";
      if (adminContent) adminContent.style.display = "none";
    }
  });

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;
      const errorEl = document.getElementById("login-error");
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (errorEl) errorEl.textContent = "";
      submitBtn.disabled = true;
      submitBtn.textContent = "กำลังเข้าสู่ระบบ...";

      try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast("เข้าสู่ระบบสำเร็จ", "success");
      } catch (err) {
        console.error(err);
        let msg = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
        if (err.code === "auth/user-not-found") msg = "ไม่พบผู้ใช้นี้";
        if (err.code === "auth/wrong-password") msg = "รหัสผ่านไม่ถูกต้อง";
        if (err.code === "auth/invalid-credential") msg = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
        if (err.code === "auth/too-many-requests") msg = "ลองหลายครั้งเกินไป กรุณารอสักครู่";
        if (err.code === "auth/invalid-email") msg = "รูปแบบอีเมลไม่ถูกต้อง";
        if (errorEl) errorEl.textContent = msg;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "เข้าสู่ระบบ";
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
        showToast("ออกจากระบบแล้ว", "info");
      } catch (err) {
        console.error(err);
      }
    });
  }
}

async function renderAdminList() {
  const list = document.getElementById("admin-shop-list");
  const empty = document.getElementById("admin-empty");
  const countEl = document.getElementById("shop-count");
  if (!list) return;

  list.innerHTML = `<div class="loading">กำลังโหลด...</div>`;

  const shops = await getShops();
  if (countEl) countEl.textContent = shops.length;

  if (shops.length === 0) {
    list.innerHTML = "";
    if (empty) empty.style.display = "block";
    return;
  }

  if (empty) empty.style.display = "none";

  list.innerHTML = shops
    .map((shop) => {
      const iconHtml =
        shop.icon && (shop.icon.startsWith("http") || shop.icon.startsWith("data:"))
          ? `<img src="${escapeHtml(shop.icon)}" alt="" />`
          : escapeHtml(shop.icon || "🛒");

      return `
      <div class="admin-shop-item" data-id="${shop.id}">
        <div class="item-icon">${iconHtml}</div>
        <div class="item-info">
          <h4>${escapeHtml(shop.name)}</h4>
          <p>${escapeHtml(shop.link)}</p>
        </div>
        <div class="item-actions">
          <button type="button" class="btn btn-sm btn-edit" data-action="edit" data-id="${shop.id}">แก้ไข</button>
          <button type="button" class="btn btn-sm btn-delete" data-action="delete" data-id="${shop.id}">ลบ</button>
        </div>
      </div>
    `;
    })
    .join("");

  list.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (btn.dataset.action === "edit") editShop(id);
      if (btn.dataset.action === "delete") deleteShop(id);
    });
  });
}

function setupForm() {
  const form = document.getElementById("shop-form");
  const cancelBtn = document.getElementById("cancel-btn");
  const iconType = document.getElementById("shop-icon-type");
  const fileInput = document.getElementById("shop-icon-file");
  const preview = document.getElementById("icon-preview");

  if (!form) return;

  // ป้องกันการผูก event ซ้ำ
  if (form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  if (iconType) {
    iconType.addEventListener("change", () => {
      const type = iconType.value;
      document.getElementById("emoji-url-group").style.display = type === "file" ? "none" : "block";
      document.getElementById("file-group").style.display = type === "file" ? "block" : "none";

      const iconInput = document.getElementById("shop-icon");
      if (type === "emoji") {
        iconInput.placeholder = "🛒 หรือใส่ Emoji อื่น ๆ";
        if (!iconInput.value || iconInput.value.startsWith("http") || iconInput.value.startsWith("data:")) {
          iconInput.value = "🛒";
        }
      } else if (type === "url") {
        iconInput.placeholder = "https://example.com/image.jpg";
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        showToast("กำลังประมวลผลรูป...", "info");
        const base64 = await fileToBase64(file);
        document.getElementById("shop-icon").value = base64;

        if (preview) {
          preview.innerHTML = `<img src="${base64}" alt="preview" />`;
          preview.style.display = "block";
        }
        showToast("อัปโหลดรูปสำเร็จ", "success");
      } catch (err) {
        showToast(err.message || "อัปโหลดไม่สำเร็จ", "error");
        fileInput.value = "";
      }
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("shop-id").value;
    const name = document.getElementById("shop-name").value.trim();
    let icon = document.getElementById("shop-icon").value.trim() || "🛒";
    const link = document.getElementById("shop-link").value.trim();
    const desc = document.getElementById("shop-desc").value.trim();
    const submitBtn = document.getElementById("submit-btn");

    if (!name || !link) {
      showToast("กรุณากรอกชื่อร้านและลิงก์", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "กำลังบันทึก...";

    try {
      if (id) {
        const shopRef = doc(db, SHOPS_COLLECTION, id);
        await updateDoc(shopRef, {
          name,
          icon,
          link,
          desc,
          updatedAt: serverTimestamp()
        });
        showToast("แก้ไขร้านค้าสำเร็จ", "success");
      } else {
        await addDoc(collection(db, SHOPS_COLLECTION), {
          name,
          icon,
          link,
          desc,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        showToast("เพิ่มร้านค้าสำเร็จ", "success");
      }

      resetForm();
      await renderAdminList();
    } catch (err) {
      console.error(err);
      showToast("บันทึกไม่สำเร็จ: " + (err.message || "เกิดข้อผิดพลาด"), "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = id ? "บันทึกการแก้ไข" : "เพิ่มร้านค้า";
    }
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", resetForm);
  }
}

async function editShop(id) {
  const shops = await getShops();
  const shop = shops.find((s) => s.id === id);
  if (!shop) return;

  document.getElementById("shop-id").value = shop.id;
  document.getElementById("shop-name").value = shop.name;
  document.getElementById("shop-icon").value = shop.icon || "🛒";
  document.getElementById("shop-link").value = shop.link;
  document.getElementById("shop-desc").value = shop.desc || "";

  const textInput = document.getElementById("shop-icon-text");
  const isDataUrl = shop.icon && shop.icon.startsWith("data:");
  const isHttp = shop.icon && shop.icon.startsWith("http");
  const iconTypeSelect = document.getElementById("shop-icon-type");

  if (isDataUrl) {
    iconTypeSelect.value = "file";
    document.getElementById("emoji-url-group").style.display = "none";
    document.getElementById("file-group").style.display = "block";
    if (textInput) textInput.value = "";
    const preview = document.getElementById("icon-preview");
    if (preview) {
      preview.innerHTML = `<img src="${shop.icon}" alt="preview" />`;
      preview.style.display = "block";
    }
  } else if (isHttp) {
    iconTypeSelect.value = "url";
    document.getElementById("emoji-url-group").style.display = "block";
    document.getElementById("file-group").style.display = "none";
    if (textInput) textInput.value = shop.icon;
  } else {
    iconTypeSelect.value = "emoji";
    document.getElementById("emoji-url-group").style.display = "block";
    document.getElementById("file-group").style.display = "none";
    if (textInput) textInput.value = shop.icon || "🛒";
  }

  document.getElementById("form-title").textContent = "แก้ไขร้านค้า";
  document.getElementById("submit-btn").textContent = "บันทึกการแก้ไข";
  document.getElementById("cancel-btn").style.display = "inline-block";
  document.querySelector(".admin-form-section").scrollIntoView({ behavior: "smooth" });
}

async function deleteShop(id) {
  if (!confirm("ต้องการลบร้านค้านี้ใช่หรือไม่?")) return;

  try {
    await deleteDoc(doc(db, SHOPS_COLLECTION, id));
    showToast("ลบร้านค้าแล้ว", "success");
    await renderAdminList();
    if (document.getElementById("shop-id").value === id) resetForm();
  } catch (err) {
    console.error(err);
    showToast("ลบไม่สำเร็จ", "error");
  }
}

function resetForm() {
  document.getElementById("shop-form").reset();
  document.getElementById("shop-id").value = "";
  document.getElementById("shop-icon").value = "🛒";
  const textInput = document.getElementById("shop-icon-text");
  if (textInput) textInput.value = "🛒";
  document.getElementById("shop-icon-type").value = "emoji";
  document.getElementById("emoji-url-group").style.display = "block";
  document.getElementById("file-group").style.display = "none";
  document.getElementById("form-title").textContent = "เพิ่มร้านค้าใหม่";
  document.getElementById("submit-btn").textContent = "เพิ่มร้านค้า";
  document.getElementById("cancel-btn").style.display = "none";

  const preview = document.getElementById("icon-preview");
  if (preview) {
    preview.innerHTML = "";
    preview.style.display = "none";
  }
  const fileInput = document.getElementById("shop-icon-file");
  if (fileInput) fileInput.value = "";
}

function setupClearAll() {
  const btn = document.getElementById("clear-all-btn");
  if (!btn || btn.dataset.bound === "true") return;
  btn.dataset.bound = "true";

  btn.addEventListener("click", async () => {
    if (!confirm("ต้องการลบร้านค้าทั้งหมดใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

    try {
      const shops = await getShops();
      for (const shop of shops) {
        await deleteDoc(doc(db, SHOPS_COLLECTION, shop.id));
      }
      showToast("ลบร้านค้าทั้งหมดแล้ว", "success");
      await renderAdminList();
      resetForm();
    } catch (err) {
      console.error(err);
      showToast("ลบไม่สำเร็จ", "error");
    }
  });
}

// Export สำหรับเรียกจาก HTML
window.renderShops = renderShops;
window.initAdminPage = initAdminPage;
