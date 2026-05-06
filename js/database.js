if (typeof DB === 'undefined') {
    var DB = {
        users: [],
        slots: [],
        bookings: [],
        notifications: [],
        tickets: [],
        subjects: [],
        globalTopics: [],
        teacherTopics: {},
        
        getUser: function(id) { return this.users.find(u => u.id === id); },
        getUserByEmail: function(email) { return this.users.find(u => u.email === email); },
        getSlot: function(id) { return this.slots.find(s => s.id === id); },
        getTeacherSlots: function(teacherId) { return this.slots.filter(s => s.teacherId === teacherId); },
        getSlotBookings: function(slotId) { return this.bookings.filter(b => b.slotId === slotId && b.status === 'active'); },
        getStudentBookings: function(studentId) { return this.bookings.filter(b => b.studentId === studentId); },
        getActiveSlots: function() { return this.slots.filter(s => s.status === 'active'); }
    };
}

function initDatabase() {
    DB.users = [
        { id: 'u1', name: 'Иван', surname: 'Петров', email: 'student@novsu.ru', password: '123', role: 'student', active: true, phone: '+79111234567' },
        { id: 'u2', name: 'Анна', surname: 'Смирнова', email: 'anna@student.novsu.ru', password: '123', role: 'student', active: true, phone: '+79217654321' },
        { id: 'u3', name: 'Алексей', surname: 'Кириллов', email: 'teacher@novsu.ru', password: '123', role: 'teacher', active: true, phone: '+79301234567' },
        { id: 'u4', name: 'Елена', surname: 'Морозова', email: 'elena@teacher.novsu.ru', password: '123', role: 'teacher', active: true, phone: '+79451234567' },
        { id: 'u5', name: 'Админ', surname: 'Системы', email: 'admin@novsu.ru', password: 'admin', role: 'admin', active: true, phone: '+79001234567' }
    ];
    
    DB.subjects = ['Математический анализ', 'История России', 'Физика', 'Программирование', 'Английский язык'];
    
    DB.globalTopics = [
        { name: 'Интегралы', subject: 'Математический анализ', timeStart: '10:00', timeEnd: '10:30', duration: 30 },
        { name: 'Производные', subject: 'Математический анализ', timeStart: '10:30', timeEnd: '11:00', duration: 30 },
        { name: 'Реформы Петра', subject: 'История России', timeStart: '12:00', timeEnd: '12:20', duration: 20 }
    ];
    
    DB.teacherTopics = {
        'u3': [
            { name: 'Пределы', subject: 'Математический анализ', timeStart: '14:00', timeEnd: '14:30', duration: 30 }
        ]
    };
    
    DB.slots = [
        { id: 's1', teacherId: 'u3', subject: 'Математический анализ', date: '2026-05-07', timeStart: '10:00', timeEnd: '11:30', format: 'очно', room: '2307', limit: 5, status: 'active', description: 'Подготовка к экзамену', topics: [
            { name: 'Интегралы', subject: 'Математический анализ', timeStart: '10:00', timeEnd: '10:30', duration: 30 },
            { name: 'Производные', subject: 'Математический анализ', timeStart: '10:30', timeEnd: '11:00', duration: 30 }
        ]},
        { id: 's2', teacherId: 'u4', subject: 'История России', date: '2026-05-08', timeStart: '12:00', timeEnd: '13:00', format: 'онлайн', room: '', limit: 3, status: 'active', description: 'Консультация по курсовым', topics: [
            { name: 'Реформы Петра', subject: 'История России', timeStart: '12:00', timeEnd: '12:20', duration: 20 }
        ]},
        { id: 's3', teacherId: 'u3', subject: 'Математический анализ', date: '2026-05-09', timeStart: '14:00', timeEnd: '15:30', format: 'очно', room: '2210', limit: 2, status: 'active', description: '', topics: [
            { name: 'Пределы', subject: 'Математический анализ', timeStart: '14:00', timeEnd: '14:30', duration: 30 }
        ]}
    ];
    
    DB.bookings = [
        { id: 'b1', slotId: 's1', studentId: 'u1', topic: 'Интегралы', status: 'active', attended: false, cancelledBy: null, timestamp: '2026-05-03T10:00:00' },
        { id: 'b2', slotId: 's2', studentId: 'u1', topic: 'Реформы Петра I', status: 'active', attended: false, cancelledBy: null, timestamp: '2026-05-04T14:30:00' }
    ];
    
    DB.notifications = [
        { id: 'n1', userId: 'u3', relatedSlotId: 's1', message: 'Студент Иван Петров записался на консультацию "Математический анализ" 7 мая', type: 'booking', read: false, createdAt: '2026-05-06T10:00:00' },
        { id: 'n2', userId: 'u1', message: 'Напоминание: завтра консультация по Математическому анализу в 10:00', type: 'reminder', read: false, createdAt: '2026-05-06T10:00:00' }
    ];
    
    DB.tickets = [];
}

function saveDB() {
    try {
        const data = {
            users: DB.users,
            slots: DB.slots,
            bookings: DB.bookings,
            notifications: DB.notifications,
            tickets: DB.tickets || [],
            subjects: DB.subjects || [],
            globalTopics: DB.globalTopics || [],
            teacherTopics: DB.teacherTopics || {}
        };
        localStorage.setItem('novsuDB', JSON.stringify(data));
        console.log('База данных сохранена');
    } catch(e) {
        console.error('Ошибка сохранения:', e);
    }
}

function loadDB() {
    try {
        const saved = localStorage.getItem('novsuDB');
        if (saved) {
            const data = JSON.parse(saved);
            DB.users = data.users || [];
            DB.slots = data.slots || [];
            DB.bookings = data.bookings || [];
            DB.notifications = data.notifications || [];
            DB.tickets = data.tickets || [];
            DB.subjects = data.subjects || [];
            DB.globalTopics = data.globalTopics || [];
            DB.teacherTopics = data.teacherTopics || {};
            
            if (!DB.users.length) {
                console.log('База данных пуста, инициализируем...');
                initDatabase();
                saveDB();
            }
        } else {
            console.log('Нет сохраненных данных, инициализируем...');
            initDatabase();
            saveDB();
        }
    } catch(e) {
        console.error('Ошибка загрузки базы данных:', e);
        initDatabase();
        saveDB();
    }
}

loadDB();
console.log('База данных загружена. Пользователей:', DB.users.length, 'Глобальных тем:', DB.globalTopics ? DB.globalTopics.length : 0);