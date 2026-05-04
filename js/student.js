// В функции bookSlot добавляем:
window.bookSlot = function(slotId) {
    const topic = prompt('Укажите тему вопроса (кратко):', 'Нужна консультация');
    if (!topic) return;
    
    const booking = {
        id: 'b' + Date.now(),
        slotId: slotId,
        studentId: window.currentUser?.id || 'u1',
        topic: topic,
        status: 'active',
        attended: false,
        timestamp: new Date().toISOString()
    };
    
    DB.bookings.push(booking);
    
    // Уведомление студенту
    const slot = DB.getSlot(slotId);
    if (slot) {
        // Уведомление преподавателю
        DB.notifications.push({
            id: 'n' + Date.now(),
            userId: slot.teacherId,
            relatedSlotId: slotId,
            message: `📝 Студент ${window.currentUser.surname} ${window.currentUser.name} записался на консультацию "${slot.subject}" ${formatDate(slot.date)} в ${slot.timeStart}. Тема: ${topic}`,
            type: 'new_booking',
            read: false,
            createdAt: new Date().toISOString()
        });
        
        // Уведомление студенту
        DB.notifications.push({
            id: 'n' + (Date.now() + 1),
            userId: window.currentUser.id,
            message: `✅ Вы записаны на консультацию по ${slot.subject} на ${formatDate(slot.date)} в ${slot.timeStart}`,
            type: 'booking',
            read: false,
            createdAt: new Date().toISOString()
        });
    }
    
    saveDB();
    alert('✅ Вы успешно записаны на консультацию!');
    loadConsultations();
    updateNotifications();
};