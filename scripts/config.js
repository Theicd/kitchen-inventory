/* ===================================================
   config.js — הגדרות מערכת ותחנה
   אחראי על: הגדרות API, מצב תחנה, שם מכשיר, קבועים
   שייך ל: כל המודולים — נטען ראשון
   =================================================== */

const Config = (() => {
    /* ---- קבועים ---- */
    const DB_NAME = 'KitchenInventoryDB';
    const DB_VERSION = 1;
    const API_BASE = ''; /* ריק = מקומי בלבד ב-MVP */

    /* מפתחות localStorage */
    const KEY_STATION_MODE = 'ki_station_mode';
    const KEY_DEVICE_NAME = 'ki_device_name';
    const KEY_DEVICE_ID = 'ki_device_id';

    /* ---- מצב תחנה (entry / exit / mixed) ---- */
    function getStationMode() {
        return localStorage.getItem(KEY_STATION_MODE) || 'mixed';
    }

    function setStationMode(mode) {
        if (!['entry', 'exit', 'mixed'].includes(mode)) return;
        localStorage.setItem(KEY_STATION_MODE, mode);
        /* עדכון UI של כפתורי תחנה */
        document.querySelectorAll('.station-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        UI.toast(`מצב תחנה: ${mode === 'entry' ? 'כניסה' : mode === 'exit' ? 'יציאה' : 'משולב'}`, 'info');
    }

    /* ---- שם מכשיר ---- */
    function getDeviceName() {
        return localStorage.getItem(KEY_DEVICE_NAME) || 'מכשיר ראשי';
    }

    function setDeviceName(name) {
        localStorage.setItem(KEY_DEVICE_NAME, name || 'מכשיר ראשי');
    }

    /* ---- מזהה מכשיר — ייחודי אוטומטי ---- */
    function getDeviceId() {
        let id = localStorage.getItem(KEY_DEVICE_ID);
        if (!id) {
            id = 'dev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
            localStorage.setItem(KEY_DEVICE_ID, id);
        }
        return id;
    }

    /* ---- מיקומים אפשריים ---- */
    const LOCATIONS = {
        fridge: { label: 'מקרר', icon: '🧊' },
        freezer: { label: 'מקפיא', icon: '❄️' },
        pantry: { label: 'ארון', icon: '🗄️' },
        cleaning: { label: 'ניקיון', icon: '🧹' }
    };

    /* ---- ייצוא פומבי ---- */
    return {
        DB_NAME,
        DB_VERSION,
        API_BASE,
        LOCATIONS,
        getStationMode,
        setStationMode,
        getDeviceName,
        setDeviceName,
        getDeviceId
    };
})();
