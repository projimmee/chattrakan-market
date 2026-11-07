/**
 * ตลาดนัดออนไลน์ อำเภอชาติตระการ
 * ข้อมูลร้านค้าเก็บใน localStorage
 */

const STORAGE_KEY = 'chat_trakan_market_shops';

// ข้อมูลตัวอย่างเริ่มต้น (จะใช้เฉพาะครั้งแรกที่ยังไม่มีข้อมูล)
const DEFAULT_SHOPS = [
  {
    id: '1',
    name: 'ร้านป้าสมจิตร ผลไม้สด',
    icon: '🍎',
    link: 'https://line.me/ti/p/example1',
    desc: 'ผลไม้ตามฤดูกาลจากสวนท้องถิ่น'
  },
  {
    id: '2',
    name: 'ผักสดบ้านดง',
    icon: '🥬',
    link: 'https://line.me/ti/p/example2',
    desc: 'ผักปลอดสารพิษ ส่งทุกวัน'
  },
  {
    id: '3',
    name: 'กาแฟดอยชาติตระการ',
    icon: '☕',
    link: 'https://facebook.com/example',
    desc: 'กาแฟคั่วสดจากภูเขา'
  },
  {
    id: '4',
    name: 'เสื้อยืดลายไทย',
    icon: '👕',
    link: 'tel:0812345678',
    desc: 'เสื้อผ้าฝีมือคนในชุมชน'
  }
];

// ===== Utility =====
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getShops() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    // ครั้งแรก → ใส่ข้อมูลตัวอย่าง
    saveShops(DEFAULT_SHOPS);
    return DEFAULT_SHOPS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing shops:', e);
    return [];
  }
}

function saveShops(shops) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shops));
}

