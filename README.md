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

1. היכנסו ל-[Firebase Console](https://console.firebase.google.com/) וצרו פרויקט חדש.
2. **Build → Firestore Database → Create database** (בחרו אזור, למשל `europe-west1`).
3. **Project settings (גלגל) → Your apps → Web (`</>`)** — רשמו שם לאפליקציה וקבלו את אובייקט `firebaseConfig`.
4. העתיקו את הערכים לקובץ `.env` מקומי (ראו `.env.example`) **או** ישירות ל-Vercel (ראו למטה).
5. **Firestore Rules** — העתיקו את התוכן מקובץ [`firestore.rules`](./firestore.rules) ל-Firebase Console → Firestore → **Rules** → **Publish**.

6. **Authentication → Settings → Authorized domains** — הוסיפו את דומיין ה-Vercel (למשל `your-app.vercel.app`) אחרי הפריסה.

## פריסה ל-Vercel

1. דחפו את הקוד ל-GitHub (הריפו `Hativa2`).
2. [vercel.com](https://vercel.com) → **Add New → Project** → ייבוא הריפו.
3. הגדרות Build (Vite — בדרך כלל אוטומטי):
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables** — הוסיפו (לכל הסביבות Production / Preview):

   | שם | ערך מ-Firebase |
   |----|----------------|
   | `VITE_FIREBASE_API_KEY` | `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |

5. **Deploy**. קובץ `vercel.json` בפרויקט מפנה את כל הנתיבים (`/`, `/admin`) ל-`index.html` כדי ש-React Router יעבוד ברענון דף.
6. בדיקה: פתחו `https://your-app.vercel.app/admin`, התחברו עם `carmeli2026`, צרו משמרת — וודאו שהמסמך מופיע ב-Firestore.

### פיתוח מקומי עם Firebase

```bash
cp .env.example .env
# מלאו ערכים אמיתיים
npm run dev
```

> **הערה:** בממשק הנוכחי אין Firebase Auth — כניסת המנהל מוגנת בסיסמה בצד הלקוח (`carmeli2026`) בלבד. לפרודקשן מומלץ להוסיף Auth או Cloud Functions.

## מבנה נתונים

- `shifts/{shiftId}` — פרטי משמרת (מטפל, סוג טיפול, תאריך, שעות, משך משבצת)
- `shifts/{shiftId}/appointments/{slotId}` — משבצות עם `status`: `available` | `booked` ופרטי חייל לאחר הרשמה (`personalNumber`, `idNumber`, `battalion`, `fullName`, `phone`, `email`)

## מסכים

| נתיב | תיאור |
|------|--------|
| `/` | הרשמת חייל — בחירת משמרת, משבצת, מילוי טופס |
| `/admin` | לוח מנהל — סיסמה `carmeli2026`, יצירת משמרות, שיתוף קישור |
