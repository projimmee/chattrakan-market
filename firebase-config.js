/**
 * ========================================
 *  ตั้งค่า Firebase ที่นี่
 * ========================================
 * 1. ไปที่ https://console.firebase.google.com
 * 2. สร้างโปรเจกต์ใหม่ (หรือใช้โปรเจกต์ที่มีอยู่)
 * 3. เพิ่ม Web App แล้วคัดลอกค่า config มาใส่ด้านล่าง
 * 4. เปิด Authentication → Sign-in method → เปิด "Email/Password"
 * 5. สร้าง Firestore Database (โหมด production หรือ test ก็ได้)
 * 6. ตั้ง Security Rules ตามที่แนะนำใน README.md
 */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// ตรวจสอบว่าใส่ config แล้วหรือยัง
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

export { firebaseConfig, isFirebaseConfigured };
