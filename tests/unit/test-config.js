/* ===================================================
   test-config.js — בדיקות יחידה ל-config.js
   אחראי על: הגדרות תחנה, מזהה מכשיר, מיקומים
   שייך ל: tests/unit/
   =================================================== */

const TestConfig = (() => {
    const results = [];

    function _assert(name, condition, detail = '') {
        results.push({ name, pass: !!condition, detail });
    }

    /* ---- C1: מצב תחנה ברירת מחדל ---- */
    function testDefaultStation() {
        localStorage.removeItem('ki_station_mode');
        const mode = Config.getStationMode();
        _assert('C1: ברירת מחדל mixed', mode === 'mixed', `got ${mode}`);
    }

    /* ---- C2: שינוי מצב תחנה ---- */
    function testSetStation() {
        Config.setStationMode('entry');
        _assert('C2: שינוי ל-entry', Config.getStationMode() === 'entry');
        Config.setStationMode('exit');
        _assert('C2b: שינוי ל-exit', Config.getStationMode() === 'exit');
        Config.setStationMode('mixed');
    }

    /* ---- C3: מצב לא תקין נדחה ---- */
    function testInvalidStation() {
        Config.setStationMode('mixed');
        Config.setStationMode('invalid_mode');
        _assert('C3: מצב לא תקין', Config.getStationMode() === 'mixed');
    }

    /* ---- C4: Device ID ייחודי ---- */
    function testDeviceId() {
        localStorage.removeItem('ki_device_id');
        const id1 = Config.getDeviceId();
        _assert('C4: Device ID נוצר', id1 && id1.startsWith('dev-'));
        const id2 = Config.getDeviceId();
        _assert('C4b: Device ID עקבי', id1 === id2);
    }

    /* ---- C5: שם מכשיר ---- */
    function testDeviceName() {
        const def = Config.getDeviceName();
        _assert('C5: שם ברירת מחדל', def === 'מכשיר ראשי');
        Config.setDeviceName('טאבלט מטבח');
        _assert('C5b: שינוי שם', Config.getDeviceName() === 'טאבלט מטבח');
        Config.setDeviceName('');
        _assert('C5c: שם ריק -> ברירת מחדל', Config.getDeviceName() === 'מכשיר ראשי');
    }

    /* ---- C6: מיקומים ---- */
    function testLocations() {
        _assert('C6: 3 מיקומים', Object.keys(Config.LOCATIONS).length === 3);
        _assert('C6b: fridge קיים', Config.LOCATIONS.fridge && Config.LOCATIONS.fridge.label === 'מקרר');
        _assert('C6c: freezer קיים', Config.LOCATIONS.freezer && Config.LOCATIONS.freezer.label === 'מקפיא');
        _assert('C6d: pantry קיים', Config.LOCATIONS.pantry && Config.LOCATIONS.pantry.label === 'ארון');
    }

    /* ---- הרצת כל הבדיקות ---- */
    function runAll() {
        results.length = 0;
        testDefaultStation();
        testSetStation();
        testInvalidStation();
        testDeviceId();
        testDeviceName();
        testLocations();
        return results;
    }

    return { runAll, results };
})();
