/* ===================================================
   app.js — נקודת כניסה ראשית
   אחראי על: אתחול המערכת, רישום SW, boot sequence
   שייך ל: כל המודולים — מאתחל הכל בסדר הנכון
   =================================================== */

const App = (() => {

    /* ---- רצף אתחול ---- */
    async function boot() {
        console.log('[App] 🍽️ מלאי המטבח — מאתחל...');

        try {
            /* שלב 1: אתחול IndexedDB */
            await Store.init();
            console.log('[App] ✓ IndexedDB מוכן');

            /* שלב 2: אתחול Sync */
            Sync.init();
            console.log('[App] ✓ Sync מוכן');

            /* שלב 3: רישום Service Worker */
            await _registerServiceWorker();

            /* שלב 4: אתחול Router */
            Router.init();
            console.log('[App] ✓ Router מוכן');

            /* שלב 5: טעינת חוסרים במסך בית */
            await Shortages.refresh();
            console.log('[App] ✓ חוסרים נטענו');

            /* שלב 6: עדכון הגדרות תחנה */
            UI.updateStationUI();

            /* שלב 7: אתחול באנר התקנת PWA */
            PWAInstall.init();
            console.log('[App] ✓ PWA Install מוכן');

            console.log('[App] ✅ המערכת מוכנה!');

        } catch (err) {
            console.error('[App] ❌ שגיאה באתחול:', err);
            UI.toast('שגיאה באתחול המערכת', 'error');
        }
    }

    /* ---- רישום Service Worker ---- */
    async function _registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const reg = await navigator.serviceWorker.register('./sw.js');
                console.log('[App] ✓ Service Worker רשום:', reg.scope);

                /* רישום ל-background sync אם נתמך */
                if ('sync' in reg) {
                    await reg.sync.register('sync-inventory');
                }
            } catch (err) {
                console.warn('[App] Service Worker לא נרשם:', err);
            }
        }
    }

    /* ---- ייצוא פומבי ---- */
    return { boot };
})();

/* ---- הפעלה בטעינת הדף ---- */
document.addEventListener('DOMContentLoaded', () => App.boot());
