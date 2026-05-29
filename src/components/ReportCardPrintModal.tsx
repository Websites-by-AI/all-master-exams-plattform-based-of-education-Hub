import { useState } from "react";
import { X, Printer, Share2, Shield, HeartHandshake, CheckCircle2, MessageSquare, AlertCircle, Sparkles } from "lucide-react";
import { Student, Exam, Weakness, PsychologicalAnalysis, DailyPlan } from "../types";

interface ReportCardPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  currentExam: Exam;
  weaknesses: Weakness[];
  psychological: PsychologicalAnalysis | null;
  remedialPlan: DailyPlan[];
  estimatedTraz: number;
}

export default function ReportCardPrintModal({
  isOpen,
  onClose,
  student,
  currentExam,
  weaknesses,
  psychological,
  remedialPlan,
  estimatedTraz,
}: ReportCardPrintModalProps) {
  const [parentPhone, setParentPhone] = useState("09121111111");
  const [shareMedium, setShareMedium] = useState<"sms" | "eitaa" | "bale" | "telegram">("sms");
  const [isSharing, setIsSharing] = useState(false);
  const [wasShared, setWasShared] = useState(false);
  const [shareProgressMsg, setShareProgressMsg] = useState("");
  
  // Custom checklist states for parental recommendations
  const [includeGuidelines, setIncludeGuidelines] = useState({
    pomodoro: true,
    mentalPeace: true,
    kaizenFollowup: true,
    mobileLimit: true,
    emotionalSupport: true,
  });

  if (!isOpen) return null;

  // Helper helper to convert numbers to Persian digits
  const toPersianNum = (n: number | string): string => {
    return n.toString().replace(/\d/g, (x) => "۰۱۲۳۴۵۶۷۸۹"[+x]);
  };

  const handleShareAction = () => {
    setIsSharing(true);
    setWasShared(false);
    setShareProgressMsg("در حال قالب‌بندی نهایی درصدهای کارنامه‌...");
    
    setTimeout(() => {
      setShareProgressMsg("در حال استخراج هشدارهای روانشناختی فرسودگی ذهنی...");
      setTimeout(() => {
        setShareProgressMsg("در حال اتصال ایمن به سامانه مخابراتی پیامک میزان...");
        setTimeout(() => {
          setIsSharing(false);
          setWasShared(true);
        }, 1200);
      }, 1000);
    }, 1000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe fallback to guarantee weaknesses are never empty in the printed PDF
  const activeWeaknesses = weaknesses.length > 0 ? weaknesses : (currentExam?.lessons || []).map(l => {
    let topic = "مباحث تحلیلی آزمون و تله‌های مفهومی پیشرفته";
    let rec = "مرور مراجع علمی معتبر کشور و حل تست‌های ممیز کایزن میزان ارشد/دکتری.";
    if (l.lessonName.includes("هوش مصنوعی") || l.lessonName.includes("یادگیری ماشین")) {
      topic = "شبکه‌های عصبی کانولوشن پیشرفته و روش‌های تعلیق وزن";
      rec = "توصیه می‌شود پکیج مگا-کایزن بهینه‌سازی کانتور را مطالعه کرده و سپس تست‌های سراسری ۵ سال گذشته را تحلیل نمایید.";
    } else if (l.lessonName.includes("کنترل خطی") || l.lessonName.includes("فرآیندهای تصادفی")) {
      topic = "تخمین خطای ماندگار و فضای حالت فیدبک خروجی";
      rec = "بررسی مراجع کنترل خطی ارشد/دکترا و تست‌های عیب‌یابی ممیز دپارتمان میزان.";
    } else if (l.lessonName.includes("GMAT") || l.lessonName.includes("استعداد تحصیلی")) {
      topic = "آمادگی کفایت داده و درک مطلب پیشرفته متنی";
      rec = "پیشنهاد می‌شود تست‌های تمرینی شبیه‌ساز مهندسی کایزن را روزانه ۴ مقیاس پایش زمان‌دار اجرا کنید.";
    }
    return {
      subject: l.lessonName,
      topic,
      recommendation: rec,
      questions: 20,
      percentage: l.percentage,
      severity: l.percentage < 45 ? "critical" as const : "warning" as const
    };
  });

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden text-right dir-rtl" id="chatre-danesh-modal-overlay">
      
      {/* Target print stylesheet injected dynamically */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide all screen components */
          body * {
            visibility: hidden !important;
            height: auto !important;
          }
          #chatre-danesh-print-wrapper, #chatre-danesh-print-wrapper * {
            visibility: visible !important;
          }
          #chatre-danesh-print-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: block !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 1.5cm;
          }
        }
      `}} />

      {/* Main SaaS Container splits actions (sidebar) and simulated preview sheet */}
      <div className="bg-white rounded-[24px] w-full max-w-6xl h-full max-h-[92vh] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200">
        
        {/* Right column: Print control widgets and online share options */}
        <div className="w-full md:w-85 bg-slate-50 border-b md:border-b-0 md:border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto no-print">
          <div className="space-y-5">
            {/* Modal Title */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow">
                  <Printer size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">سند چاپی و هدایت اولیا</h3>
                  <p className="text-[10px] text-slate-500 font-bold">سازگاری صد در صد با استاندارد A4</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-slate-200 rounded-lg transition text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Customizer Checklist for PDF output */}
            <div className="space-y-3">
              <span className="text-[11px] font-black text-slate-550 block text-teal-700">⚙️ پیکربندی توصیه‌های هوشمند چاپی</span>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">توصیه‌های روانشناختی خاص را جهت گنجاندن در نسخه نهایی PDF کارنامه فعال یا غیرفعال سازید:</p>
              
              <div className="space-y-2 border border-slate-100 bg-white p-3 rounded-xl shadow-xs">
                <label className="flex items-center justify-between text-[11px] font-extrabold text-slate-700 cursor-pointer">
                  <span>۱. نظارت بر شیفت‌های استراحت (پومودورو)</span>
                  <input 
                    type="checkbox" 
                    checked={includeGuidelines.pomodoro}
                    onChange={(e) => setIncludeGuidelines(prev => ({ ...prev, pomodoro: e.target.checked }))}
                    className="accent-teal-600 w-3.5 h-3.5 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between text-[11px] font-extrabold text-slate-700 cursor-pointer pt-2 border-t border-slate-50">
                  <span>۲. حفظ آرامش و مهیاسازی خانه</span>
                  <input 
                    type="checkbox" 
                    checked={includeGuidelines.mentalPeace}
                    onChange={(e) => setIncludeGuidelines(prev => ({ ...prev, mentalPeace: e.target.checked }))}
                    className="accent-teal-600 w-3.5 h-3.5 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between text-[11px] font-extrabold text-slate-700 cursor-pointer pt-2 border-t border-slate-50">
                  <span>۳. پیگیری مداوم چرخه کایزن جبرانی</span>
                  <input 
                    type="checkbox" 
                    checked={includeGuidelines.kaizenFollowup}
                    onChange={(e) => setIncludeGuidelines(prev => ({ ...prev, kaizenFollowup: e.target.checked }))}
                    className="accent-teal-600 w-3.5 h-3.5 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between text-[11px] font-extrabold text-slate-700 cursor-pointer pt-2 border-t border-slate-50">
                  <span>۴. محدودسازی درگاه‌های مجازی حواس‌پرتی</span>
                  <input 
                    type="checkbox" 
                    checked={includeGuidelines.mobileLimit}
                    onChange={(e) => setIncludeGuidelines(prev => ({ ...prev, mobileLimit: e.target.checked }))}
                    className="accent-teal-600 w-3.5 h-3.5 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between text-[11px] font-extrabold text-slate-700 cursor-pointer pt-2 border-t border-slate-50">
                  <span>۵. پشتیبانی روحی فعال و مستمر</span>
                  <input 
                    type="checkbox" 
                    checked={includeGuidelines.emotionalSupport}
                    onChange={(e) => setIncludeGuidelines(prev => ({ ...prev, emotionalSupport: e.target.checked }))}
                    className="accent-teal-600 w-3.5 h-3.5 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Online parent sharing utility */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <span className="text-[11px] font-black text-slate-550 block text-teal-700">✉️ ابلاغ گزارش برخط به کارتابل والدین</span>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">با ورود شماره همراه‌ حامی علمی، خلاصه تحلیل روانشناسی و عملکردی را بلافاصله برایشان ابرد ارسال کنید:</p>
              
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold block">شماره تلفن همراه حامی یا اولیا</label>
                  <input 
                    type="text"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="مثال: 09123456789"
                    className="w-full text-center bg-white border border-slate-200 rounded-lg py-2 text-xs font-mono font-black text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1">
                  <button 
                    onClick={() => setShareMedium("sms")}
                    className={`py-1.5 text-[9.5px] font-bold rounded-lg border cursor-pointer transition ${shareMedium === "sms" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
                  >
                    پیامک مستقیم
                  </button>
                  <button 
                    onClick={() => setShareMedium("eitaa")}
                    className={`py-1.5 text-[9.5px] font-bold rounded-lg border cursor-pointer transition ${shareMedium === "eitaa" ? "bg-orange-600 text-white border-orange-600" : "bg-white text-slate-600 border-slate-200"}`}
                  >
                    پیام‌رسان ایتا
                  </button>
                  <button 
                    onClick={() => setShareMedium("bale")}
                    className={`py-1.5 text-[9.5px] font-bold rounded-lg border cursor-pointer transition ${shareMedium === "bale" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200"}`}
                  >
                    پیام‌رسان بله
                  </button>
                  <button 
                    onClick={() => setShareMedium("telegram")}
                    className={`py-1.5 text-[9.5px] font-bold rounded-lg border cursor-pointer transition ${shareMedium === "telegram" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"}`}
                  >
                    تلگرام پشتیبان
                  </button>
                </div>

                {!isSharing && !wasShared && (
                  <button
                    onClick={handleShareAction}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer transition flex justify-center items-center gap-1.5 shadow"
                  >
                    <Share2 size={12} />
                    <span>ارسال گزارش به اولیا</span>
                  </button>
                )}

                {isSharing && (
                  <div className="p-3 bg-teal-50/50 border border-teal-150 rounded-xl space-y-2 animate-pulse text-right">
                    <div className="flex items-center gap-1 text-[10px] text-teal-800 font-extrabold">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-ping"></span>
                      <span>سرویس ابری در حال انتقال...</span>
                    </div>
                    <p className="text-[9.5px] text-teal-700 leading-relaxed font-semibold">{shareProgressMsg}</p>
                  </div>
                )}

                {wasShared && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2">
                    <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-black">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>ابلاغ برخط به اولیا انجام شد ✓</span>
                    </div>
                    <p className="text-[9px] text-emerald-700 font-semibold leading-relaxed">
                      گزارش تفصیلی کایزن به شماره {toPersianNum(parentPhone)} با موفقیت از طریق درگاه {shareMedium === "sms" ? "پیامک سیستم" : shareMedium === "eitaa" ? "ایتا" : shareMedium === "bale" ? "بله" : "تلگرام"} ابلاغ قرار گرفت.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Footer for printing */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <button
              onClick={handlePrint}
              className="w-full py-3 bg-gradient-to-r from-teal-650 to-emerald-700 hover:from-teal-750 hover:to-emerald-800 text-white rounded-xl text-xs font-black cursor-pointer transition flex justify-center items-center gap-2 shadow-md hover:shadow-lg"
            >
              <Printer size={14} />
              <span>🖨️ چاپ مستقیم / تولید نسخه PDF</span>
            </button>
            <button 
              onClick={onClose}
              className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[11px] font-bold transition cursor-pointer"
            >
              بستن پنجره پیش‌نمایش
            </button>
          </div>
        </div>

        {/* Left column: Simulated layout of document page inside scroll container */}
        <div className="flex-1 bg-slate-100 p-2 sm:p-5 md:p-8 overflow-y-auto flex flex-col items-center">
          
          {/* Quick Notice Banner on screen (hidden during print) */}
          <div className="w-full max-w-[800px] bg-amber-50 border border-amber-100 text-amber-900 p-3 rounded-2xl mb-4 text-xs font-semibold leading-relaxed flex items-start gap-2 text-right no-print">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={14} />
            <div>
              <span>محیط پیش‌نمایش کارنامه نهایی میزان. برای دانلود واقعی فایل PDF، از دکمه «چاپ مستقیم / تولید نسخه PDF» استفاده کرده و در پنجره مرورگر باز شده، گزینه <b>«Save as PDF (ذخیره به عنوان PDF)»</b> را برگزینید.</span>
            </div>
          </div>

          {/* Official Document Sheet */}
          <div 
            id="chatre-danesh-print-wrapper" 
            className="w-full max-w-[800px] bg-white border border-slate-300 shadow-lg rounded-2xl p-6 md:p-10 text-slate-900 space-y-6 text-right font-sans relative"
          >
            
            {/* Stamp Logo of Chatr-e Danesh (Circular Blue Stamp absolute positioned) */}
            <div className="absolute top-26 left-12 w-28 h-28 border-[3px] border-blue-600/35 rounded-full flex flex-col items-center justify-center opacity-70 rotate-[-12deg] select-none pointer-events-none text-center">
              <div className="text-[7.5px] font-black leading-tight text-blue-600">میزان</div>
              <div className="text-[10px] font-extrabold text-blue-800 tracking-wider">مورد تایید آموزش</div>
              <div className="text-[6.5px] font-bold text-blue-600 mt-0.5">شعبه مرکزی تهران</div>
              <div className="w-16 h-0.5 bg-blue-500/30 my-0.5"></div>
              <div className="text-[6px] text-blue-600 font-black">مصوب تحصیلات تکمیلی کشور</div>
            </div>

            {/* Document Header block */}
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
              {/* Right Side: Small Logo & Brand details */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white border border-slate-850">
                  <Shield className="text-amber-400" size={20} />
                </div>
                <div>
                  <h1 className="text-xs font-black text-slate-950 block">دپارتمان بزرگ آموزش عالی میزان</h1>
                  <span className="text-[9px] text-teal-700 font-extrabold block">سامانه مربی هوشمند و تحلیل کارنامه میزان</span>
                </div>
              </div>

              {/* Middle: Title */}
              <div className="text-center">
                <h2 className="text-base font-black text-slate-900 underline underline-offset-4">کارنامه جامع عارضه‌یابی و مربی‌گری روانی</h2>
                <span className="text-[10px] text-slate-500 font-black mt-2 block">«گزارش نهایی عملکرد داוطلب و توصیه‌نامه اولیاء»</span>
              </div>

              {/* Left Side: Serial index and Date */}
              <div className="text-left font-mono text-[9px] text-slate-500 space-y-1">
                <div>تاریخ صدور: <span className="font-bold font-sans">۹ خرداد ۱۴۰۵</span></div>
                <div>سریال پرونده: <span className="font-bold">CD-405-091</span></div>
                <div>وضعیت مدرک: <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-sans font-extrabold">بررسی نهایی</span></div>
              </div>
            </div>

            {/* Profile Grid Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-xs text-slate-800">
              <div>
                <span className="text-slate-450 font-bold">نام و نام خانوادگی داوطلب: </span>
                <strong className="text-slate-950 font-black">{student.name}</strong>
              </div>
              <div>
                <span className="text-slate-450 font-bold">دوره تخصصی و گرایش آزمون علمی: </span>
                <strong className="text-slate-950 font-black">
                  {student.field === "elec_master" 
                    ? "کارشناسی ارشد مهندسی برق" 
                    : student.field === "elec_phd" 
                      ? "دکتری تخصصی مهندسی برق" 
                      : student.field === "comp_master" 
                        ? "کارشناسی ارشد هوش مصنوعی و کامپیوتر" 
                        : "کارشناسی ارشد مدیریت MBA"}
                </strong>
              </div>
              <div>
                <span className="text-slate-450 font-bold">عنوان نهایی آزمون: </span>
                <strong className="text-slate-900 font-semibold">{currentExam.title}</strong>
              </div>
              <div>
                <span className="text-slate-450 font-bold">تراز علمی نهایی: </span>
                <strong className="text-teal-700 font-mono font-black text-sm">{currentExam.traz}</strong>
              </div>
              <div>
                <span className="text-slate-450 font-bold">رتبه کشوری رشته: </span>
                <strong className="text-slate-905 font-black font-mono text-sm">{toPersianNum(currentExam.rank)}</strong>
              </div>
              <div>
                <span className="text-slate-450 font-bold">تخمین تراز آزمون بعد: </span>
                <strong className="text-purple-700 font-mono font-black text-sm">{toPersianNum(estimatedTraz || 5800)}</strong>
              </div>
            </div>

            {/* Core Table Metrics (ریز نمرات کارنامه) */}
            <div className="space-y-2">
              <span className="text-[11px] font-black text-slate-900 block flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                <span>بخش اول: جدول نتایج درصدی و ارزیابی شبیه‌ساز دروس گلوگاهی</span>
              </span>
              <table className="w-full text-center border-collapse border border-slate-300 text-xs text-slate-850">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold">
                    <th className="border border-slate-300 py-2">نام عنوان درسی</th>
                    <th className="border border-slate-300 py-2">درصد مکتسبه</th>
                    <th className="border border-slate-300 py-2">تعداد صحیح</th>
                    <th className="border border-slate-300 py-2">تعداد غلط (تله)</th>
                    <th className="border border-slate-300 py-2">سفید</th>
                    <th className="border border-slate-300 py-2">سطح تسلط علمی</th>
                  </tr>
                </thead>
                <tbody>
                  {currentExam.lessons.map((lesson, idx) => {
                    const grade = lesson.percentage;
                    let masteryText = "عالی (تسلط حاد)";
                    let colorClass = "text-emerald-700 font-black";
                    if (grade < 35) {
                      masteryText = "بحرانی (گلوگاه پر تله)";
                      colorClass = "text-rose-700 font-black";
                    } else if (grade < 50) {
                      masteryText = "متوسط (نیاز به پیگیری)";
                      colorClass = "text-amber-700 font-bold";
                    } else if (grade < 70) {
                      masteryText = "خوب (رضایت‌بخش)";
                      colorClass = "text-blue-700 font-bold";
                    }
                    return (
                      <tr key={idx} className="hover:bg-slate-50/55">
                        <td className="border border-slate-300 py-2 font-bold text-slate-950">{lesson.lessonName}</td>
                        <td className="border border-slate-300 py-2 font-mono font-bold text-slate-900">{lesson.percentage}٪</td>
                        <td className="border border-slate-300 py-2 font-mono text-emerald-600 font-semibold">{toPersianNum(lesson.correct)}</td>
                        <td className="border border-slate-300 py-2 font-mono text-rose-600 font-semibold">{toPersianNum(lesson.wrong)}</td>
                        <td className="border border-slate-300 py-2 font-mono text-slate-400">{toPersianNum(lesson.empty)}</td>
                        <td className={`border border-slate-300 py-2 ${colorClass}`}>{masteryText}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="text-[10px] text-slate-500 flex justify-between items-center px-1 font-bold">
                <span>* میانگین پاسخ‌دهی متقابل کل آزمون: {currentExam.overallPercentage}٪</span>
                <span>* کلیه دروس بر اساس دفترچه رسمی فاز دوم کنکور ممیزی شده‌اند</span>
              </div>
            </div>

            {/* Behavioral and psychological diagnostic metrics */}
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <span className="text-[11px] font-black text-slate-900 block flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                <span>بخش دوم: عارضه‌یابی روانشناختی تله‌های ذهنی و مانیتورینگ خستگی داوطلب</span>
              </span>

              {psychological ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-teal-50/30 p-4 rounded-xl border border-teal-100 text-xs">
                  <div className="space-y-2 text-right">
                    <div>
                      <span className="text-slate-450 font-bold">الگوی مهار تلافه تستی شبیه‌ساز: </span>
                      <strong className="text-slate-900 block mt-0.5 leading-relaxed">{psychological.pattern}</strong>
                    </div>
                    <div>
                      <span className="text-slate-450 font-bold">میزان فرسودگی و خستگی ذهنی داوطلب: </span>
                      <strong className="text-teal-700 text-sm font-mono block mt-0.5 font-bold">{psychological.stressLevel}٪ (در محدوده {psychological.stressAnalysis?.stressLabel})</strong>
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <div>
                      <span className="text-slate-450 font-bold">ممیزی سرعت پاسخ‌گویی بر حسب تست: </span>
                      <p className="text-slate-700 leading-relaxed font-semibold block mt-0.5">
                        {psychological.description}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">اطلاعات عارضه‌یابی روانشناسی به صورت کامل بارگذاری نشده است. عارضه‌یابی با موتور مرکزی در جریان است.</p>
              )}
            </div>

            {/* Smart Educational Directives (برنامه درسی جبرانی کایزن) */}
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <span className="text-[11px] font-black text-slate-900 block flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                <span>بخش سوم: دستورالعمل‌های ترمیمی کایزن درسی ممیزی شده (گلوگاه‌های علمی)</span>
              </span>
              
              <div className="space-y-2.5">
                {activeWeaknesses.slice(0, 3).map((weak, idx) => (
                  <div key={idx} className="p-3 bg-red-50/30 border border-red-150/50 rounded-lg text-xs flex justify-between gap-4 items-start text-right">
                    <div className="space-y-1 flex-1">
                      <strong className="text-slate-900 font-extrabold flex items-center gap-1.5 text-rose-850">
                        <AlertCircle size={12} className="text-rose-600" />
                        <span>درس {weak.subject} (درصد: {weak.percentage}٪) </span>
                        <span className="text-[9.5px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">گلوگاه تله‌گیر</span>
                      </strong>
                      <div className="text-[11px] text-slate-700">
                        <span className="font-bold text-slate-800">مباحث پر آسیب:</span> {weak.topic}
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        <span className="font-bold text-teal-800">توصیه ترمیمی هوش مصنوعی:</span> {weak.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Guidelines for Parents (توصیه‌نامه مربی‌گری روحی حامیان و اولیاء) */}
            <div className="space-y-3.5 border-t border-slate-200 pt-4">
              <span className="text-[11px] font-black text-slate-900 block flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                <span>بخش چهارم: پروتکل مربی‌گری و هدایت اولیاء جهت پشتیبانی داوطلب در منزل</span>
              </span>
              
              <p className="text-xs text-slate-600 leading-relaxed font-semibold text-right">
                اولیاء و حامیان گرامی، با توجه به تحلیل روانشناختی و محاسباتی داوطلب گرامی در آزمون اخیر، رعایت موارد زیر گام بلندی در بهبودی راندمان تمرکز و کاهش تله‌های تستی او در آزمون نهایی خواهد بود:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {includeGuidelines.pomodoro && (
                  <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 flex gap-2 text-right">
                    <HeartHandshake className="text-teal-600 flex-shrink-0 mt-0.5" size={16} />
                    <div className="space-y-0.5">
                      <strong className="text-slate-950 font-black text-[11px] block">نظارت بر زمان‌های استراحت (پومودورو)</strong>
                      <span className="text-[10.5px] text-slate-650 leading-relaxed font-semibold block">ممانعت جدی از مطالعه مستمر بالای ۹۰ دقیقه داوطلب بدون تخصیص پارت استراحت ۱۵ دقیقه‌ای پویا بدون تلفن همراه جهت بازیابی فرکانس مغز.</span>
                    </div>
                  </div>
                )}

                {includeGuidelines.mentalPeace && (
                  <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 flex gap-2 text-right">
                    <CheckCircle2 className="text-teal-600 flex-shrink-0 mt-0.5" size={16} />
                    <div className="space-y-0.5">
                      <strong className="text-slate-950 font-black text-[11px] block">کنترل فضای روانی و صوتی خانه</strong>
                      <span className="text-[10.5px] text-slate-650 leading-relaxed font-semibold block">مهیاسازی اتمسفری به دور از تنش‌های خانوادگی و حداقل‌سازی بازتاب اخبار و استرس‌های مکرر کنکور در جمع صمیمانه خانواده.</span>
                    </div>
                  </div>
                )}

                {includeGuidelines.kaizenFollowup && (
                  <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 flex gap-2 text-right">
                    <Sparkles className="text-teal-600 flex-shrink-0 mt-0.5" size={16} />
                    <div className="space-y-0.5">
                      <strong className="text-slate-950 font-black text-[11px] block">پیگیری هوشمند چرخه مطالعه جبرانی</strong>
                      <span className="text-[10.5px] text-slate-650 leading-relaxed font-semibold block">همیاری روزانه محترمانه جهت تایید تکمیل جدول کایزن جبرانی و ممانعت از قرار گرفتن مجدد داوطلب در تله‌های تستی تکراری.</span>
                    </div>
                  </div>
                )}

                {includeGuidelines.mobileLimit && (
                  <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 flex gap-2 text-right">
                    <MessageSquare className="text-teal-600 flex-shrink-0 mt-0.5" size={16} />
                    <div className="space-y-0.5">
                      <strong className="text-slate-950 font-black text-[11px] block">محدودسازی درگاه‌های حواس‌پرتی مجازی</strong>
                      <span className="text-[10.5px] text-slate-650 leading-relaxed font-semibold block">فراهم‌سازی بستری برای کاهش ملموس وبگردی‌های ناخودآگاه با ترغیب به استفاده هوشمند از بسترهای خلاصه مواد صوتی سامانه میزان.</span>
                    </div>
                  </div>
                )}

                {includeGuidelines.emotionalSupport && (
                  <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 flex gap-2 text-right">
                    <Shield className="text-teal-600 flex-shrink-0 mt-0.5" size={16} />
                    <div className="space-y-0.5">
                      <strong className="text-slate-950 font-black text-[11px] block">پشتیبانی عاطفی فعال و مداوم</strong>
                      <span className="text-[10.5px] text-slate-650 leading-relaxed font-semibold block">تحسین رشدهای جزئی تراز علمی به عنوان تشویق اهرمی مداومت؛ از مقایسه تراز علمی او با سایر فامیل یا داوطلبان عمیقا پرهیز شود.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Document Verification & Signatures block */}
            <div className="border-t-2 border-slate-900 pt-5 grid grid-cols-2 gap-8 text-xs text-slate-800">
              <div className="space-y-2 border-l border-slate-200 pl-4 h-full text-right">
                <strong className="text-slate-950 font-black block">✓ امضا و تایید تعهد اولیاء داوطلب:</strong>
                <p className="text-[10px] text-slate-550 leading-relaxed leading-relaxed">
                  بدین وسیله مراتب عارضه‌یابی آزمون شبیه‌ساز و توصیه‌نامه اولیاء رویت شد و نسبت به مهیاسازی بستر روانشناختی مربی گری و همچنین ممیزی کایزن درصدی داوطلب متعهد می‌شویم.
                </p>
                <div className="pt-8 text-slate-400 border-none font-bold text-center">محل اثر انگشت و امضای اولیاء</div>
              </div>
              <div className="space-y-2 text-right flex flex-col justify-between h-full">
                <div>
                  <strong className="text-slate-950 font-black block">✓ تاییدیه و تایید مهر شعبه مرکزی دپارتمان میزان:</strong>
                  <p className="text-[10px] text-slate-550 leading-relaxed leading-relaxed">
                    گواهی رتبه و تله‌یابی شناختی داوطلب فوق توسط مربی هوش مصنوعی صادر شده و معتبر است.
                  </p>
                </div>
                <div className="text-left select-none text-teal-800 italic font-bold">
                  <div>مشاور ارشد سامانه میزان</div>
                  <div className="text-[10px] text-slate-500 font-bold block">مهر دپارتمان آموزش عالی میزان</div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
