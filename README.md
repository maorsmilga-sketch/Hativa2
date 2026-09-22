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

## תצוגה מקדימה ב-WhatsApp (לוגו)

WhatsApp מציג **תצוגה מקדימה של הקישור** לפי תגיות Open Graph. הלוגו מוגדר כ-`og:image` → `public/logo.png`.

1. ב-Vercel הוסיפו **Environment Variable**: `VITE_SITE_URL` = כתובת האתר (למשל `https://hativa2.vercel.app`) **בלי** סלאש בסוף.
2. **Redeploy** (חובה — התגיות נבנות ב-build).
3. WhatsApp **שומר cache** — אם הלוגו לא מתעדכן, נסו [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) עם כתובת האתר ולחצו Scrape Again.

> «שיתוף טיפול» שולח **קישור + טקst**; התמונה ב-WhatsApp מגיעה מהתצוגה המקדימה של הדף, לא מהקובץ המצורף לשיתוף.

## לוגו (חובה לפריסה)

האתר מחפש **`public/logo.png`**. הקובץ חייב להיות בתיקייה `public/` (לא בשורש הריפo) ולהיכנס ל-Git:

```bash
# העתיקו את logo.png לתיקייה public/
git add public/logo.png
git commit -m "Add brigade logo"
git push origin main
```

אם `logo.png` חסר, מוצג גיבוי זמני (`public/logo.svg`).

## הגדרת Firebase

1. היכנסו ל-[Firebase Console](https://console.firebase.google.com/) וצרו פרויקט חדש.
2. **Build → Firestore Database → Create database** (בחרו אזור, למשל `europe-west1`).
3. **Project settings (גלגל) → Your apps → Web (`</>`)** — רשמו שם לאפליקציה וקבלו את אובייקט `firebaseConfig`.
4. העתיקו את הערכים לקובץ `.env` מקומי (ראו `.env.example`) **או** ישירות ל-Vercel (ראו למטה).
5. **Authentication → Sign-in method** — הפעילו **Google** כספק התחברות.
6. **Authentication → Settings → Authorized domains** — הוסיפו את דומיין ה-Vercel (למשל `your-app.vercel.app`) אחרי הפריסה.
7. **Firestore Rules** — ערכו את רשימת המיילים ב-`isAdmin()` בקובץ [`firestore.rules`](./firestore.rules), העתיקו ל-Firebase Console → Firestore → **Rules** → **Publish** (חייב להתאים ל-`VITE_ADMIN_EMAILS`).

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
   | `VITE_ADMIN_EMAILS` | מיילי Google מורשים למנהל (מופרדים בפסיק) |

5. **Deploy**. קובץ `vercel.json` בפרויקט מפנה את כל הנתיבים (`/`, `/admin`) ל-`index.html` כדי ש-React Router יעבוד ברענון דף.
6. בדיקה: פתחו `https://your-app.vercel.app/admin`, התחברו עם Google, צרו טיפול — וודאו שהמסמך מופיע ב-Firestore.

### פיתוח מקומי עם Firebase

```bash
cp .env.example .env
# מלאו ערכים אמיתיים
npm run dev
```

## מבנה נתונים ופרטיות

- `shifts/{shiftId}` — פרטי משמרת (מטפל, סוג טיפול, תאריך, שעות, משך משבצת)
- `shifts/{shiftId}/appointments/{slotId}` — **ציבורי**: `startTime`, `endTime`, `status` (`available` | `booked`) בלבד
- `private_bookings/{shiftId}_{slotId}` — **פרטי (מנהל בלבד)**: `shiftId`, `slotId`, `personalNumber`, `soldierName`, `phone`, `email`, `idNumber`, `battalion`

חיילים ללא התחברות רואים רק זמינות; PII נשמר ב-`private_bookings`. מנהלים מתחברים עם Google (`/admin`) ורואים לוח מלא (join בין המשבצות ל-private).

## מסכים

| נתיב | תיאור |
|------|--------|
| `/` | הרשמת חייל — בחירת טיפול, משבצת, מילוי טופס |
| `/admin` | לוח מנהל — Google Auth, יצירת טיפולים, שיתוף קישור |
