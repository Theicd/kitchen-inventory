# צ'קליסט מימוש — מערכת מלאי מטבח ביתית

## מצב: ✅ גרסה 1 הושלמה

### תוצאות QA: 53/53 PASS | 0 FAIL | 0.4s

---

## שלב 1: שלד PWA + מבנה בסיסי
- [x] index.html — שלד HTML ראשי (7 מסכים + toast)
- [x] manifest.webmanifest — הגדרות PWA (RTL, icons, standalone)
- [x] sw.js — Service Worker (cache first + offline fallback + sync)
- [x] base.css — סגנונות בסיס (reset, typography, responsive)
- [x] theme-dark.css — ערכת נושא כהה קולינרית (נחושת/זהב/בורדו/זית)

## שלב 2: מסך בית
- [x] כפתור כניסה למלאי (ירוק זית, גדול)
- [x] כפתור יציאה מהמלאי (בורדו, גדול)
- [x] רשימת חוסרים תחתונה (עד 5 + קישור "עוד")
- [x] מצב ריק — "אין כרגע מוצרים חסרים ✓"

## שלב 3: מנוע סריקת ברקוד
- [x] scanner.js — BarcodeDetector API (EAN-13/8, UPC, Code128/39)
- [x] fallback ל-html5-qrcode (טעינה דינמית)
- [x] בקשת הרשאות מצלמה + טיפול ב-NotAllowedError
- [x] מצלמה אחורית אוטומטית (facingMode: environment)
- [x] סריקה רציפה (250ms interval) + צליל חיווי

## שלב 4: IndexedDB Store
- [x] store.js — ניהול IndexedDB (CRUD + Promise wrappers)
- [x] טבלת products (barcode index unique)
- [x] טבלת inventory_transactions (product_id, barcode indexes)
- [x] טבלת offline_queue (sync_status index)
- [x] CRUD מלא + generateId (UUID v4)

## שלב 5: לוגיקת מלאי
- [x] inventory.js — stock_in (הוספה + טרנזקציה + offline queue)
- [x] inventory.js — stock_out (הורדה + בדיקת אפס + חוסר)
- [x] inventory.js — manualAdjust (+1/-1 ממסך פרטים)
- [x] מניעת כמות שלילית (Math.max(0, ...))
- [x] חישוב חוסרים אוטומטי (current < target)

## שלב 6: רישום מוצר חדש
- [x] מסך רישום מוצר (#screen-register)
- [x] צילום תמונה (getUserMedia + canvas capture)
- [x] שדה שם (חובה + ולידציה)
- [x] בחירת מיקום (מקרר/מקפיא/ארון — 3 כפתורים)
- [x] כמות יעד (qty picker עם +/-)
- [x] שמירת ברקוד אוטומטי (readonly)

## שלב 7: מסך חוסרים מורחב
- [x] רשימה מלאה (#screen-shortages)
- [x] סינון לפי מיקום (הכל/מקרר/מקפיא/ארון)
- [x] תמונה + כמות נוכחית/יעד/חסר + מיקום

## שלב 8: מסך פרטי מוצר
- [x] תצוגת פרטים מלאה (#screen-product)
- [x] כפתורי +1 / -1
- [x] עריכת יעד (prompt)
- [x] החלפת תמונה (file input + FileReader)

## שלב 9: Router
- [x] router.js — ניווט hash-based (8 מסכים)
- [x] מעבר בין מסכים חלק (onEnter/onLeave hooks)
- [x] כפתור חזרה + היסטוריה

## שלב 10: Offline + Sync
- [x] offline queue ב-IndexedDB (addToOfflineQueue)
- [x] sync אוטומטי בחזרת רשת (online event + SW sync)
- [x] sync batch API (queueAction + syncPending)

## שלב 11: API Layer
- [x] api.js — שכבת תקשורת (fetch + retry + error handling)
- [x] config.js — הגדרות (station mode, device ID, locations)
- [x] כל endpoints מהאיפיון (health, products, stock-in/out, shortages, sync)

## שלב 12: QA אוטומטי
- [x] Unit tests — config.js (13 בדיקות, קבוצה A)
- [x] Unit tests — store.js (14 בדיקות, קבוצה B)
- [x] Unit tests — inventory.js (7 בדיקות, קבוצה C)
- [x] Integration tests — זרימות מלאות (19 בדיקות, קבוצה D)
- [x] QA Runner — דף HTML עצמאי (tests/qa-runner.html)
- [x] **סה"כ: 53/53 PASS | 0 FAIL | 0.4s**

## שלב 13: Definition of Done
- [x] PWA ניתנת להתקנה (manifest + SW)
- [x] סריקה + כניסה עובד (scanner → lookup → stock_in → UI)
- [x] סריקה + יציאה עובד (scanner → lookup → stock_out → shortage)
- [x] רישום מוצר חדש עובד (barcode → photo → name → loc → target)
- [x] חוסרים מוצגים ומתעדכנים (real-time, filter by location)
- [x] offline בסיסי עובד (queue + sync on reconnect)
- [x] QA קריטי עובר (53/53)

---

## מבנה קבצים סופי

```
kitchen-inventory/
  index.html              — 7 מסכים + toast
  manifest.webmanifest    — PWA config
  sw.js                   — Service Worker
  CHECKLIST.md            — צ'קליסט זה
  assets/icons/           — אייקוני PWA
  styles/
    base.css              — reset + typography
    theme-dark.css        — צבעים קולינריים
    home.css              — מסך בית
    scanner.css           — מצלמה + סריקה
    list.css              — רשימות + סינון
    product.css           — רישום + פרטים
  scripts/
    config.js             — הגדרות + תחנה
    store.js              — IndexedDB CRUD
    api.js                — שכבת רשת
    sync.js               — offline queue
    scanner.js            — ברקוד + מצלמה
    inventory.js          — לוגיקת מלאי
    products.js           — ניהול מוצרים
    shortages.js          — חוסרים
    ui.js                 — toast + helpers
    router.js             — ניווט hash
    app.js                — boot sequence
  tests/
    qa-runner.html        — QA runner ראשי
    unit/
      test-config.js      — 13 בדיקות
      test-store.js       — 14 בדיקות
      test-inventory.js   — 7 בדיקות
    integration/
      test-flows.js       — 19 בדיקות
```
