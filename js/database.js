if (typeof DB === 'undefined') {
    var DB = {
        users: [],
        slots: [],
        bookings: [],
        notifications: [],
        tickets: [],
        subjects: [],
        
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
        { id: 'u1', name: 'Иван', surname: 'Петров', email: 'student@novsu.ru', password: '123', role: 'student', active: true },
        { id: 'u2', name: 'Анна', surname: 'Смирнова', email: 'anna@student.novsu.ru', password: '123', role: 'student', active: true },
        { id: 'u3', name: 'Алексей', surname: 'Кириллов', email: 'teacher@novsu.ru', password: '123', role: 'teacher', active: true },
        { id: 'u4', name: 'Елена', surname: 'Морозова', email: 'elena@teacher.novsu.ru', password: '123', role: 'teacher', active: true },
        { id: 'u5', name: 'Админ', surname: 'Системы', email: 'admin@novsu.ru', password: 'admin', role: 'admin', active: true }
    ];
    
    DB.subjects = ['Математический анализ', 'История России', 'Физика', 'Программирование', 'Английский язык'];
    
    DB.slots = [
        { id: 's1', teacherId: 'u3', subject: 'Математический анализ', date: '2026-05-07', timeStart: '10:00', timeEnd: '11:30', format: 'очно', room: '2307', limit: 5, status: 'active', description: 'Подготовка к экзамену' },
        { id: 's2', teacherId: 'u4', subject: 'История России', date: '2026-05-08', timeStart: '12:00', timeEnd: '13:00', format: 'онлайн', room: '', limit: 3, status: 'active', description: 'Консультация по курсовым' },
        { id: 's3', teacherId: 'u3', subject: 'Математический анализ', date: '2026-05-09', timeStart: '14:00', timeEnd: '15:30', format: 'очно', room: '2210', limit: 2, status: 'active', description: '' }
    ];
    
    DB.bookings = [
        { id: 'b1', slotId: 's1', studentId: 'u1', topic: 'Интегралы', status: 'active', attended: false, cancelledBy: null, timestamp: '2026-05-03T10:00:00' },
        { id: 'b2', slotId: 's2', studentId: 'u1', topic: 'Реформы Петра I', status: 'active', attended: false, cancelledBy: null, timestamp: '2026-05-04T14:30:00' }
    ];
    
    DB.notifications = [
        { id: 'n1', userId: 'u3', relatedSlotId: 's1', message: '📝 Студент Иван Петров записался на консультацию "Математический анализ" 7 мая', type: 'booking', read: false, createdAt: '2026-05-06T10:00:00' },
        { id: 'n2', userId: 'u1', message: '🔔 Напоминание: завтра консультация по Математическому анализу в 10:00', type: 'reminder', read: false, createdAt: '2026-05-06T10:00:00' }
    ];
    
    DB.tickets = [
        {
            id: 't1', userId: 'u1', subject: 'Проблема с записью',
            messages: [
                { sender: 'user', text: 'Здравствуйте! Не могу записаться на консультацию по физике.', timestamp: '2026-05-05T09:00:00' },
                { sender: 'admin', text: 'Здравствуйте! Проверьте, возможно, все места уже заняты.', timestamp: '2026-05-05T09:30:00' }
            ],
            status: 'open', createdAt: '2026-05-05T09:00:00'
        }
    ];
}

function saveDB() {
    try {
        const data = {
            users: DB.users,
            slots: DB.slots,
            bookings: DB.bookings,
            notifications: DB.notifications,
            tickets: DB.tickets || [],
            subjects: DB.subjects || []
        };
        localStorage.setItem('novsuDB', JSON.stringify(data));
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
            DB.subjects = data.subjects || ['Математический анализ', 'История России', 'Физика', 'Программирование', 'Английский язык'];
            
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
console.log('База данных загружена. Пользователей:', DB.users.length, 'Тикетов:', DB.tickets ? DB.tickets.length : 0);