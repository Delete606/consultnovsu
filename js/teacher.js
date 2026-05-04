window.currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== Загрузка страницы преподавателя ===');
    
    const teacherNameEl = document.getElementById('teacherName');
    const dashboardTab = document.getElementById('dashboardTab');
    const createSlotTab = document.getElementById('createSlotTab');
    
    console.log('teacherNameEl найден:', !!teacherNameEl);
    console.log('dashboardTab найден:', !!dashboardTab);
    console.log('createSlotTab найден:', !!createSlotTab);
    
    if (!teacherNameEl && !dashboardTab) {
        console.log('Не на странице преподавателя');
        return;
    }
    
    const user = checkAuth(['teacher']);
    if (!user) {
        console.log('Не авторизован');
        return;
    }
    
    window.currentUser = user;
    if (teacherNameEl) teacherNameEl.textContent = `${user.surname} ${user.name}`;
    
    console.log('Пользователь:', user);
    
    // Кнопка выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = function(e) {
            e.preventDefault();
            logout();
        };
    }
    
    // Инициализация вкладок
    initTeacherTabs();
    
    // Загружаем данные
    loadDashboard();
    
    // Форма создания слота
    const createForm = document.getElementById('createSlotForm');
    console.log('createSlotForm найден:', !!createForm);
    
    if (createForm) {
        createForm.onsubmit = function(e) {
            e.preventDefault();
            console.log('=== Отправка формы создания слота ===');
            createSlot();
        };
    }
    
    console.log('=== Инициализация завершена ===');
});

function initTeacherTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    console.log('Найдено вкладок:', tabs.length);
    
    tabs.forEach((tab, index) => {
        const tabName = tab.getAttribute('data-tab');
        console.log(`Вкладка ${index}: ${tabName}`);
        
        tab.onclick = function(e) {
            e.preventDefault();
            console.log(`=== Клик по вкладке: ${tabName} ===`);
            
            // Убираем active у всех
            tabs.forEach(t => t.classList.remove('active'));
            // Добавляем active текущей
            this.classList.add('active');
            
            // Скрываем все секции
            const allSections = document.querySelectorAll('.tab-content');
            console.log('Всего секций:', allSections.length);
            
            allSections.forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
            });
            
            // Показываем нужную секцию
            const targetId = tabName + 'Tab';
            const targetSection = document.getElementById(targetId);
            
            console.log('Ищем секцию:', targetId, 'найдена:', !!targetSection);
            
            if (targetSection) {
                targetSection.classList.add('active');
                targetSection.style.display = 'block';
                console.log(`Секция ${targetId} показана`);
                
                // Загружаем данные
                switch(tabName) {
                    case 'dashboard':
                        loadDashboard();
                        break;
                    case 'create-slot':
                        console.log('Переход на форму создания');
                        break;
                    case 'manage-bookings':
                        loadTeacherBookings();
                        break;
                    case 'statistics':
                        loadStatistics();
                        break;
                }
            } else {
                console.error('Секция не найдена:', targetId);
            }
        };
    });
}

