import React, { useState, useEffect } from "react";
import { 
  Brain, Sparkles, Target, AlertTriangle, CheckCircle2, XCircle, 
  ChevronLeft, ArrowRight, RefreshCw, Scale, BookOpen, ShieldAlert,
  HelpCircle, Lightbulb, Save, Info, Award, Timer, Menu, Play, Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Student, Weakness, TestTrap } from "../types";
import { getTestTraps, saveTestTrap } from "../lib/traps";
import { addSystemLog } from "../lib/syslogs";

interface CustomQuizGeneratorProps {
  student: Student;
  onRefreshStats?: () => void;
}

interface QuizQuestion {
  id: string;
  subject: string;
  title: string;
  text: string;
  options: string[];
  correctIdx: number;
  explanation: string;
  trapType: string;
  difficulty: "سخت" | "بسیار سخت" | "المپیاد مهندسی برق";
  importance: "high" | "medium" | "low";
}

export default function CustomQuizGenerator({ student, onRefreshStats }: CustomQuizGeneratorProps) {
  // Question pool of difficult EE/analytical questions corresponding to subjects
  const QUESTION_POOL: QuizQuestion[] = [
    {
      id: "Q-EE-01",
      subject: "مدارهای الکتریکی",
      title: "تحلیل حالت گذرا - مدارهای مرتبه دوم RL-C",
      text: "در یک مدار سری RLC که برای مدت طولانی به منبع DC متصل بوده است، کلیدی در لحظه t=0 باز می‌شود. اگر مقاومت R برابر با مقدار بحرانی (Critical Damping) باشد، پاسخ ولتاژ خازن در لحظات t > 0 به چه شکلی خواهد بود؟",
      options: [
        "۱. به صورت نوسانی میرا (Under-damped) با فرکانس زاویه‌ای میرایی مشخص.",
        "۲. به صورت مجموع دو تابع نمایی با ثابت‌های زمانی متفاوت (Over-damped).",
        "۳. به صورت حاصل‌ضرب یک تابع خطی در یک تابع نمایی (t*e^-at) که سریع‌ترین رسیدن به حالت ماندگار بدون نوسان را دارد.",
        "۴. به صورت یک تابع پله‌ای معکوس که مستقیماً به مقدار نهایی جهش می‌کند."
      ],
      correctIdx: 2,
      explanation: "در حالت میرایی بحرانی (Critically Damped)، ریشه‌های معادله مشخصه مدار تکراری هستند. در این حالت، پاسخ عمومی مدار شامل ترمی به فرم (A+Bt)e^-at است. این حالت مرز بین نوسانی بودن و غیرنوسانی بودن است و سریع‌ترین پاسخ بدون نوسان را ارائه می‌دهد.",
      trapType: "تله تشخیص نوع پاسخ گذرا براساس ضرایب میرایی و فرکانس رزونانس",
      difficulty: "بسیار سخت",
      importance: "high"
    },
    {
      id: "Q-EE-02",
      subject: "سیگنال‌ها و سیستم‌ها",
      title: "تبدیل فوریه و خواص فرکانسی - قضایای جابجایی",
      text: "اگر خروجی یک سیستم LTI با پاسخ ضربه h(t) به ورودی x(t) برابر با y(t) باشد، خروجی همان سیستم به ورودی x(t-t0) که با فرکانس w0 مدوله شده است (یعنی x(t-t0)e^jw0t)، در حوزه فرکانس چگونه توصیف می‌شود؟",
      options: [
        "۱. خروجی صرفاً با تاخیر زمانی t0 در حوزه زمان ظاهر می‌شود و طیف فرکانسی تغییر نمی‌کند.",
        "۲. طیف فرکانسی y(t) به اندازه w0 جابجا شده و در یک فاز نمایی متاثر از t0 ضرب می‌شود (Y(w-w0)e^-j(w-w0)t0).",
        "۳. خروجی در حوزه زمان با پاسخ ضربه h(t-t0) کانوالو شده و دامنه آن دو برابر می‌گردد.",
        "۴. سیستم به دلیل وجود ترم نمایی مختلط، دیگر LTI نخواهد بود و خروجی قابل محاسبه نیست."
      ],
      correctIdx: 1,
      explanation: "طبق خاصیت جابجایی در زمان و فرکانس، تاخیر در زمان معادل ضرب در فاز نمایی در فرکانس است و مدولاسیون در زمان معادل جابجایی در فرکانس است. ترکیب این دو با توجه به وجود h(t) ثابت، منجر به شیفت طیف خروجی اصلی و اعمال فاز مربوطه می‌گردد.",
      trapType: "تله ترکیب خواص خطی بودن و جابجایی در سیستم‌های LTI",
      difficulty: "سخت",
      importance: "high"
    },
    {
      id: "Q-EE-03",
      subject: "الکترونیک",
      title: "تحلیل AC ترانزیستور - مقاومت خروجی اثر ارلی",
      text: "در یک تقویت‌کننده امیتر مشترک با بایاس جریان ثابت، در نظر گرفتن 'اثر ارلی' (Early Effect) در مدل سیگنال کوچک ترانزیستور BJT، چه تاثیری بر بهره ولتاژ (Av) و مقاومت خروجی (Ro) دارد؟",
      options: [
        "۱. بهره ولتاژ را به بی‌نهایت میل داده و مقاومت خروجی را صفر می‌کند.",
        "۲. بهره ولتاژ را کاهش داده و باعث می‌شود مقاومت خروجی از مقدار Rc به موازی Rc و ro تغییر یابد.",
        "۳. هیچ تاثیری بر تحلیل AC ندارد و فقط در تعیین نقطه کار (Q-point) موثر است.",
        "۴. باعث پایداری حرارتی بیشتر شده و مقاومت ورودی را به شدت افزایش می‌دهد."
      ],
      correctIdx: 1,
      explanation: "اثر ارلی مدل‌کننده تغییر عرض بیس با ولتاژ کلکتور-امیتر است که در مدل سیگنال کوچک با یک مقاومت ro موازی بین کلکتور و امیتر نشان داده می‌شود. این مقاومت موازی با بار کلکتور قرار گرفته و باعث کاهش بهره کل و محدود شدن مقاومت خروجی تقویت‌کننده می‌گردد.",
      trapType: "تله نادیده گرفتن مقاومت داخلی ترانزیستور در بهره‌های بالا",
      difficulty: "بسیار سخت",
      importance: "high"
    },
    {
      id: "Q-EE-04",
      subject: "کنترل خطی",
      title: "پایداری نایکوئیست - حاشیه فاز و بهره",
      text: "در دیاگرام نایکوئیست یک سیستم مرتبه بالا، اگر نمودار از سمت راست نقطه (1-, j0) عبور کند اما آن را دور نزند (N=0) و سیستم حلقه‌باز پایدار باشد، وضعیت پایداری حلقه‌بسته و حاشیه فاز چگونه است؟",
      options: [
        "۱. سیستم حلقه‌بسته ناپایدار است زیرا شرط نایکوئیست برقرار نشده است.",
        "۲. سیستم حلقه‌بسته پایدار است و حاشیه فاز مثبت و بزرگتر از صفر خواهد بود.",
        "۳. سیستم در آستانه نوسان قرار دارد و حاشیه بهره صفر است.",
        "۴. حاشیه فاز منفی بوده و سیستم فقط با فیدبک مثبت پایدار می‌گردد."
      ],
      correctIdx: 1,
      explanation: "بر اساس معیار نایکوئیست، برای یک سیستم حلقه‌باز پایدار (P=0)، پایداری حلقه‌بسته مستلزم آن است که نمودار نقطه 1- را دور نزند (N=0). اگر نمودار از سمت راست این نقطه عبور کند، یعنی در فرکانسی که بهره واحد است، فاز سیستم کمتر از 180- درجه تغییر کرده و حاشیه فاز مثبت است.",
      trapType: "تله تشخیص جهت دوران و فاصله از نقطه بحرانی نایکوئیست",
      difficulty: "المپیاد مهندسی برق",
      importance: "medium"
    },
    {
      id: "Q-EE-05",
      subject: "ماشین‌های الکتریکی",
      title: "ماشین‌های DC - عکس‌العمل مغناطیسی آرمیچر",
      text: "در یک ژنراتور DC تحت بار، پدیده 'عکس‌العمل آرمیچر' (Armature Reaction) چه تاثیری بر روی محور خنثی مغناطیسی (MNA) و ولتاژ ترمینال دارد؟",
      options: [
        "۱. محور خنثی در جهت چرخش جابجا شده و ولتاژ ترمینال به دلیل تضعیف شار کاهش می‌یابد.",
        "۲. محور خنثی در خلاف جهت چرخش جابجا شده و ولتاژ ترمینال افزایش می‌یابد.",
        "۳. هیچ جابجایی در محور خنثی رخ نمی‌دهد اما جرقه در کموتاتور حذف می‌شود.",
        "۴. شار قطب‌ها تقویت شده و نیاز به سیم‌پیچ جبران‌ساز از بین می‌رود."
      ],
      correctIdx: 0,
      explanation: "جریان آرمیچر میدانی ایجاد می‌کند که بر میدان قطب‌های اصلی عمود است. این تداخل باعث جابجایی محور خنثی در جهتی که آرمیچر می‌چرخد (در ژنراتور) می‌شود. همچنین به دلیل اشباع غیرخطی، اثر تضعیف‌کنندگی شار غالب شده و ولتاژ خروجی کاهش می‌یابد.",
      trapType: "تله تمایز رفتار محور خنثی در ژنراتور مقابل موتور DC",
      difficulty: "سخت",
      importance: "high"
    },
    {
      id: "Q-EE-06",
      subject: "الکترومغناطیس",
      title: "معادلات ماکسول - جریان جابجایی در خازن",
      text: "در فضای بین صفحات یک خازن ایده آل که در حال شارژ با یک جریان متغیر زمانی است، کدام ترم در معادلات ماکسول مسئول ایجاد میدان مغناطیسی در اطراف فضای تهی بین صفحات است؟",
      options: [
        "۱. جریان هدایتی (Conduction Current) که از دی‌الکتریک عبور می‌کند.",
        "۲. ترم تغییرات زمانی میدان الکتریکی (Displacement Current) یا همان Jd = dD/dt.",
        "۳. بارهای ساکن روی صفحات خازن که میدان مغناطیسی استاتیک ایجاد می‌کنند.",
        "۴. شار مغناطیسی متغیر که طبق قانون لنز مستقیماً جریان ایجاد می‌کند."
      ],
      correctIdx: 1,
      explanation: "طبق قانون آمپر اصلاح شده توسط ماکسول، میدان مغناطیسی نه تنها توسط جریان بارها بلکه توسط تغییرات زمانی میدان الکتریکی (جریان جابجایی) نیز تولید می‌شود. در بین صفحات خازن ایده آل جریانی عبور نمی‌کند، اما تغییر میدان الکتریکی باعث ایجاد میدان مغناطیسی حلقوی می‌گردد.",
      trapType: "تله درک تفاوت جریان فیزیکی و جریان جابجایی ماکسول",
      difficulty: "بسیار سخت",
      importance: "medium"
    },
    {
      id: "Q-EE-07",
      subject: "ریاضیات مهندسی",
      title: "توابع مختلط - قضایای باقیمانده و نقاط تکین",
      text: "انتگرال مختلط تابع f(z) = 1/(z^2 + 1) روی یک مسیر بسته دایره‌ای به مرکز مبدأ و شعاع ۲ در جهت پادکلاکگرد چقدر است؟",
      options: [
        "۱. برابر صفر است زیرا تابع در داخل دایره تحلیلی است.",
        "۲. برابر pi*j است، زیرا شامل دو قطب ساده در i و i- می‌باشد.",
        "۳. برابر صفر است، زیرا مجموع باقیمانده‌ها در قطب‌های داخل مسیر صفر می‌گردد (Res(i) + Res(-i) = 0).",
        "۴. برابر 2pi*j است و مقدار آن به شعاع دایره بستگی ندارد."
      ],
      correctIdx: 2,
      explanation: "نقاط تکین تابع در z=i و z=-i قرار دارند که هر دو داخل دایره به شعاع ۲ هستند. باقیمانده در z=i برابر 1/2i و در z=-i برابر -1/2i است. طبق قضیه مانده‌ها، انتگرال برابر 2pi*j در مجموع باقیمانده‌هاست که چون مجموع صفر است، حاصل انتگرال نیز صفر می‌شود.",
      trapType: "تله فراموشی علامت باقیمانده‌ها در قطب‌های مختلط",
      difficulty: "المپیاد مهندسی برق",
      importance: "medium"
    }
  ];

  // Component State
  const [traps, setTraps] = useState<TestTrap[]>([]);
  const [weakSubjects, setWeakSubjects] = useState<string[]>(["مدارهای الکتریکی", "سیگنال‌ها و سیستم‌ها", "کنترل خطی", "ماشین‌های الکتریکی"]);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [quizMode, setQuizMode] = useState<"practice" | "exam">("practice"); // practice: instant check, exam: check at the end
  const [difficultySetting, setDifficultySetting] = useState<string>("بسیار سخت");
  const [selectedQuestions, setSelectedQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  
  // Track answers
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({}); // question index -> chosen option index
  const [checkedAnswers, setCheckedAnswers] = useState<Record<number, boolean>>({}); // index -> verified
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const [isTimedQuiz, setIsTimedQuiz] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0); // in seconds for report

  useEffect(() => {
    setTraps(getTestTraps());
  }, []);

  // Timer loop
  useEffect(() => {
    if (!quizStarted || quizFinished) return;
    
    // Increment total time elapsed
    const totalTimer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Decrement time left if timed
    let countdownTimer: NodeJS.Timeout;
    if (isTimedQuiz && timeLeft > 0) {
      countdownTimer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            handleFinishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(totalTimer);
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [quizStarted, quizFinished, isTimedQuiz, timeLeft]);

  // Analyze client weaknesses dynamically based on traps & percentage
  const getSubjectMetrics = () => {
    const counts = {
      "مدارهای الکتریکی": traps.filter(t => t.subject.includes("مدار")).length,
      "سیگنال‌ها و سیستم‌ها": traps.filter(t => t.subject.includes("سیگنال")).length,
      "کنترل خطی": traps.filter(t => t.subject.includes("کنترل")).length,
      "ماشین‌های الکتریکی": traps.filter(t => t.subject.includes("ماشین") || t.subject.includes("ترانس")).length,
    };

    return Object.entries(counts).map(([name, trapCount]) => {
      // Mock some logical low target percentage matching student profiles
      let accuracy = 65;
      if (name === "مدارهای الکتریکی") accuracy = 25;
      if (name === "سیگنال‌ها و سیستم‌ها") accuracy = 32;
      if (name === "کنترل خطی") accuracy = 41;
      if (name === "ماشین‌های الکتریکی") accuracy = 38;

      return {
        name,
        trapCount,
        accuracy,
        severity: accuracy < 35 ? "critical" : accuracy < 45 ? "warning" : "mild"
      };
    }).sort((a,b) => a.accuracy - b.accuracy); // lowest percentage (highest weakness) first
  };

  const subjectMetrics = getSubjectMetrics();

  const toggleSubjectFilter = (sub: string) => {
    if (weakSubjects.includes(sub)) {
      if (weakSubjects.length > 1) {
        setWeakSubjects(prev => prev.filter(s => s !== sub));
      }
    } else {
      setWeakSubjects(prev => [...prev, sub]);
    }
  };

  const toPersianNum = (num: number | string) => {
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]);
  };

  const formatTimer = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${toPersianNum(minutes.toString().padStart(2, '0'))}:${toPersianNum(seconds.toString().padStart(2, '0'))}`;
  };

  // Generate customized game/test based on configuration
  const handleStartQuiz = () => {
    // Filter questions based on selected categories and difficulty
    let filtered = QUESTION_POOL.filter(q => {
      // Check subject match
      const matchesSubject = weakSubjects.some(activeSub => q.subject.includes(activeSub));
      return matchesSubject;
    });

    // Check difficulty filter
    if (difficultySetting === "بسیار سخت") {
      filtered = filtered.filter(q => q.difficulty === "بسیار سخت" || q.difficulty === "المپیاد مهندسی برق");
    } else if (difficultySetting === "المپیاد مهندسی برق") {
      filtered = filtered.filter(q => q.difficulty === "المپیاد مهندسی برق");
    }

    // Default back if empty
    if (filtered.length === 0) {
      filtered = QUESTION_POOL;
    }

    // Shuffle and pick some questions
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    const finalSet = shuffled.slice(0, 5); // limit to 5 custom highly-challenging questions per test

    setSelectedQuestions(finalSet);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setCheckedAnswers({});
    setQuizFinished(false);
    setElapsedTime(0);
    
    if (isTimedQuiz) {
      setTimeLeft(finalSet.length * 90); // 90 seconds per complex engineering question
    } else {
      setTimeLeft(0);
    }

    setQuizStarted(true);
    addSystemLog("ایجاد آزمون تستی سفارشی", student.name, `داوطلب یک آزمون شخصی با ${finalSet.length} سوال تله‌دار مفهومی در دروس آسیب‌شناختی شروع کرد.`);
  };

  const handleSelectOption = (optIdx: number) => {
    if (quizFinished) return;
    if (quizMode === "practice" && checkedAnswers[currentQuestionIndex]) return;

    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optIdx
    }));
  };

  const handleCheckAnswer = () => {
    if (userAnswers[currentQuestionIndex] === undefined) return;
    setCheckedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: true
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < selectedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = () => {
    setQuizFinished(true);
    
    // Calculate stats
    let correctCount = 0;
    selectedQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIdx) correctCount++;
    });

    const finalPercent = Math.round((correctCount / selectedQuestions.length) * 100);
    
    // Record system log log
    addSystemLog(
      "اتمام آزمون سفارشی", 
      student.name, 
      `آزمون با درصد ${toPersianNum(finalPercent)}٪ و زمان ${toPersianNum(Math.floor(elapsedTime / 60))} دقیقه به پایان رسید.`
    );

    // Save test performance back to localized tracker to boost stats
    const savedGoals = localStorage.getItem(`arateb_goals_${student.id}`);
    if (savedGoals) {
      try {
        const parsed = JSON.parse(savedGoals);
        // Slightly update the overall success rates and streak on a good test!
        const updated = {
          ...parsed,
          currentSuccessRate: Math.max(parsed.currentSuccessRate || 59, Math.min(95, Math.round(((parsed.currentSuccessRate || 59) * 4 + finalPercent) / 5))),
          latestQuizScore: finalPercent,
        };
        localStorage.setItem(`arateb_goals_${student.id}`, JSON.stringify(updated));
        if (onRefreshStats) onRefreshStats();
      } catch (e) {}
    }
  };

  const handleQuickSaveTrap = (q: QuizQuestion) => {
    // Save this question as a test trap automatically to vault
    saveTestTrap({
      questionTitle: q.title,
      subject: q.subject,
      category: "مفهومی",
      trapType: q.trapType,
      correctAnswer: q.options[q.correctIdx],
      userMistake: "این سوال مفهومی را در آزمون سفارشی شبیه‌سازی اشتباه پاسخ دادم و فریب تله طراح ارشد برق را خوردم.",
      technicalNote: q.explanation,
      importance: "high"
    });

    alert("نکته طلایی و طرح سوال این تله با موفقیت به 'بانک شخصی تله‌های تستی' شما اضافه شد! اکنون در درخت دانش شما نیز متبلور است.");
    
    // Add syslog
    addSystemLog("ذخیره تله از آزمون سفارشی", student.name, `سوال تله‌دار مبحث ${q.subject} به مخزن شخصی اضافه گشت.`);
    if (onRefreshStats) onRefreshStats();
  };

  const activeQuestion = selectedQuestions[currentQuestionIndex];
  const isCorrect = activeQuestion && userAnswers[currentQuestionIndex] === activeQuestion.correctIdx;
  const isChecked = checkedAnswers[currentQuestionIndex];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-right" style={{ direction: "rtl" }} id="custom-quiz-generator-wrapper">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-700 rounded-2xl shadow-inner-sm">
            <Brain size={22} className="text-rose-600 animate-pulse" />
          </div>
          <div>
            <span className="p-1 px-2.5 bg-rose-50 text-rose-700 text-[9px] rounded-lg font-black border border-rose-150 inline-block mb-1">تکنولوژی یادگیری کایزن</span>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>شبیه‌ساز و آزمون تستی سفارشی (Smart Trap Quiz)</span>
              <Sparkles size={14} className="text-amber-500 fill-amber-100" />
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-1">تولید هوشمند آزمون‌های صریح مدارهای الکتریکی، سیگنال و کنترل بر روی نقاط اصطکاک و تله‌های پرتکرار شما</p>
          </div>
        </div>
        
        {quizStarted && !quizFinished && (
          <div className="flex items-center gap-3 bg-slate-50 p-2 px-4 rounded-2xl border border-slate-100">
            {isTimedQuiz && (
              <div className="flex items-center gap-1.5 text-rose-600 font-mono text-xs font-black">
                <Timer size={14} />
                <span>زمان باقیمانده: {formatTimer(timeLeft)}</span>
              </div>
            )}
            <span className="text-[10px] text-slate-400 font-bold">بازه پیشرفت: {toPersianNum(currentQuestionIndex + 1)} از {toPersianNum(selectedQuestions.length)} تستی</span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: CONFIGURATION BEFORE QUIZ */}
        {!quizStarted && (
          <motion.div 
            key="config-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* IN-DEPTH DIAGNOSTIC PROFILE OF WEAKNESSES */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-6 rounded-3xl text-white relative overflow-hidden shadow-md">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] bg-white/10 text-amber-300 font-black p-1 px-2.5 rounded-lg border border-white/5 flex items-center gap-1">
                    <Info size={10} />
                    <span>گزارش فنی مربی ناظر هوشمند آزمونیار</span>
                  </span>
                  <span className="text-[10px] text-indigo-200 font-bold font-sans">بروزرسانی: هم‌اکنون آنلاین</span>
                </div>

                <h3 className="text-sm font-black text-white leading-relaxed">
                  وضعیت آسیب‌شناسی و تله‌های فعال داوطلب «{student.name}»
                </h3>

                <p className="text-xs text-indigo-150 leading-relaxed font-semibold">
                  براساس داده‌های ممتد {toPersianNum(traps.length)} تله تستی ثبت شده در پوشه شما و برآورد آزمون شبیه‌ساز، نقاط آسیب‌پذیر مهندسی برق شما تفکیک گردیده است. با فشردن دکمه تولید آزمون، سیستم سوالاتی برای واکسینه کردن ذهن شما در قبال تله‌های این مباحث گزینش میکند.
                </p>

                {/* Subject accuracies meter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  {subjectMetrics.map((sm, i) => (
                    <div key={i} className="bg-black/25 p-3 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-center">
                        <strong className="text-xs font-black text-indigo-50">{sm.name}</strong>
                        <span className={`text-[8px] font-black p-0.5 px-1.5 rounded ${
                          sm.severity === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/10 animate-pulse' : 
                          sm.severity === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/10' : 
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {sm.severity === 'critical' ? 'ریسک بحرانی' : sm.severity === 'warning' ? 'هشدار تستی' : 'پایدار نسبی'}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-300 font-mono">
                          <span>میزان تسلط:</span>
                          <strong>{toPersianNum(sm.accuracy)}٪</strong>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              sm.severity === 'critical' ? 'bg-red-500' : sm.severity === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${sm.accuracy}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-[9px] text-indigo-200 flex justify-between items-center">
                        <span>تله‌های شکارشده:</span>
                        <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-white font-black">{toPersianNum(sm.trapCount)} مورد</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CONTROL PANEL CONFIGURATION CARD */}
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Box 1: Select weak subjects */}
              <div className="space-y-3">
                <strong className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                  <Scale size={14} className="text-indigo-600" />
                  <span>۱. انتخاب مباحث تله‌دار جهت شبیه‌سازی:</span>
                </strong>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                  حوزه‌های آزمونی که تمایل دارید تله‌های مفهومی و سوالات دشوار آنها در دفترچه آزمون چیده شود را علامت بزنید:
                </p>

                <div className="space-y-2 pt-2">
                  {["مدارهای الکتریکی", "سیگنال‌ها و سیستم‌ها", "کنترل خطی", "ماشین‌های الکتریکی"].map((sub) => {
                    const isChecked = weakSubjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        onClick={() => toggleSubjectFilter(sub)}
                        className={`w-full text-right p-2.5 rounded-xl border text-[11px] font-black transition-all flex items-center justify-between cursor-pointer ${
                          isChecked 
                            ? 'bg-white border-indigo-200 text-indigo-900 shadow-xs' 
                            : 'bg-slate-100/50 border-slate-150 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            sub === 'مدارهای الکتریکی' ? 'bg-blue-500' :
                            sub === 'سیگنال‌ها و سیستم‌ها' ? 'bg-amber-500' :
                            sub === 'کنترل خطی' ? 'bg-red-500' : 'bg-indigo-500'
                          }`} />
                          <span>{sub} (مفهومی ارشد برق)</span>
                        </span>
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          readOnly 
                          className="accent-indigo-600 h-3.5 w-3.5"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Box 2: Test Difficulty & Timing */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <strong className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <Star size={14} className="text-amber-500" />
                    <span>۲. درجه دشواری و ترازی آزمون:</span>
                  </strong>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "فوق سخت (تاپ کشور)", val: "بسیار سخت" },
                      { label: "المپیاد علمی کایزن", val: "المپیاد مهندسی برق" }
                    ].map(diff => (
                      <button
                        key={diff.val}
                        onClick={() => setDifficultySetting(diff.val)}
                        className={`text-center p-2.5 rounded-xl border text-[10px] font-black transition cursor-pointer ${
                          difficultySetting === diff.val 
                            ? 'bg-amber-500/10 border-amber-300 text-amber-900' 
                            : 'bg-white border-slate-150 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {diff.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <strong className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <Timer size={14} className="text-rose-600" />
                    <span>۳. زمان‌بندی پاسخگویی:</span>
                  </strong>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setIsTimedQuiz(true)}
                      className={`text-center p-2.5 rounded-xl border text-[10px] font-black transition cursor-pointer ${
                        isTimedQuiz 
                          ? 'bg-rose-500/10 border-rose-300 text-rose-950' 
                          : 'bg-white border-slate-150 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      ۹۰ ثانیه برای هر تست
                    </button>
                    <button
                      onClick={() => setIsTimedQuiz(false)}
                      className={`text-center p-2.5 rounded-xl border text-[10px] font-black transition cursor-pointer ${
                        !isTimedQuiz 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                          : 'bg-white border-slate-150 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      تک‌تک بدون زمان کل
                    </button>
                  </div>
                </div>
              </div>

              {/* Box 3: Quiz Mode Explanation & Trigger */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <strong className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <HelpCircle size={14} className="text-emerald-600" />
                    <span>۴. شیوه بررسی پاسخ‌ها:</span>
                  </strong>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setQuizMode("practice")}
                      className={`text-center p-2.5 rounded-xl border text-[10px] font-black transition cursor-pointer ${
                        quizMode === "practice" 
                          ? 'bg-emerald-500/10 border-emerald-300 text-emerald-900' 
                          : 'bg-white border-slate-150 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      بررسی در لحظه (آموزشی)
                    </button>
                    <button
                      onClick={() => setQuizMode("exam")}
                      className={`text-center p-2.5 rounded-xl border text-[10px] font-black transition cursor-pointer ${
                        quizMode === "exam" 
                          ? 'bg-purple-500/10 border-purple-300 text-purple-900' 
                          : 'bg-white border-slate-150 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      کارنامه کلی (آزمون واقعی)
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium leading-relaxed pt-1">
                    در حالت آموزشی، پاسخ بلافاصله تصحیح شده و دکمه ذخیره تله نمایش داده می‌شود. در حالت آزمون، گزارش نهایی در انتها صادر خواهد شد.
                  </p>
                </div>

                <button
                  onClick={handleStartQuiz}
                  className="w-full bg-slate-900 hover:bg-rose-600 text-white rounded-2xl py-3.5 font-sans font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-rose-100 cursor-pointer"
                >
                  <Play size={14} fill="white" />
                  <span>تولید هوشمند دفترچه سوالات کنکوری</span>
                </button>
              </div>

            </div>
          </motion.div>
        )}

        {/* VIEW 2: ACTIVE QUESTION SCREEN */}
        {quizStarted && !quizFinished && activeQuestion && (
          <motion.div 
            key="quiz-active-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Context bar */}
            <div className="flex flex-wrap justify-between items-center gap-3 bg-indigo-50 p-3 px-5 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 bg-indigo-600 text-white text-[9px] rounded-lg font-black">{activeQuestion.subject}</span>
                <span className="p-1 px-2.5 bg-slate-200 text-slate-700 text-[9px] rounded-lg font-bold">دشواری: {activeQuestion.difficulty}</span>
              </div>
              <div className="text-[11px] text-indigo-950 font-black">
                سوال {toPersianNum(currentQuestionIndex + 1)} از {toPersianNum(selectedQuestions.length)} سگمنت تله‌ساز
              </div>
            </div>

            {/* Question Card Box */}
            <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-xs space-y-4">
              <div className="flex gap-3.5 items-start">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {toPersianNum(currentQuestionIndex + 1)}
                </div>
                <div>
                  <h4 className="text-xs font-black text-indigo-700 mb-1.5">{activeQuestion.title}</h4>
                  <p className="text-sm font-black text-slate-900 leading-relaxed text-right">
                    {activeQuestion.text}
                  </p>
                </div>
              </div>

              {/* Options lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                {activeQuestion.options.map((opt, oIdx) => {
                  const isSelected = userAnswers[currentQuestionIndex] === oIdx;
                  
                  // Visual decorators for result verification in training mode
                  let btnStyle = "bg-slate-50/50 hover:bg-slate-50 border-slate-150 text-slate-800";
                  let iconElement = null;

                  if (quizMode === "practice" && isChecked) {
                    if (oIdx === activeQuestion.correctIdx) {
                      btnStyle = "bg-emerald-50 border-emerald-300 text-emerald-950 ring-1 ring-emerald-300";
                      iconElement = <CheckCircle2 size={16} className="text-emerald-600 ml-2" />;
                    } else if (isSelected) {
                      btnStyle = "bg-rose-50 border-rose-300 text-rose-950 ring-1 ring-rose-300";
                      iconElement = <XCircle size={16} className="text-rose-600 ml-2" />;
                    } else {
                      btnStyle = "bg-slate-50 opacity-60 border-slate-100 text-slate-400";
                    }
                  } else {
                    if (isSelected) {
                      btnStyle = "bg-indigo-900 border-indigo-950 text-white shadow-md transform scale-[1.01]";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(oIdx)}
                      disabled={quizMode === "practice" && isChecked}
                      className={`text-right p-4 rounded-2xl border text-xs font-black transition-all duration-150 flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <span className="leading-relaxed flex-grow">{opt}</span>
                      {iconElement}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PRACTICE MODE: IMMEDIATE FEEDBACK PANEL */}
            {quizMode === "practice" && isChecked && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-3xl border space-y-3 ${
                  isCorrect ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/40 border-rose-100'
                }`}
              >
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-1 px-2.5 rounded-lg text-[9px] font-black ${
                      isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isCorrect ? '✓ پاسخ شما کاملاً درست است!' : '✗ در دام تله تستی طراح افتادید!'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-extrabold flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-md border border-slate-100">
                      <Lightbulb size={12} className="text-amber-500" />
                      <span>عنوان تله: {activeQuestion.trapType}</span>
                    </span>
                  </div>

                  {/* Add to trap vault option */}
                  <button
                    onClick={() => handleQuickSaveTrap(activeQuestion)}
                    className="flex items-center gap-1.5 bg-indigo-900 hover:bg-slate-900 text-white text-[10px] font-black p-1.5 px-3 rounded-lg transition shadow-xs cursor-pointer"
                  >
                    <Save size={12} />
                    <span>افزودن این مورد به مخزن تله‌ها</span>
                  </button>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-1.5">
                  <strong className="text-xs font-black text-slate-950 block">تحلیل جامع و منطق فنی پاسخگویی:</strong>
                  <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">
                    {activeQuestion.explanation}
                  </p>
                </div>
              </motion.div>
            )}

            {/* QUIZ NAVIGATION ACTIONS */}
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-3xl border border-slate-100 print:hidden">
              <button
                onClick={() => {
                  if (confirm("آیا مایل هستید آزمون را نیمه‌کاره رها کرده و به پنل پیکربندی بازگردید؟")) {
                    setQuizStarted(false);
                  }
                }}
                className="text-xs font-black text-slate-500 hover:text-rose-600 transition"
              >
                انصراف و خروج
              </button>

              <div className="flex items-center gap-3">
                {quizMode === "practice" && !isChecked && (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={userAnswers[currentQuestionIndex] === undefined}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl px-6 py-2.5 text-xs font-sans font-black transition shadow-md cursor-pointer"
                  >
                    ارزیابی و بررسی پاسخ
                  </button>
                )}

                {(quizMode === "exam" || isChecked) && (
                  <button
                    onClick={handleNextQuestion}
                    disabled={userAnswers[currentQuestionIndex] === undefined}
                    className="bg-slate-900 hover:bg-rose-600 disabled:opacity-40 text-white rounded-2xl px-8 py-2.5 text-xs font-sans font-black transition shadow-md flex items-center gap-1 cursor-pointer"
                  >
                    <span>{currentQuestionIndex < selectedQuestions.length - 1 ? 'سوال بعدی' : 'مشاهده کارنامه تراز'}</span>
                    <ChevronLeft size={14} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: IN-DEPTH SCORECARD ANALYSIS & REPORT CARD AT THE END */}
        {quizStarted && quizFinished && (
          <motion.div 
            key="quiz-finished-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Success percentage display banner */}
            {(() => {
              let correctCount = 0;
              selectedQuestions.forEach((q, idx) => {
                if (userAnswers[idx] === q.correctIdx) correctCount++;
              });
              const percent = Math.round((correctCount / selectedQuestions.length) * 100);

              let titleMsg = "نیاز به تقویت مجدد کایزن و تله‌شناسی";
              let colorClasses = "from-rose-50 to-amber-50 border-rose-100 text-rose-950";
              let badgeColor = "bg-rose-500 text-white";

              if (percent >= 80) {
                titleMsg = "شاهکار تله‌شناسی! شما در برابر شگردهای طراح کنکور ارشد برق ایمن شدید";
                colorClasses = "from-emerald-50 to-blue-50 border-emerald-100 text-slate-950";
                badgeColor = "bg-emerald-600 text-white";
              } else if (percent >= 50) {
                titleMsg = "سطح تسلط پایدار و متوسط؛ نیاز به جمع‌بندی نهایی";
                colorClasses = "from-amber-50 to-indigo-50 border-amber-200 text-amber-950";
                badgeColor = "bg-amber-500 text-white";
              }

              return (
                <div className={`bg-gradient-to-l ${colorClasses} rounded-3xl p-6 border shadow-xs space-y-4`}>
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div className="space-y-1">
                      <strong className="text-base font-black flex items-center gap-2">
                        <Award size={18} className="text-amber-500" />
                        <span>{titleMsg}</span>
                      </strong>
                      <p className="text-xs text-slate-500 font-bold">
                        تحلیل عملکرد شما در آزمون با دشواری «{difficultySetting}» بر روی سوالات تله‌دار با جامعه آماری خطا بالا
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Percent Circle */}
                      <div className="text-center">
                        <div className="text-3xl font-black font-mono text-slate-900">{toPersianNum(percent)}٪</div>
                        <div className="text-[9px] text-slate-400 font-bold">درصد پاسخگویی</div>
                      </div>
                      
                      <div className="text-center border-r border-slate-200 pr-4">
                        <div className="text-2xl font-black font-mono text-slate-800">{toPersianNum(correctCount)} از {toPersianNum(selectedQuestions.length)}</div>
                        <div className="text-[9px] text-slate-400 font-bold font-sans">تست‌های صحیح</div>
                      </div>
                    </div>
                  </div>

                  {/* Progressive action suggest */}
                  <div className="bg-white/80 p-3.5 rounded-2xl text-xs font-bold leading-relaxed border border-slate-100 flex items-start gap-1.5">
                    <span>💡</span>
                    <div>
                      <strong className="font-semibold text-slate-900 block mb-0.5">شرح روانشناسی مطالعاتی شما:</strong>
                      {percent >= 80 ? (
                        <span>دقت علمی بالای شما نشان از تسلط بی‌نظیر بر قضایای مداری و تفکیک پاسخ‌های گذرا از حالت ماندگار است. پایداری این ریتم مطالعاتی، تراز بالاتر از ۷,۰۰۰ کنکور را تضمین میکند.</span>
                      ) : percent >= 50 ? (
                        <span>شما در برخی تله‌ها خوب عمل کردید اما بازی با معادلات طراح هنوز میتواند شما را منحرف کند. توصیه مربی این است که سوالات نادرست خود را همین حالا در مخزن تله‌ها ثبت کرده و مجدداً بازبینی کنید.</span>
                      ) : (
                        <span>شکل نگرفتن اراده قطعی در تفکیک پارامترهای سیستمی سبب بیشترین خطاها شده است. به جای حل تست جدید، ابتدا ساختارهای صریح حل تشریحی آزمونیار را مطالعه و سپس از آزمون‌های آموزشی مجدد استفاده کنید.</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* DETAILED QUESTION-BY-QUESTION REVIEW WITH SAVE OPTION */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-900">دفترچه تحلیل سوالات شبیه‌ساز سفارشی:</h3>
              
              <div className="space-y-4">
                {selectedQuestions.map((q, idx) => {
                  const userAnswer = userAnswers[idx];
                  const isUserCorrect = userAnswer === q.correctIdx;

                  return (
                    <div 
                      key={q.id}
                      className={`bg-white p-5 rounded-3xl border transition-all ${
                        isUserCorrect ? 'border-emerald-200 bg-white/70' : 'border-rose-200 bg-rose-50/10'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isUserCorrect ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          <strong className="text-xs font-black text-slate-900">{q.title}</strong>
                        </div>
                        <span className="p-1 px-2.5 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500">{q.subject}</span>
                      </div>

                      <p className="text-xs font-bold text-slate-700 leading-relaxed mb-3">
                        {q.text}
                      </p>

                      {/* Options highlights */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-bold">
                        {q.options.map((opt, oIdx) => {
                          const isCorrectOpt = oIdx === q.correctIdx;
                          const isUserSelected = userAnswer === oIdx;

                          let bgOptionClass = "bg-slate-50 border border-slate-100 text-slate-500";
                          if (isCorrectOpt) {
                            bgOptionClass = "bg-emerald-50 border border-emerald-300 text-emerald-950 font-black";
                          } else if (isUserSelected) {
                            bgOptionClass = "bg-rose-50 border border-rose-300 text-rose-950";
                          }

                          return (
                            <div key={oIdx} className={`p-2 px-3 rounded-lg flex justify-between items-center ${bgOptionClass}`}>
                              <span>{opt}</span>
                              {isCorrectOpt && <span className="text-[8px] bg-emerald-600 text-white font-sans px-1.5 py-0.5 rounded-md font-black shrink-0">پاسخ صحیح</span>}
                              {isUserSelected && !isCorrectOpt && <span className="text-[8px] bg-rose-600 text-white font-sans px-1.5 py-0.5 rounded-md font-black shrink-0">پاسخ شما</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation box */}
                      <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2">
                        <div className="flex justify-between items-center gap-2 flex-wrap text-[10px] text-slate-500 font-extrabold pr-1">
                          <span className="flex items-center gap-1">
                            <Lightbulb size={12} className="text-amber-500" />
                            <span>مکانیسم فریب تله: {q.trapType}</span>
                          </span>

                          <button
                            onClick={() => handleQuickSaveTrap(q)}
                            className="bg-indigo-900 hover:bg-slate-900 text-white text-[9px] font-sans px-2.5 py-1 rounded-md tracking-tight flex items-center gap-1 cursor-pointer"
                          >
                            <Save size={10} />
                            <span>ثبت در خزانه‌ تله‌ها</span>
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-bold">
                          {q.explanation}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="flex justify-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 print:hidden">
              <button
                onClick={() => setQuizStarted(false)}
                className="bg-slate-900 hover:bg-rose-600 text-white rounded-2xl px-8 py-3 font-sans font-black text-xs transition shadow-lg hover:shadow-rose-100 cursor-pointer"
              >
                بازگشت به منو و آزمون جدید
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
