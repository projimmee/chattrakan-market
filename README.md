# ตลาดนัดออนไลน์ อำเภอชาติตระการ

หน้าเว็บแสดงร้านค้าท้องถิ่น พร้อมระบบ Admin ที่ล็อกอินด้วย **Firebase Authentication**  
ข้อมูลร้านค้าเก็บใน **Cloud Firestore** และรองรับการอัปโหลดรูปภาพเป็น **Base64**

---

## ไฟล์ในโปรเจกต์

| ไฟล์ | คำอธิบาย |
|------|----------|
| `index.html` | หน้าหลัก แสดงร้านค้าทั้งหมด |
| `admin.html` | หน้าจัดการ (ต้องล็อกอิน) |
| `style.css` | สไตล์ทั้งหมด |
| `app.js` | ตรรกะ + Firebase |
| `firebase-config.js` | **ใส่ค่า Firebase ของคุณที่นี่** |

---

## วิธีตั้งค่า Firebase (สำคัญ)

### 1. สร้างโปรเจกต์ Firebase
1. ไปที่ [Firebase Console](https://console.firebase.google.com)
2. คลิก **Add project** / สร้างโปรเจกต์ใหม่
3. ตั้งชื่อโปรเจกต์แล้วกดสร้าง

### 2. เพิ่ม Web App
1. ในหน้า Overview ของโปรเจกต์ คลิกไอคอน **Web** (`</>`)
2. ตั้งชื่อแอป (เช่น `chat-trakan-market`)
3. คัดลอกค่า `firebaseConfig` ที่แสดงมา

### 3. ใส่ค่า Config
เปิดไฟล์ `firebase-config.js` แล้วแทนที่ค่าดังนี้:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 4. เปิด Authentication
1. ไปที่เมนู **Authentication** → **Get started**
2. แท็บ **Sign-in method**
3. เปิด **Email/Password** (Enable)
4. ไปที่แท็บ **Users** → **Add user**
5. สร้างบัญชี Admin (ใส่อีเมล + รหัสผ่าน) ที่จะใช้ล็อกอินหน้า Admin

### 5. สร้าง Firestore Database
1. ไปที่เมนู **Firestore Database** → **Create database**
2. เลือก **Start in production mode** (หรือ test mode ก็ได้)
3. เลือก location ที่ใกล้ที่สุด (เช่น `asia-southeast1`)

### 6. ตั้ง Security Rules
ไปที่แท็บ **Rules** ของ Firestore แล้ววางกฎนี้:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ทุกคนอ่านร้านค้าได้
    match /shops/{shopId} {
      allow read: if true;
      allow write: if request.auth != null;  // ต้องล็อกอินถึงจะแก้ไขได้
    }
  }
}
```

กด **Publish**

---

## วิธีใช้งาน

1. ตั้งค่า Firebase ตามขั้นตอนด้านบน
2. เปิด `index.html` ด้วยเบราว์เซอร์ (หรือโฮสต์บน Firebase Hosting / Netlify / อื่น ๆ)
3. คลิก **⚙️ จัดการ** → ล็อกอินด้วยอีเมล/รหัสผ่านที่สร้างไว้
4. เพิ่ม/แก้ไข/ลบร้านค้าได้เลย

### การอัปโหลดรูปภาพ
- เลือก **"อัปโหลดรูป (Base64)"** ในฟอร์ม
- เลือกรูปจากเครื่อง
- ระบบจะย่อขนาดและแปลงเป็น Base64 ให้อัตโนมัติ (เก็บในเอกสาร Firestore โดยตรง)

---

## หมายเหตุ

- Base64 เหมาะกับรูปไอคอนขนาดเล็ก หากต้องการรูปใหญ่แนะนำเปลี่ยนไปใช้ **Firebase Storage** แทน
- ข้อมูลร้านค้าถูกเก็บบนคลาวด์ (Firestore) หลายคนสามารถดูหน้าหลักได้พร้อมกัน
- เฉพาะผู้ที่ล็อกอินเท่านั้นที่แก้ไขร้านค้าได้

## การ Deploy (แนะนำ)

ใช้ **Firebase Hosting** จะสะดวกที่สุด:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# เลือกโฟลเดอร์นี้เป็น public directory
firebase deploy
```