function loadDashboard() {
    console.log('Загрузка дашборда...');
    
    const teacherId = window.currentUser?.id || 'u3';
    const slots = DB.getTeacherSlots(teacherId);
    const activeSlots = slots.filter(s => s.status === 'active');
    
    document.getElementById('totalSlots').textContent = slots.length;
    
    let totalBookings = 0;
    slots.forEach(s => {
        totalBookings += DB.getSlotBookings(s.id).length;
    });
    document.getElementById('totalBookings').textContent = totalBookings;
    
    const today = new Date().toISOString().split('T')[0];
    const todaySlots = activeSlots.filter(s => s.date === today);
    document.getElementById('todaySlots').textContent = todaySlots.length;
    
    const container = document.getElementById('upcomingSlots');
    if (!container) return;
    
    const upcoming = activeSlots
        .filter(s => s.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5);
    
    if (upcoming.length > 0) {
        container.innerHTML = '<h3>Ближайшие консультации</h3>' + upcoming.map(slot => {
            const bookings = DB.getSlotBookings(slot.id);
            return `
                <div class="card" style="padding: 15px;">
                    <strong>${slot.subject}</strong> - ${formatDate(slot.date)}<br>
                    ${slot.timeStart}-${slot.timeEnd} | Записано: ${bookings.length}/${slot.limit}
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML = '<h3>Ближайшие консультации</h3><div class="card" style="padding: 15px;"><p>Нет предстоящих консультаций</p></div>';
    }
}

function createSlot() {
    console.log('Создание слота...');
    
    const subject = document.getElementById('slotSubject')?.value;
    const format = document.getElementById('slotFormat')?.value;
    const date = document.getElementById('slotDate')?.value;
    const timeStart = document.getElementById('slotTimeStart')?.value;
    const timeEnd = document.getElementById('slotTimeEnd')?.value;
    const room = document.getElementById('slotRoom')?.value;
    const limit = parseInt(document.getElementById('slotLimit')?.value || '5');
    const description = document.getElementById('slotDescription')?.value || '';
    
    console.log('Данные формы:', { subject, format, date, timeStart, timeEnd, room, limit, description });
    
    if (!subject || !date || !timeStart || !timeEnd) {
        alert('❌ Заполните все обязательные поля (предмет, дата, время)!');
        return;
    }
    
    const slot = {
        id: 's' + Date.now(),
        teacherId: window.currentUser?.id || 'u3',
        subject: subject,
        date: date,
        timeStart: timeStart,
        timeEnd: timeEnd,
        format: format || 'очно',
        room: room || '',
        limit: limit,
        status: 'active',
        description: description
    };
    
    DB.slots.push(slot);
    saveDB();
    
    console.log('Слот создан:', slot);
    alert('✅ Консультация успешно создана!');
    
    // Очищаем форму
    const form = document.getElementById('createSlotForm');
    if (form) form.reset();
    
    // Обновляем дашборд
    loadDashboard();
}

function loadTeacherBookings() {
    console.log('Загрузка записей...');
    
    const container = document.getElementById('teacherSlotsList');
    if (!container) return;
    
    const teacherId = window.currentUser?.id || 'u3';
    const slots = DB.getTeacherSlots(teacherId);
    
    if (slots.length === 0) {
        container.innerHTML = '<div class="card" style="padding: 20px; text-align: center;"><p>У вас пока нет консультаций</p></div>';
        return;
    }
    
    container.innerHTML = slots.map(slot => {
        const bookings = DB.getSlotBookings(slot.id);
        const statusText = slot.status === 'active' ? '🟢 Активна' : 
                          slot.status === 'cancelled' ? '🔴 Отменена' : '🔵 Завершена';
        
        return `
            <div class="card" style="margin-bottom: 15px;">
                <h3>${slot.subject} - ${formatDate(slot.date)}</h3>
                <p><strong>Время:</strong> ${slot.timeStart}-${slot.timeEnd} | <strong>Формат:</strong> ${slot.format} ${slot.room ? '| Ауд. ' + slot.room : ''}</p>
                <p><strong>Статус:</strong> ${statusText}</p>
                <p><strong>Записано студентов: ${bookings.length}/${slot.limit}</strong></p>
                
                ${bookings.length > 0 ? `
                    <h4 style="margin-top: 15px;">Список записавшихся:</h4>
                    ${bookings.map(b => {
                        const student = DB.getUser(b.studentId);
                        return `
                            <div class="student-item">
                                <div>
                                    <strong>${student ? student.surname + ' ' + student.name : 'Неизвестный'}</strong>
                                    <br><small>Тема: ${b.topic || 'Не указана'}</small>
                                </div>
                                <button class="btn-sm" onclick="window.markAttendance('${b.id}')" type="button" style="background: ${b.attended ? '#0f6e3f' : '#0056a7'}; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
                                    ${b.attended ? '✅ Присутствовал' : '⬜ Отметить явку'}
                                </button>
                            </div>
                        `;
                    }).join('')}
                ` : '<p style="margin-top: 10px; color: #666;">Нет записавшихся студентов</p>'}
                
                ${slot.status === 'active' ? 
                    '<button class="btn-danger btn-sm" onclick="window.cancelSlot(\'' + slot.id + '\')" type="button" style="margin-top: 15px;">❌ Отменить консультацию</button>' : 
                    ''}
            </div>
        `;
    }).join('');
}

window.markAttendance = function(bookingId) {
    const booking = DB.bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.attended = !booking.attended;
        saveDB();
        loadTeacherBookings();
    }
};

window.cancelSlot = function(slotId) {
    if (confirm('Вы уверены, что хотите отменить консультацию?')) {
        const slot = DB.getSlot(slotId);
        if (slot) {
            slot.status = 'cancelled';
            DB.bookings.forEach(b => {
                if (b.slotId === slotId) b.status = 'cancelled';
            });
            saveDB();
            loadTeacherBookings();
            loadDashboard();
            alert('Консультация отменена');
        }
    }
};

function loadStatistics() {
    console.log('Загрузка статистики...');
    
    const teacherId = window.currentUser?.id || 'u3';
    const slots = DB.getTeacherSlots(teacherId);
    
    const weekdayStats = {};
    const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    
    slots.forEach(slot => {
        try {
            const date = new Date(slot.date);
            const dayName = dayNames[date.getDay()];
            weekdayStats[dayName] = (weekdayStats[dayName] || 0) + 1;
        } catch(e) {}
    });
    
    const weekdayContainer = document.getElementById('weekdayStats');
    if (weekdayContainer) {
        weekdayContainer.innerHTML = Object.entries(weekdayStats).length > 0 ?
            Object.entries(weekdayStats).map(([day, count]) => 
                `<div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                    <span>${day}</span>
                    <span><strong>${count} конс.</strong></span>
                </div>`
            ).join('') : '<p>Нет данных</p>';
    }
    
    let attended = 0, total = 0;
    DB.bookings.forEach(b => {
        if (slots.some(s => s.id === b.slotId)) {
            total++;
            if (b.attended) attended++;
        }
    });
    
    const attendanceContainer = document.getElementById('attendanceStats');
    if (attendanceContainer) {
        const percentage = total > 0 ? Math.round(attended/total*100) : 0;
        attendanceContainer.innerHTML = `
            <p><strong>Всего записей:</strong> ${total}</p>
            <p><strong>Присутствовало:</strong> ${attended}</p>
            <p><strong>Не пришло:</strong> ${total - attended}</p>
            <div style="background: #eee; border-radius: 10px; height: 20px; margin-top: 10px;">
                <div style="width: ${percentage}%; background: #0f6e3f; height: 100%; border-radius: 10px;"></div>
            </div>
            <p style="text-align: center; margin-top: 5px;"><strong>Явка: ${percentage}%</strong></p>
        `;
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch(e) {
        return dateString;
    }
}