/* ===================================================
   sync.js — סנכרון פעולות offline
   אחראי על: שליחת פעולות ממתינות, ניקוי תור, אירועי רשת
   שייך ל: store.js (offline_queue), api.js (syncBatch)
   =================================================== */

const Sync = (() => {

    let isSyncing = false;

    /* ---- אתחול — האזנה לשינויי רשת ---- */
    function init() {
        /* כשהרשת חוזרת — ננסה לסנכרן */
        window.addEventListener('online', () => {
            console.log('[Sync] רשת חזרה — מתחיל סנכרון');
            UI.toast('הרשת חזרה — מסנכרן...', 'info');
            syncPending();
        });

        window.addEventListener('offline', () => {
            console.log('[Sync] אין רשת — מצב offline');
            UI.toast('אין רשת — פעולות נשמרות מקומית', 'info');
        });

        /* האזנה להודעות מ-Service Worker */
        if (navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SYNC_NOW') {
                    syncPending();
                }
            });
        }
    }

    /* ---- סנכרון כל הפעולות הממתינות ---- */
    async function syncPending() {
        if (isSyncing) return;
        if (!Api.isOnline()) return;

        isSyncing = true;
        try {
            const pending = await Store.getPendingOfflineActions();
            if (pending.length === 0) {
                isSyncing = false;
                return;
            }

            console.log(`[Sync] ${pending.length} פעולות ממתינות לסנכרון`);

            /* ב-MVP — עובדים מקומית, אז פשוט נסמן כמסונכרנות */
            /* כשיהיה שרת: Api.syncBatch(pending) */
            for (const action of pending) {
                await Store.markSynced(action.id);
            }

            /* ניקוי פעולות שסונכרנו */
            const cleared = await Store.clearSyncedActions();
            console.log(`[Sync] ${cleared} פעולות נוקו מהתור`);

            UI.toast(`סונכרנו ${pending.length} פעולות`, 'success');
        } catch (err) {
            console.error('[Sync] שגיאה בסנכרון:', err);
        } finally {
            isSyncing = false;
        }
    }

    /* ---- הוספת פעולה לתור ---- */
    async function queueAction(action) {
        await Store.addToOfflineQueue(action);
        console.log('[Sync] פעולה נוספה לתור offline:', action.action_type);

        /* אם אונליין — נסנכרן מיד */
        if (Api.isOnline()) {
            setTimeout(() => syncPending(), 500);
        }
    }

    /* ---- מספר פעולות ממתינות ---- */
    async function getPendingCount() {
        const pending = await Store.getPendingOfflineActions();
        return pending.length;
    }

    /* ---- ייצוא פומבי ---- */
    return {
        init,
        syncPending,
        queueAction,
        getPendingCount
    };
})();
