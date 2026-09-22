# חטיבת כרמלי — מערכת טיפולים ושיקום

אפליקציית React (מובייל-ראשון, RTL) לניהול והרשמה למשמרות טיפול רפואי ושיקום לחיילי חטיבת כרמלי.

## טכנולוגיות

- React + Vite
- Tailwind CSS v4
- Firebase Firestore

## התקנה והרצה

```bash
npm install
npm run dev
```

פתחו `http://localhost:5173` — דף חיילים (`/`) או מנהל (`/admin`).

## הגדרת Firebase

1. צרו פרויקט ב-[Firebase Console](https://console.firebase.google.com/).
2. הוסיפו אפליקציית Web והעתיקו את פרטי ההגדרה ל-`src/firebase/config.js`.
3. הפעילו Firestore Database (מצב production או test — לפי הצורך).
4. כללי אבטחה לדוגמה (התאימו לסביבה שלכם):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shifts/{shiftId} {
      allow read: if true;
      allow write: if false; // כתיבה רק דרך Admin SDK / Cloud Functions בפרודקשן
      match /appointments/{appointmentId} {
        allow read: if true;
        allow update: if resource.data.status == 'available'
                      && request.resource.data.status == 'booked';
        allow create: if false;
      }
    }
  }
}
```

> **הערה:** בממשק הנוכחי אין Firebase Auth — כניסת המנהל מוגנת בסיסמה בצד הלקוח (`carmeli2026`) בלבד. לפרודקשן מומלץ להוסיף Auth או Cloud Functions.

## מבנה נתונים

- `shifts/{shiftId}` — פרטי משמרת (מטפל, סוג טיפול, תאריך, שעות, משך משבצת)
- `shifts/{shiftId}/appointments/{slotId}` — משבצות עם `status`: `available` | `booked` ופרטי חייל לאחר הרשמה

## מסכים

| נתיב | תיאור |
|------|--------|
| `/` | הרשמת חייל — בחירת משמרת, משבצת, מילוי טופס |
| `/admin` | לוח מנהל — סיסמה `carmeli2026`, יצירת משמרות, שיתוף קישור |