// ===== หน้าหลัก: แสดงร้านค้า =====
function renderShops() {
  const container = document.getElementById('shop-list');
  const emptyState = document.getElementById('empty-state');
  if (!container) return;

  const shops = getShops();

  if (shops.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  container.innerHTML = shops.map(shop => {
    const iconHtml = shop.icon.startsWith('http') || shop.icon.startsWith('data:')
      ? `<img src="${escapeHtml(shop.icon)}" alt="${escapeHtml(shop.name)}" />`
      : escapeHtml(shop.icon);

    return `
      <a href="${escapeHtml(shop.link)}" target="_blank" rel="noopener noreferrer" class="shop-card">
        <div class="icon">${iconHtml}</div>
        <h3>${escapeHtml(shop.name)}</h3>
        ${shop.desc ? `<p class="desc">${escapeHtml(shop.desc)}</p>` : ''}
        <span class="visit-btn">เข้าชมร้าน →</span>
      </a>
    `;
  }).join('');
}

// ===== หน้า Admin =====
function initAdminPage() {
  renderAdminList();
  setupForm();
  setupClearAll();
}

function renderAdminList() {
  const list = document.getElementById('admin-shop-list');
  const empty = document.getElementById('admin-empty');
  const countEl = document.getElementById('shop-count');
  if (!list) return;

  const shops = getShops();
  if (countEl) countEl.textContent = shops.length;

  if (shops.length === 0) {
    list.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';

  list.innerHTML = shops.map(shop => {
    const iconHtml = shop.icon.startsWith('http') || shop.icon.startsWith('data:')
      ? `<img src="${escapeHtml(shop.icon)}" alt="" />`
      : escapeHtml(shop.icon);

    return `
      <div class="admin-shop-item" data-id="${shop.id}">
        <div class="item-icon">${iconHtml}</div>
        <div class="item-info">
          <h4>${escapeHtml(shop.name)}</h4>
          <p>${escapeHtml(shop.link)}</p>
        </div>
        <div class="item-actions">
          <button type="button" class="btn btn-sm btn-edit" onclick="editShop('${shop.id}')">แก้ไข</button>
          <button type="button" class="btn btn-sm btn-delete" onclick="deleteShop('${shop.id}')">ลบ</button>
        </div>
      </div>
    `;
  }).join('');
}

function setupForm() {
  const form = document.getElementById('shop-form');
  const cancelBtn = document.getElementById('cancel-btn');
  const iconType = document.getElementById('shop-icon-type');
  const iconInput = document.getElementById('shop-icon');

  if (!form) return;

  // สลับ placeholder ตามประเภทไอคอน
  if (iconType) {
    iconType.addEventListener('change', () => {
      if (iconType.value === 'emoji') {
        iconInput.placeholder = '🛒 หรือใส่ Emoji อื่น ๆ';
        if (!iconInput.value || iconInput.value.startsWith('http')) {
          iconInput.value = '🛒';
        }
      } else {
        iconInput.placeholder = 'https://example.com/image.jpg';
        if (iconInput.value && !iconInput.value.startsWith('http')) {
          iconInput.value = '';
        }
      }
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('shop-id').value;
    const name = document.getElementById('shop-name').value.trim();
    const icon = document.getElementById('shop-icon').value.trim() || '🛒';
    const link = document.getElementById('shop-link').value.trim();
    const desc = document.getElementById('shop-desc').value.trim();

    if (!name || !link) {
      alert('กรุณากรอกชื่อร้านและลิงก์');
      return;
    }

    let shops = getShops();

    if (id) {
      // แก้ไข
      const index = shops.findIndex(s => s.id === id);
      if (index !== -1) {
        shops[index] = { ...shops[index], name, icon, link, desc };
      }
    } else {
      // เพิ่มใหม่
      shops.push({
        id: generateId(),
        name,
        icon,
        link,
        desc
      });
    }

    saveShops(shops);
    resetForm();
    renderAdminList();
  });

  if (cancelBtn) {
    cancelBtn.addEventListener('click', resetForm);
  }
}

function editShop(id) {
  const shops = getShops();
  const shop = shops.find(s => s.id === id);
  if (!shop) return;

  document.getElementById('shop-id').value = shop.id;
  document.getElementById('shop-name').value = shop.name;
  document.getElementById('shop-icon').value = shop.icon;
  document.getElementById('shop-link').value = shop.link;
  document.getElementById('shop-desc').value = shop.desc || '';

  // ตั้งค่าประเภทไอคอน
  const isUrl = shop.icon.startsWith('http') || shop.icon.startsWith('data:');
  document.getElementById('shop-icon-type').value = isUrl ? 'url' : 'emoji';

  document.getElementById('form-title').textContent = 'แก้ไขร้านค้า';
  document.getElementById('submit-btn').textContent = 'บันทึกการแก้ไข';
  document.getElementById('cancel-btn').style.display = 'inline-block';

  // เลื่อนไปที่ฟอร์ม
  document.querySelector('.admin-form-section').scrollIntoView({ behavior: 'smooth' });
}

function deleteShop(id) {
  if (!confirm('ต้องการลบร้านค้านี้ใช่หรือไม่?')) return;

  let shops = getShops();
  shops = shops.filter(s => s.id !== id);
  saveShops(shops);
  renderAdminList();

  // ถ้ากำลังแก้ไขร้านที่ถูกลบอยู่ ให้รีเซ็ตฟอร์ม
  if (document.getElementById('shop-id').value === id) {
    resetForm();
  }
}

function resetForm() {
  document.getElementById('shop-form').reset();
  document.getElementById('shop-id').value = '';
  document.getElementById('shop-icon').value = '🛒';
  document.getElementById('shop-icon-type').value = 'emoji';
  document.getElementById('form-title').textContent = 'เพิ่มร้านค้าใหม่';
  document.getElementById('submit-btn').textContent = 'เพิ่มร้านค้า';
  document.getElementById('cancel-btn').style.display = 'none';
}

function setupClearAll() {
  const btn = document.getElementById('clear-all-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (!confirm('ต้องการลบร้านค้าทั้งหมดใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;
    saveShops([]);
    renderAdminList();
    resetForm();
  });
}

// ===== Helper =====
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
