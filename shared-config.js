// إعدادات مشتركة بين التطبيق الرئيسي وتطبيق المحامي
const SHARED_CONFIG = {
    // حالات الدعوى الموحدة
    CASE_STATUSES: [
        { value: 'مسودة', label: 'مسودة', color: '#6b7280' },
        { value: 'مرفوع', label: 'مرفوع', color: '#3b82f6' },
        { value: 'تحت المراجعة', label: 'تحت المراجعة', color: '#f59e0b' },
        { value: 'في المحكمة', label: 'في المحكمة', color: '#8b5cf6' },
        { value: 'صدور حكم', label: 'صدور حكم', color: '#f97316' },
        { value: 'تبليغ بالحكم', label: 'تبليغ بالحكم', color: '#6366f1' },
        { value: 'تنفيذ', label: 'تنفيذ', color: '#10b981' },
        { value: 'مغلق', label: 'مغلق', color: '#6b7280' }
    ],

    // مراحل الدعوى الموحدة
    CASE_STAGES: [
        { value: 'إعداد الدعوى', label: 'إعداد الدعوى', color: '#6b7280' },
        { value: 'تقييم الدعوى', label: 'تقييم الدعوى', color: '#3b82f6' },
        { value: 'التبليغ', label: 'التبليغ', color: '#f59e0b' },
        { value: 'المرافعة', label: 'المرافعة', color: '#8b5cf6' },
        { value: 'تحت الدراسة', label: 'تحت الدراسة', color: '#f97316' },
        { value: 'صدور حكم', label: 'صدور حكم', color: '#10b981' },
        { value: 'الاستئناف', label: 'الاستئناف', color: '#ef4444' },
        { value: 'التنفيذ', label: 'التنفيذ', color: '#059669' }
    ],

    // أولويات الدعوى
    CASE_PRIORITIES: [
        { value: 'منخفضة', label: 'منخفضة', color: '#10b981' },
        { value: 'متوسطة', label: 'متوسطة', color: '#f59e0b' },
        { value: 'عالية', label: 'عالية', color: '#ef4444' },
        { value: 'عاجلة', label: 'عاجلة', color: '#dc2626' }
    ],

    // مصادر الاستقطاع
    DEDUCTION_SOURCES: [
        { value: 'محكمة البداءة', label: 'محكمة البداءة' },
        { value: 'دائرة التنفيذ', label: 'دائرة التنفيذ' },
        { value: 'محكمة الاستئناف', label: 'محكمة الاستئناف' },
        { value: 'محكمة التمييز', label: 'محكمة التمييز' },
        { value: 'تسوية ودية', label: 'تسوية ودية' },
        { value: 'أخرى', label: 'أخرى' }
    ],

    // أنواع الإشعارات
    NOTIFICATION_TYPES: {
        CASE_STATUS_UPDATE: 'case_status_update',
        CASE_STAGE_UPDATE: 'case_stage_update',
        DEDUCTION_ADDED: 'deduction_added',
        HEARING_REMINDER: 'hearing_reminder',
        DEADLINE_REMINDER: 'deadline_reminder'
    },

    // مصادر التحديث
    UPDATE_SOURCES: {
        MAIN_APP: 'main_app',
        MOBILE_APP: 'mobile_app',
        SYSTEM: 'system'
    },

    // إعدادات المزامنة
    SYNC_SETTINGS: {
        AUTO_REFRESH_INTERVAL: 30000, // 30 ثانية
        UPDATE_RETRY_ATTEMPTS: 3,
        NOTIFICATION_TIMEOUT: 10000 // 10 ثواني
    },

    // دوال مساعدة
    getStatusColor: function(status) {
        const statusObj = this.CASE_STATUSES.find(s => s.value === status);
        return statusObj ? statusObj.color : '#6b7280';
    },

    getStageColor: function(stage) {
        const stageObj = this.CASE_STAGES.find(s => s.value === stage);
        return stageObj ? stageObj.color : '#6b7280';
    },

    getPriorityColor: function(priority) {
        const priorityObj = this.CASE_PRIORITIES.find(p => p.value === priority);
        return priorityObj ? priorityObj.color : '#10b981';
    },

    formatUpdateMessage: function(update) {
        switch (update.type) {
            case this.NOTIFICATION_TYPES.CASE_STATUS_UPDATE:
                return `تم تحديث حالة الدعوى ${update.caseNumber}\nالحالة الجديدة: ${update.newStatus}\nالمرحلة: ${update.newStage}`;
            case this.NOTIFICATION_TYPES.DEDUCTION_ADDED:
                return `تم إضافة استقطاع جديد للدعوى ${update.caseNumber}\nالمبلغ: ${update.amount} د.ع`;
            default:
                return `تحديث جديد للدعوى ${update.caseNumber}`;
        }
    },

    // التحقق من صحة البيانات
    validateCaseData: function(caseData) {
        const errors = [];
        
        if (!caseData.caseNumber) {
            errors.push('رقم الدعوى مطلوب');
        }
        
        if (!caseData.status || !this.CASE_STATUSES.find(s => s.value === caseData.status)) {
            errors.push('حالة الدعوى غير صحيحة');
        }
        
        if (!caseData.stage || !this.CASE_STAGES.find(s => s.value === caseData.stage)) {
            errors.push('مرحلة الدعوى غير صحيحة');
        }
        
        if (!caseData.lawyerName) {
            errors.push('اسم المحامي مطلوب');
        }
        
        return errors;
    }
};

// تصدير الكائن للاستخدام في كلا التطبيقين
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SHARED_CONFIG;
} else if (typeof window !== 'undefined') {
    window.SHARED_CONFIG = SHARED_CONFIG;
}
