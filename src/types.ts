export interface Student {
  id: string;
  name: string; // نام داوطلب آزمون‌های عالی ارشد و دکتری تخصصی سامانه آزمونیار
  code: string; // شماره داوطلبی یا شناسه کاربری
  field: "elec_master" | "elec_phd" | "comp_master" | "mba_master"; // رشته‌های هدف آزمون عالی: کارشناسی ارشد مهندسی برق (elec_master)، دکتری تخصصی مهندسی برق (elec_phd)، کارشناسی ارشد مهندسی کامپیوتر هوش مصنوعی (comp_master)، کارشناسی ارشد مدیریت MBA (mba_master)
  grade: string; // رتبه حدودی، گرایش یا دوره هدف آموزشی (مثلا "شریف - گرایش کنترل - تراز تخمینی ۹,۸۰۰")
}

export interface Exam {
  id: string;
  date: string; // تاریخ برگزاری آزمون آزمایشی سامانه آزمونیار
  title: string; // عنوان آزمون (مثلا "شبیه‌ساز جامع کنکور سراسری شماره ۱")
  traz: number; // تراز علمی داوطلب (بین ۴۰۰۰ تا ۱۲۰۰0)
  rank: number; // رتبه داوطلب در کل کشور
  overallPercentage: number; // میانگین درصد پاسخگویی داوطلب (%)
  lessons: LessonDetail[]; // جزئیات درصد ممیزی درس‌ها
  // PhD Specific Assessments (Optional)
  resumeScore?: number; // نمره ارزیابی سوابق علمی و پژوهشی (رزومه) - مخصوص دکتری تخصصی
  interviewScore?: number; // نمره مصاحبه و ارزیابی شفاهی (Meeting Exam) - مخصوص دکتری تخصصی
  researchPotential?: number; // پتانسیل تولید علم و مقالات - مخصوص دکتری تخصصی
}

export interface LessonDetail {
  lessonName: string; // نام درس کنکور (مثلا "زيست‌شناسی"، "حسابان"، "فیزیک")
  percentage: number; // درصد پاسخگویی درس مربوطه
  correct: number; // تعداد تست‌های پاسخ صحیح
  wrong: number; // تعداد تست‌های پاسخ غلط (نمره منفی)
  empty: number; // تعداد تست‌های بدون پاسخ (نزده)
}

export interface Weakness {
  topic: string; // مبحث درسی ضعیف (مثلا "روابط همبستگی زیست" یا "مشتق و کاربرد آن")
  subject: string; // نام درس تخصصی آسیب‌دیده
  percentage: number; // سطح تسلط فعلی داوطلب در این مبحث
  recommendation: string; // توصیه مربیان سامانه آزمونیار جهت اصلاح علمی و حذف تله تستی
  questionsCount: number; // تعداد تست‌های تمرینی پیشنهادی در آزمون بعدی جهت غلبه بر چالش
  severity: "critical" | "warning" | "mild"; // میزان اضطرار رفع اشکال علمی
}

export interface PsychologicalAnalysis {
  pattern: string; // الگوی فرسودگی ذهنی یا اضطراب آزمون (مثلا "وسواس فکری پاسخ غلط"، "نوسان تمرکز در زمان خستگی")
  description: string; // تحلیل روانشناختی و برنامه‌ریزی مربیان سامانه آزمونیار درباره ریتم مطالعاتی داوطلب
  correctToWrongRate: number; // درصد پاسخ‌های نادرست به سوالات کل آزمون (%)
  suggestion: string; // پیشنهاد تخصصی افزایش تاب‌آوری روحی و شگردهای آرامش متمرکز
  cardColor: "red" | "orange" | "amber" | "blue";
  stressLevel: number; // سطح اضطراب و خستگی ذهنی داوطلب (۰-۱۰۰)
  stressAnalysis: {
    avgResponseTimeWrong: number; // متوسط زمان هدررفته روی سوال‌های دارای پاسخ غلط (ثانیه)
    avgResponseTimeCorrect: number; // متوسط زمان ثبت پاسخ صحیح هر تست (ثانیه)
    consecutiveErrorsCount: number; // توالی خطاهای مکرر در دور آخر به دلیل فرسودگی توجه داوطلب
    stressLabel: "بحرانی" | "متوسط" | "سالم" | "خفیف"; // برآورد وضعیت روحی/بهداشت ذهنی
    technicalDetail: string; // شرح فنی علائم استرس و تعادل مطالعاتی داوطلب
  };
}

export interface DailyPlan {
  day: string; // روز هفته برای برنامه مطالعاتی و مربی‌گری
  morningPlan: string; // برنامه مطالعاتی فشرده شیفت صبح (تحلیل کتب مرجع مهندسی و حل تست‌های مفهومی)
  afternoonPlan: string; // برنامه حل تست‌های زمان‌دار و بررسی دفترچه پاسخ تشریحی شیفت عصر
  totalQuestions: number; // تعداد هدف تستی تالیفی یا شناسنامه‌دار آن روز داوطلب
  completed?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface SystemLog {
  id: string;
  action: string; // نام عملیات (مثلاً ایجاد حساب یا کایزن)
  username: string; // نام کاربری انجام دهنده
  timestamp: string; // زمان دقیق ثبت لاگ
  detail: string; // جزئیات عملیات سیستمی
}

export interface TestTrap {
  id: string;
  questionTitle: string; // عنوان یا صورت سوال تستی کنکور
  subject: string; // نام درس (مثلاً زیست‌شناسی یا فیزیک)
  category: "مفهومی" | "فرمول‌محور" | "زمان‌بر" | "اشتباه_محاسباتی"; // دسته‌بندی تله تستی کنکور
  trapType: string; // نوع تله (مثلاً تله گزینه‌های دام‌دار، تله فرمول اشتباه)
  correctAnswer: string; // پاسخ صحیح مستند به مراجع درسی
  userMistake: string; // اشتباه داوطلب و دلیل آن
  technicalNote: string; // نکته تستی طلایی و علمی جهت مرور سریع محتوا
  importance: "high" | "medium" | "low"; // میزان اهمیت برای شب آزمون
  createdAt: string;
}

export interface ParentingAlert {
  id: string;
  type: "success" | "warning" | "info";
  message: string; // پیام‌های مدیریتی نظارت والدین یا مربیان ناظر ارشد بر یادگیری فرزندان
  date: string;
}
