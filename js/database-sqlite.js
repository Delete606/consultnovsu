// Инициализация SQL.js
let SQL = null;
let db = null;
let useSQLite = false;

// Загрузка SQL.js
async function initDatabase() {
    try {
        // Пытаемся загрузить SQL.js
        if (typeof initSqlJs !== 'undefined') {
            SQL = await initSqlJs({
                locateFile: file => `js/${file}`
            });
            
            // Пытаемся загрузить сохраненную БД
            const saved = localStorage.getItem('sqliteDB');
            if (saved) {
                const arr = JSON.parse(saved);
                db = new SQL.Database(new Uint8Array(arr));
                console.log('SQLite: база загружена из localStorage');
            } else {
                db = new SQL.Database();
                console.log('SQLite: создана новая база');
            }
            
            createTables();
            insertDemoData();
            useSQLite = true;
            console.log('SQLite успешно инициализирован');
        } else {
            console.log('SQL.js не найден, используем localStorage');
            loadFromLocalStorage();
        }
    } catch(e) {
        console.error('Ошибка SQLite:', e);
        loadFromLocalStorage();
    }
}

// Создание таблиц
function createTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY, name TEXT, surname TEXT, email TEXT UNIQUE,
            password TEXT, phone TEXT DEFAULT '', role TEXT DEFAULT 'student',
            active INTEGER DEFAULT 1
        )
    `);
    db.run(`CREATE TABLE IF NOT EXISTS subjects (name TEXT UNIQUE)`);
    db.run(`
        CREATE TABLE IF NOT EXISTS slots (
            id TEXT PRIMARY KEY, teacher_id TEXT, subject TEXT, date TEXT,
            time_start TEXT, time_end TEXT, format TEXT DEFAULT 'очно',
            room TEXT DEFAULT '', max_students INTEGER DEFAULT 5,
            status TEXT DEFAULT 'active', description TEXT DEFAULT '',
            topics TEXT DEFAULT '[]'
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY, slot_id TEXT, student_id TEXT, topic TEXT,
            status TEXT DEFAULT 'active', attended INTEGER DEFAULT 0,
            cancelled_by TEXT, created_at TEXT
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY, user_id TEXT, related_slot_id TEXT,
            message TEXT, type TEXT DEFAULT 'info', is_read INTEGER DEFAULT 0,
            created_at TEXT
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY, user_id TEXT, subject TEXT,
            status TEXT DEFAULT 'open', messages TEXT DEFAULT '[]',
            created_at TEXT
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS global_topics (
            name TEXT, subject TEXT, duration INTEGER DEFAULT 30,
            PRIMARY KEY (name, subject)
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS teacher_topics (
            teacher_id TEXT, name TEXT, subject TEXT, duration INTEGER DEFAULT 30
        )
    `);
    saveDB();
}

// Вставка демо-данных
function insertDemoData() {
    const count = db.exec("SELECT COUNT(*) FROM users");
    if (count.length > 0 && count[0].values[0][0] > 0) return;
    
    const users = [
        ['u1', 'Иван', 'Петров', 'student@novsu.ru', '123', '+79111234567', 'student', 1],
        ['u2', 'Анна', 'Смирнова', 'anna@student.novsu.ru', '123', '', 'student', 1],
        ['u3', 'Алексей', 'Кириллов', 'teacher@novsu.ru', '123', '', 'teacher', 1],
        ['u4', 'Елена', 'Морозова', 'elena@teacher.novsu.ru', '123', '', 'teacher', 1],
        ['u5', 'Админ', 'Системы', 'admin@novsu.ru', 'admin', '', 'admin', 1]
    ];
    
    users.forEach(u => {
        db.run("INSERT INTO users VALUES (?,?,?,?,?,?,?,?)", u);
    });
    
    ['Математический анализ', 'История России', 'Физика', 'Программирование', 'Английский язык'].forEach(s => {
        db.run("INSERT INTO subjects VALUES (?)", [s]);
    });
    
    db.run("INSERT INTO slots VALUES ('s1','u3','Математический анализ','2026-05-10','10:00','11:30','очно','2307',5,'active','Подготовка к экзамену','[]')");
    db.run("INSERT INTO slots VALUES ('s2','u4','История России','2026-05-11','12:00','13:00','онлайн','',3,'active','','[]')");
    
    db.run("INSERT INTO global_topics VALUES ('Интегралы','Математический анализ',30)");
    db.run("INSERT INTO global_topics VALUES ('Производные','Математический анализ',45)");
    
    saveDB();
}

// Сохранение БД
function saveDB() {
    if (db) {
        const data = db.export();
        const arr = Array.from(data);
        localStorage.setItem('sqliteDB', JSON.stringify(arr));
    }
}

// Загрузка из localStorage (fallback)
function loadFromLocalStorage() {
    const saved = localStorage.getItem('novsuDB');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(DB, data);
    } else {
        initLegacyDB();
    }
}

// Инициализация старой БД
function initLegacyDB() {
    DB.users = [
        { id: 'u1', name: 'Иван', surname: 'Петров', email: 'student@novsu.ru', password: '123', role: 'student', active: true },
        { id: 'u2', name: 'Анна', surname: 'Смирнова', email: 'anna@student.novsu.ru', password: '123', role: 'student', active: true },
        { id: 'u3', name: 'Алексей', surname: 'Кириллов', email: 'teacher@novsu.ru', password: '123', role: 'teacher', active: true },
        { id: 'u4', name: 'Елена', surname: 'Морозова', email: 'elena@teacher.novsu.ru', password: '123', role: 'teacher', active: true },
        { id: 'u5', name: 'Админ', surname: 'Системы', email: 'admin@novsu.ru', password: 'admin', role: 'admin', active: true }
    ];
    DB.slots = [
        { id: 's1', teacherId: 'u3', subject: 'Математический анализ', date: '2026-05-10', timeStart: '10:00', timeEnd: '11:30', format: 'очно', room: '2307', limit: 5, status: 'active', description: '', topics: [] },
        { id: 's2', teacherId: 'u4', subject: 'История России', date: '2026-05-11', timeStart: '12:00', timeEnd: '13:00', format: 'онлайн', room: '', limit: 3, status: 'active', description: '', topics: [] }
    ];
    DB.subjects = ['Математический анализ', 'История России', 'Физика', 'Программирование', 'Английский язык'];
    DB.globalTopics = [{ name: 'Интегралы', subject: 'Математический анализ', duration: 30 }];
    DB.teacherTopics = {};
    DB.bookings = [];
    DB.notifications = [];
    DB.tickets = [];
}

// Объект БД
const DB = {
    users: [], slots: [], bookings: [], notifications: [],
    tickets: [], subjects: [], globalTopics: [], teacherTopics: {},
    
    getUser(id) { return this.users.find(u => u.id === id); },
    getUserByEmail(email) { return this.users.find(u => u.email === email); },
    getSlot(id) { return this.slots.find(s => s.id === id); },
    getTeacherSlots(tid) { return this.slots.filter(s => s.teacherId === tid); },
    getSlotBookings(sid) { return this.bookings.filter(b => b.slotId === sid && b.status === 'active'); },
    getActiveSlots() { return this.slots.filter(s => s.status === 'active'); },
    
    // Сохранение (универсальное)
    save() {
        if (useSQLite && db) {
            // Сохраняем в SQLite
            db.run("DELETE FROM users");
            this.users.forEach(u => {
                db.run("INSERT INTO users VALUES (?,?,?,?,?,?,?,?)",
                    [u.id, u.name, u.surname, u.email, u.password, u.phone||'', u.role, u.active?1:0]);
            });
            saveDB();
        }
        // Всегда сохраняем в localStorage как fallback
        localStorage.setItem('novsuDB', JSON.stringify({
            users: this.users, slots: this.slots, bookings: this.bookings,
            notifications: this.notifications, tickets: this.tickets,
            subjects: this.subjects, globalTopics: this.globalTopics,
            teacherTopics: this.teacherTopics
        }));
    }
};

// Инициализация
initDatabase().then(() => {
    console.log('База данных готова');
});