import { useState, useEffect, useMemo } from "react";
import { Table, Brain, Smile, CalendarCheck, ShieldCheck, Download, Sparkles, AlertCircle, Share2, ClipboardList, Clock, Activity, Zap, Plus, Target, FileText, Mic, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Student, Exam, Weakness, PsychologicalAnalysis, DailyPlan } from "../types";
import { getTestTraps, saveTestTrap } from "../lib/traps";
import { addSystemLog } from "../lib/syslogs";
import ReportCardPrintModal from "./ReportCardPrintModal";
import RadarChart from "./RadarChart";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const fatigueValue = data["میزان خستگی"] || 0;
    const hasteValue = data["شاخص شتاب‌زدگی"] || 0;
    const hesitationValue = data["شاخص تردید"] || 0;
    
    let stressLabel = "ایمن و با تمرکز بالا";
    let stressColorClass = "text-emerald-500 font-black";
    let dotColorClass = "bg-emerald-500";

    if (fatigueValue > 70) {
      stressLabel = "خستگی مفرط ذهنی";
      stressColorClass = "text-rose-500 font-black";
      dotColorClass = "bg-rose-500 animate-pulse";
    } else if (fatigueValue > 45) {
      stressLabel = "خستگی مرزی";
      stressColorClass = "text-amber-500 font-bold";
      dotColorClass = "bg-amber-500";
    } else if (fatigueValue > 25) {
      stressLabel = "خستگی خفیف مطالعاتی";
      stressColorClass = "text-blue-500 font-semibold";
      dotColorClass = "bg-blue-400";
    }

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl border border-slate-800 shadow-2xl text-right font-sans text-xs space-y-2.5 max-w-[240px]" dir="rtl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-2">
          <span className="font-black text-slate-100 text-[11px] truncate max-w-[150px]">{data.fullTitle}</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">{data.date}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>خستگی ذهنی داوطلب:</span>
            </span>
            <span className={`font-mono text-sm font-black ${stressColorClass}`}>
              {fatigueValue}٪
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>شاخص شتاب‌زدگی تستی:</span>
            </span>
            <span className="font-mono text-xs font-bold text-rose-400">
              {hasteValue}٪
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>شاخص تردید گزینه‌ای:</span>
            </span>
            <span className="font-mono text-xs font-bold text-amber-400">
              {hesitationValue}٪
            </span>
          </div>
          
          <div className="flex items-center justify-end gap-1.5 text-[10px] pt-1 border-t border-slate-800/40">
            <span className="text-slate-400">وضعیت تمرکز داوطلب:</span>
            <span className={`${stressColorClass} font-bold`}>{stressLabel}</span>
            <span className={`w-2 h-2 rounded-full ${dotColorClass}`}></span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-350">
          <span>تراز مانیتورینگ عملکرد:</span>
          <span className="font-mono text-slate-100 font-extrabold">{data.traz}</span>
        </div>
      </div>
    );
  }
  return null;
};

interface ReportCardViewProps {
  student: Student;
  onNavigate?: (view: any) => void;
}

export default function ReportCardView({ student, onNavigate }: ReportCardViewProps) {
  const [selectedExamId, setSelectedExamId] = useState("1");
  const [activeTab, setActiveTab] = useState<"numeric" | "ai" | "psychology" | "remedial" | "custom_test">("numeric");
  const [loading, setLoading] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [psychological, setPsychological] = useState<PsychologicalAnalysis | null>(null);
  const [remedialPlan, setRemedialPlan] = useState<DailyPlan[]>([]);
  const [estimatedTraz, setEstimatedTraz] = useState<number>(0);

  // --- PDF AND SHARING MODAL STATES ---
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [parentPhone, setParentPhone] = useState("09121111111");
  const [shareMedium, setShareMedium] = useState<"sms" | "eitaa" | "bale" | "telegram">("sms");
  const [isSharing, setIsSharing] = useState(false);
  const [wasShared, setWasShared] = useState(false);
  const [shareProgressMsg, setShareProgressMsg] = useState("");
  const [includeGuidelines, setIncludeGuidelines] = useState({
    pomodoro: true,
    mentalPeace: true,
    kaizenFollowup: true,
    mobileLimit: true,
    emotionalSupport: true,
  });

  // Helper helper to convert numbers to Persian digits
  const toPersianNum = (n: number | string): string => {
    return n.toString().replace(/\d/g, (x) => "۰۱۲۳۴۵۶۷۸۹"[+x]);
  };

  // --- CUSTOM PERSONALIZED EXAM BUILDER STATES ---
  const [testPhase, setTestPhase] = useState<"config" | "running" | "result">("config");
  const [selectedCustomSubjects, setSelectedCustomSubjects] = useState<string[]>([]);
  const [testQuestionsCount, setTestQuestionsCount] = useState<number>(3);
  const [testDifficulty, setTestDifficulty] = useState<"simple" | "medium" | "hard">("medium");
  const [testTimer, setTestTimer] = useState<number>(180);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [savedTrapQuestionIds, setSavedTrapQuestionIds] = useState<Record<string, boolean>>({});

  interface BuiltQuestion {
    id: string;
    subject: string;
    text: string;
    options: string[];
    correctIdx: number;
    explanation: string;
    trapCategory: string;
  }
  const [currentTestQuestions, setCurrentTestQuestions] = useState<BuiltQuestion[]>([]);

  interface CustomTestResult {
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    emptyCount: number;
    scorePercent: number;
    estimatedTraz: number;
    bySubject: Record<string, { correct: number; wrong: number; empty: number; score: number }>;
  }
  const [customTestResult, setCustomTestResult] = useState<CustomTestResult | null>(null);

  // Dynamic exams list to align with student field (comp_master, elec_phd, elec_master, mba_master)
  const mockExams: Exam[] = useMemo(() => {
    if (student.field === "comp_master") {
      return [
        {
          id: "1",
          date: "۱۵ فروردین ۱۴۰۵",
          title: "شبیه‌ساز جامع ۱ کارشناسی ارشد مهندسی کامپیوتر - گرایش هوش مصنوعی",
          traz: 5240,
          rank: 2450,
          overallPercentage: 51,
          lessons: [
            { lessonName: "ریاضیات تخصصی و آمار", percentage: 20, correct: 8, wrong: 18, empty: 14 },
            { lessonName: "نظریه زبان‌ها و سیگنال‌ها", percentage: 25, correct: 10, wrong: 20, empty: 10 },
            { lessonName: "ساختمان داده‌ها و الگوریتم‌ها", percentage: 30, correct: 12, wrong: 18, empty: 10 },
            { lessonName: "هوش مصنوعی و یادگیری ماشین", percentage: 65, correct: 26, wrong: 8, empty: 6 }
          ]
        },
        {
          id: "2",
          date: "۱۵ اردیبهشت ۱۴۰۵",
          title: "شبیه‌ساز جامع ۲ کارشناسی ارشد مهندسی کامپیوتر - هوش مصنوعی آزمونیار",
          traz: 5575,
          rank: 1845,
          overallPercentage: 59,
          lessons: [
            { lessonName: "ریاضیات تخصصی و آمار", percentage: 25, correct: 10, wrong: 15, empty: 15 },
            { lessonName: "نظریه زبان‌ها و سیگنال‌ها", percentage: 32, correct: 12, wrong: 18, empty: 10 },
            { lessonName: "ساختمان داده‌ها و الگوریتم‌ها", percentage: 41, correct: 16, wrong: 14, empty: 10 },
            { lessonName: "هوش مصنوعی و یادگیری ماشین", percentage: 72, correct: 28, wrong: 5, empty: 7 }
          ]
        },
        {
          id: "3",
          date: "۲۹ اردیبهشت ۱۴۰۵",
          title: "آزمون کایزن دوره‌ای ارشد مهندسی کامپیوتر و هوش پیشرفته",
          traz: 5720,
          rank: 1410,
          overallPercentage: 63,
          lessons: [
            { lessonName: "ریاضیات تخصصی و آمار", percentage: 35, correct: 14, wrong: 12, empty: 14 },
            { lessonName: "نظریه زبان‌ها و سیگنال‌ها", percentage: 45, correct: 18, wrong: 12, empty: 10 },
            { lessonName: "ساختمان داده‌ها و الگوریتم‌ها", percentage: 52, correct: 20, wrong: 10, empty: 10 },
            { lessonName: "هوش مصنوعی و یادگیری ماشین", percentage: 75, correct: 30, wrong: 4, empty: 6 }
          ]
        },
        {
          id: "4",
          date: "۲۵ خرداد ۱۴۰۵",
          title: "آزمون جامع نهایی شبیه‌ساز کنکور سراسری کارشناسی ارشد هوش مصنوعی",
          traz: 6180,
          rank: 890,
          overallPercentage: 74,
          lessons: [
            { lessonName: "ریاضیات تخصصی و آمار", percentage: 55, correct: 22, wrong: 8, empty: 10 },
            { lessonName: "نظریه زبان‌ها و سیگنال‌ها", percentage: 65, correct: 26, wrong: 6, empty: 8 },
            { lessonName: "ساختمان داده‌ها و الگوریتم‌ها", percentage: 72, correct: 29, wrong: 5, empty: 6 },
            { lessonName: "هوش مصنوعی و یادگیری ماشین", percentage: 85, correct: 34, wrong: 2, empty: 4 }
          ]
        }
      ];
    } else if (student.field === "elec_phd") {
      return [
        {
          id: "1",
          date: "۱۵ فروردین ۱۴۰۵",
          title: "شبیه‌ساز آزمون جامع دکتری تخصصی (Ph.D) مهندسی برق شماره ۱",
          traz: 5240,
          rank: 450,
          overallPercentage: 51,
          resumeScore: 65,
          interviewScore: 58,
          researchPotential: 60,
          lessons: [
            { lessonName: "ریاضیات مهندسی پیشرفته", percentage: 20, correct: 8, wrong: 18, empty: 14 },
            { lessonName: "نظریه سیستم‌های کنترل خطی", percentage: 25, correct: 10, wrong: 20, empty: 10 },
            { lessonName: "استعداد تحصیلی و زبان دکتری", percentage: 30, correct: 12, wrong: 18, empty: 10 },
            { lessonName: "فرآیندهای تصادفی پیشرفته", percentage: 65, correct: 26, wrong: 8, empty: 6 }
          ]
        },
        {
          id: "2",
          date: "۱۵ اردیبهشت ۱۴۰۵",
          title: "شبیه‌ساز دکتری تخصصی (Ph.D) مهندسی برق شماره ۲ - آزمونیار",
          traz: 5575,
          rank: 345,
          overallPercentage: 59,
          resumeScore: 68,
          interviewScore: 62,
          researchPotential: 65,
          lessons: [
            { lessonName: "ریاضیات مهندسی پیشرفته", percentage: 25, correct: 10, wrong: 15, empty: 15 },
            { lessonName: "نظریه سیستم‌های کنترل خطی", percentage: 32, correct: 12, wrong: 18, empty: 10 },
            { lessonName: "استعداد تحصیلی و زبان دکتری", percentage: 41, correct: 16, wrong: 14, empty: 10 },
            { lessonName: "فرآیندهای تصادفی پیشرفته", percentage: 72, correct: 28, wrong: 5, empty: 7 }
          ]
        },
        {
          id: "3",
          date: "۲۹ اردیبهشت ۱۴۰۵",
          title: "آزمون مربیگری دوره‌ای دکتری برق - سیستم و کنترل",
          traz: 5720,
          rank: 210,
          overallPercentage: 63,
          resumeScore: 72,
          interviewScore: 70,
          researchPotential: 75,
          lessons: [
            { lessonName: "ریاضیات مهندسی پیشرفته", percentage: 35, correct: 14, wrong: 12, empty: 14 },
            { lessonName: "نظریه سیستم‌های کنترل خطی", percentage: 45, correct: 18, wrong: 12, empty: 10 },
            { lessonName: "استعداد تحصیلی و زبان دکتری", percentage: 52, correct: 20, wrong: 10, empty: 10 },
            { lessonName: "فرآیندهای تصادفی پیشرفته", percentage: 75, correct: 30, wrong: 4, empty: 6 }
          ]
        },
        {
          id: "4",
          date: "۲۵ خرداد ۱۴۰۵",
          title: "شبیه‌ساز نهایی وزارت علوم کنکور دکتری برق سراسری",
          traz: 6580,
          rank: 24,
          overallPercentage: 78,
          resumeScore: 85,
          interviewScore: 82,
          researchPotential: 88,
          lessons: [
            { lessonName: "ریاضیات مهندسی پیشرفته", percentage: 65, correct: 26, wrong: 6, empty: 8 },
            { lessonName: "نظریه سیستم‌های کنترل خطی", percentage: 72, correct: 29, wrong: 5, empty: 6 },
            { lessonName: "استعداد تحصیلی و زبان دکتری", percentage: 85, correct: 34, wrong: 2, empty: 4 },
            { lessonName: "فرآیندهای تصادفی پیشرفته", percentage: 90, correct: 36, wrong: 1, empty: 3 }
          ]
        }
      ];
    } else if (student.field === "elec_master") {
      return [
        {
          id: "1",
          date: "۱۵ فروردین ۱۴۰۵",
          title: "آزمون شبیه‌ساز ۱ کارشناسی ارشد مهندسی برق - کانون آزمونیار",
          traz: 5240,
          rank: 2450,
          overallPercentage: 51,
          lessons: [
            { lessonName: "ریاضیات مهندسی و معادلات", percentage: 20, correct: 8, wrong: 18, empty: 14 },
            { lessonName: "مدارهای الکتریکی ۱ و ۲", percentage: 25, correct: 10, wrong: 20, empty: 10 },
            { lessonName: "سیگنال‌ها و سیستم‌ها", percentage: 30, correct: 12, wrong: 18, empty: 10 },
            { lessonName: "الکترونیک و کنترل خطی", percentage: 65, correct: 26, wrong: 8, empty: 6 }
          ]
        },
        {
          id: "2",
          date: "۱۵ اردیبهشت ۱۴۰۵",
          title: "آزمون شبیه‌ساز ۲ کارشناسی ارشد مهندسی برق - دپارتما‌ن ارشد آزمونیار",
          traz: 5575,
          rank: 1845,
          overallPercentage: 59,
          lessons: [
            { lessonName: "ریاضیات مهندسی و معادلات", percentage: 25, correct: 10, wrong: 15, empty: 15 },
            { lessonName: "مدارهای الکتریکی ۱ و ۲", percentage: 32, correct: 12, wrong: 18, empty: 10 },
            { lessonName: "سیگنال‌ها و سیستم‌ها", percentage: 41, correct: 16, wrong: 14, empty: 10 },
            { lessonName: "الکترونیک و کنترل خطی", percentage: 72, correct: 28, wrong: 5, empty: 7 }
          ]
        },
        {
          id: "3",
          date: "۲۹ اردیبهشت ۱۴۰۵",
          title: "آزمون جامع بهاره کارشناسی ارشد برق دولتی",
          traz: 5720,
          rank: 1410,
          overallPercentage: 63,
          lessons: [
            { lessonName: "ریاضیات مهندسی و معادلات", percentage: 35, correct: 14, wrong: 12, empty: 14 },
            { lessonName: "مدارهای الکتریکی ۱ و ۲", percentage: 45, correct: 18, wrong: 12, empty: 10 },
            { lessonName: "سیگنال‌ها و سیستم‌ها", percentage: 52, correct: 20, wrong: 10, empty: 10 },
            { lessonName: "الکترونیک و کنترل خطی", percentage: 75, correct: 30, wrong: 4, empty: 6 }
          ]
        },
        {
          id: "4",
          date: "۲۵ خرداد ۱۴۰۵",
          title: "شبیه‌ساز جامع نهایی سازمان سنجش کارشناسی ارشد مهندسی برق",
          traz: 6180,
          rank: 890,
          overallPercentage: 74,
          lessons: [
            { lessonName: "ریاضیات مهندسی و معادلات", percentage: 55, correct: 22, wrong: 8, empty: 10 },
            { lessonName: "مدارهای الکتریکی ۱ و ۲", percentage: 65, correct: 26, wrong: 6, empty: 8 },
            { lessonName: "سیگنال‌ها و سیستم‌ها", percentage: 72, correct: 29, wrong: 5, empty: 6 },
            { lessonName: "الکترونیک و کنترل خطی", percentage: 85, correct: 34, wrong: 2, empty: 4 }
          ]
        }
      ];
    } else {
      // mba_master
      return [
        {
          id: "1",
          date: "۱۵ فروردین ۱۴۰۵",
          title: "آزمون شبیه‌ساز ۱ کارشناسی ارشد مدیریت کسب‌وکار (MBA)",
          traz: 5240,
          rank: 2450,
          overallPercentage: 51,
          lessons: [
            { lessonName: "GMAT استعداد و آمادگی تحصیلی", percentage: 20, correct: 8, wrong: 18, empty: 14 },
            { lessonName: "زبان تخصصی مدیریت", percentage: 30, correct: 12, wrong: 18, empty: 10 },
            { lessonName: "ریاضیات عمومی ۱ و ۲", percentage: 65, correct: 26, wrong: 8, empty: 6 }
          ]
        },
        {
          id: "2",
          date: "۱۵ اردیبهشت ۱۴۰۵",
          title: "آزمون شبیه‌ساز ۲ کارشناسی ارشد مدیریت کسب‌وکار (MBA) شریف",
          traz: 5575,
          rank: 1845,
          overallPercentage: 59,
          lessons: [
            { lessonName: "GMAT استعداد و آمادگی تحصیلی", percentage: 32, correct: 12, wrong: 18, empty: 10 },
            { lessonName: "زبان تخصصی مدیریت", percentage: 41, correct: 16, wrong: 14, empty: 10 },
            { lessonName: "ریاضیات عمومی ۱ و ۲", percentage: 72, correct: 28, wrong: 5, empty: 7 }
          ]
        },
        {
          id: "3",
          date: "۲۹ اردیبهشت ۱۴۰۵",
          title: "آزمون کایزن مربیگری ارشد مدیریت MBA آزمونیار",
          traz: 5720,
          rank: 1410,
          overallPercentage: 63,
          lessons: [
            { lessonName: "GMAT استعداد و آمادگی تحصیلی", percentage: 45, correct: 18, wrong: 12, empty: 10 },
            { lessonName: "زبان تخصصی مدیریت", percentage: 52, correct: 20, wrong: 10, empty: 10 },
            { lessonName: "ریاضیات عمومی ۱ و ۲", percentage: 75, correct: 30, wrong: 4, empty: 6 }
          ]
        },
        {
          id: "4",
          date: "۲۵ خرداد ۱۴۰۵",
          title: "آزمون شبیه‌ساز نهایی سنجش مدیریت ارشد MBA دانشگاه تهران",
          traz: 6180,
          rank: 890,
          overallPercentage: 74,
          lessons: [
            { lessonName: "GMAT استعداد و آمادگی تحصیلی", percentage: 65, correct: 26, wrong: 6, empty: 8 },
            { lessonName: "زبان تخصصی مدیریت", percentage: 72, correct: 29, wrong: 5, empty: 6 },
            { lessonName: "ریاضیات عمومی ۱ و ۲", percentage: 85, correct: 34, wrong: 2, empty: 4 }
          ]
        }
      ];
    }
  }, [student.field]);

  const calculateExamStressLevel = (exam: Exam): number => {
    const totalWrong = exam.lessons.reduce((sum, s) => sum + (s.wrong || 0), 0);
    const totalCorrect = exam.lessons.reduce((sum, s) => sum + (s.correct || 0), 0);
    const totalEmpty = exam.lessons.reduce((sum, s) => sum + (s.empty || 0), 0);
    const totalQuestions = totalWrong + totalCorrect + totalEmpty || 1;

    const wrongRatio = totalWrong / totalQuestions;
    const emptyRatio = totalEmpty / totalQuestions;
    return Math.min(95, Math.max(15, Math.floor((wrongRatio * 0.75 + emptyRatio * 0.25) * 100 + 10)));
  };

  const currentExam = mockExams.find(e => e.id === selectedExamId) || mockExams[0];

  useEffect(() => {
    triggerAiAnalysis(currentExam);
  }, [selectedExamId]);

  const fetchWithRetry = async (url: string, options?: RequestInit, retries = 3, delay = 600): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      if (!response.ok && retries > 0 && [500, 502, 503, 504].includes(response.status)) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 1.5);
      }
      return response;
    } catch (err) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 1.5);
      }
      throw err;
    }
  };

  const triggerAiAnalysis = async (examToAnalyze: Exam) => {
    setLoading(true);
    try {
      const res = await fetchWithRetry("/api/analyze-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessons: examToAnalyze.lessons,
          field: student.field
        })
      });
      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }
      const data = await res.json();
      setWeaknesses(data.weaknesses || []);
      setPsychological(data.psychological || null);
      setRemedialPlan(data.remedialPlan || []);
      setEstimatedTraz(data.estimatedNextTraz || 0);
    } catch (err) {
      console.warn("AI Analysis request failed, loading fallback local metrics for engineering candidates...", err);
      
      const subjects = examToAnalyze.lessons || [];
      const weakSubjects = [...subjects].sort((a, b) => (a.percentage || 0) - (b.percentage || 0)).slice(0, 3);
      
      const computedStressLevel = calculateExamStressLevel(examToAnalyze);
      
      let simulatedStressLabel: "بحرانی" | "متوسط" | "سالم" | "خفیف" = "سالم";
      let simulatedTechnicalDetail = "";
      if (computedStressLevel > 70) {
        simulatedStressLabel = "بحرانی";
        simulatedTechnicalDetail = "به دلیل موازنه ناکافی میان ساعات کاری مطالعاتی و استراحت، میزان فرسودگی ذهنی بالا گزارش شده و تله‌های تحلیل مداری حاد بوده است.";
      } else if (computedStressLevel > 45) {
        simulatedStressLabel = "متوسط";
        simulatedTechnicalDetail = "تست‌زنی سرعتی در دقایق پایانی آزمون آزمایشی سبب افت ملموس تراز در بخش کنترل خطی گردیده است.";
      } else if (computedStressLevel > 25) {
        simulatedStressLabel = "خفیف";
        simulatedTechnicalDetail = "تمرکز داوطلب در پاسخ‌گویی به سوالات ریاضیات مهندسی کاملا مطلوب است، اما در مبحث تبدیل فوریه نیاز به تمرکز پومودورو دارد.";
      } else {
        simulatedStressLabel = "سالم";
        simulatedTechnicalDetail = "عملکرد ذهنی عالی بدون بروز تردید تستی عمیق؛ تمرکز داوطلب در بالاترین سطح ارزیابی شد.";
      }

      const totalWrong = subjects.reduce((sum, s) => sum + (s.wrong || 0), 0);
      const totalCorrect = subjects.reduce((sum, s) => sum + (s.correct || 0), 0);
      const totalEmpty = subjects.reduce((sum, s) => sum + (s.empty || 0), 0);
      const totalQuestions = totalWrong + totalCorrect + totalEmpty || 1;
      const wrongRatio = totalWrong / totalQuestions;

      const simAvgResponseTimeWrong = Math.round(55 + wrongRatio * 40);
      const simAvgResponseTimeCorrect = Math.round(40 + (1 - wrongRatio) * 10);
      const simConsecutiveErrors = Math.min(10, Math.floor(wrongRatio * 15 + 1));

      setPsychological({
        pattern: computedStressLevel > 60 ? "خستگی ذهنی حاد پومودورو (آفلاین)" : "تطابق تمرکزی عالی در آزمون‌های تستی (آفلاین)",
        description: `مهندس گرامی؛ سنجش‌ها نشان می‌دهد نوسانات راندمان پاسخ‌دهی به علت کمبود استراحت بین شیفت‌های مطالعاتی بروز کرده و خستگی ذهنی معادل ${computedStressLevel}٪ ثبت شده است که عمیقا سرعت پردازش گزینه‌ها را در مدارهای الکتریکی پایین می‌برد.`,
        correctToWrongRate: Math.max(12, Math.round(wrongRatio * 100)),
        suggestion: computedStressLevel > 60 
          ? "کاهش پارت‌های مطالعاتی پیوسته به فرکانس‌های ۲۵ دقیقه‌ای پومودورو و تخصیص ۵ دقیقه استراحت پویا بدون گوشی تلفن همراه." 
          : "ادامه همان فرآیند مطالعه حل تشریحی از روی شرح مفهومی آزمونیار به همراه مرور در روزهای پنجشنبه.",
        cardColor: computedStressLevel > 70 ? "red" : computedStressLevel > 45 ? "orange" : computedStressLevel > 25 ? "amber" : "blue",
        stressLevel: computedStressLevel,
        stressAnalysis: {
          avgResponseTimeWrong: simAvgResponseTimeWrong,
          avgResponseTimeCorrect: simAvgResponseTimeCorrect,
          consecutiveErrorsCount: simConsecutiveErrors,
          stressLabel: simulatedStressLabel,
          technicalDetail: simulatedTechnicalDetail
        }
      });

      const localWeaknesses = weakSubjects.map((sub) => {
        let topic = "مباحث تحلیلی آزمون";
        let rec = "مرور درسنامه‌های تخصصی آزمونیار و حل تست‌های طبقه‌بندی شده سالیان گذشته.";
        let questions = 30;
        let severity: "critical" | "warning" | "mild" = "warning";

        if (sub.lessonName.includes("مدارهای الکتریکی")) {
          topic = "تحلیل گذرا در سیستم‌های مرتبه دوم";
          rec = "پیشنهاد می‌شود ابتدا درسنامه طلایی آزمونیار مبحث مدارهای مرتبه دوم را مطالعه نموده و سپس تست‌های سراسری سال‌های ۹۸ تا ۱۴۰۴ را تحلیل کنید.";
          questions = 45;
          severity = sub.percentage < 35 ? "critical" : "warning";
        } else if (sub.lessonName.includes("سیگنال")) {
          topic = "تبدیل فوریه و خواص کانولوشن";
          rec = "تمرکز مجدد روی فرمول‌های پایه سری فوریه؛ تحلیل ۳۰ تست طبقه‌بندی مکرر آزمونیار.";
          questions = 40;
          severity = sub.percentage < 45 ? "critical" : "warning";
        } else if (sub.lessonName.includes("ماشین")) {
          topic = "مدار معادل و راندمان ترانسفورمر";
          rec = "یادداشت نکات طلایی دیاگرام فیزوری؛ حل و تحلیل ۲۰ تست تشریحی کایزن.";
          questions = 35;
          severity = sub.percentage < 40 ? "critical" : "warning";
        } else if (sub.lessonName.includes("کنترل")) {
          topic = "پایداری نایکوئیست و حاشیه فاز";
          rec = "مرور مکرر قضایای پایداری؛ تحلیل ۳۵ تست زمان‌دار آزمون‌های آزمایشی.";
          questions = 35;
          severity = sub.percentage < 40 ? "critical" : "warning";
        } else if (sub.lessonName.includes("مغناطیس")) {
          topic = "قانون بیو-ساوار و پتانسیل مغناطیسی";
          rec = "تمرکز روی قضایای مرزی و میدان‌های القایی؛ بررسی ۴۰ تست کنکوری کایزن.";
          questions = 40;
          severity = sub.percentage < 40 ? "critical" : "warning";
        }

        return {
          subject: sub.lessonName,
          topic,
          recommendation: rec,
          questions,
          percentage: sub.percentage,
          severity
        };
      });

      setWeaknesses(localWeaknesses);
      setEstimatedTraz(Math.round(5200 + (totalCorrect / totalQuestions) * 2000));
      setRemedialPlan(localWeaknesses.map(lw => ({
        subject: lw.subject,
        focusArea: lw.topic,
        task: lw.recommendation,
        done: false
      })));
    } finally {
      setLoading(false);
    }
  };

  // --- COMPLETE CONFIGURABLE QUESTIONS REGISTER ---
  const QUESTIONS_POOL: BuiltQuestion[] = [
    {
      id: "Q-1",
      subject: "مدارهای الکتریکی",
      text: "در یک مدار مرتبه اول RL، ثابت زمانی (tau) چگونه محاسبه می‌شود؟",
      options: [
        "۱. L * R",
        "۲. L / R",
        "۳. R / L",
        "۴. 1 / (L * R)"
      ],
      correctIdx: 1,
      explanation: "ثابت زمانی در مدار RL برابر با نسبت اندوکتانس به مقاومت معادل تونی دیده‌شده از دو سر سلف است.",
      trapCategory: "تله فرمول پایه ثابت زمانی"
    },
    {
      id: "Q-2",
      subject: "سیگنال‌ها و سیستم‌ها",
      text: "تبدیل فوریه سیگنال پالس واحد (Rect) در حوزه فرکانس به چه صورتی است؟",
      options: [
        "۱. تابع Sinc",
        "۲. تابع ضربه",
        "۳. پله واحد",
        "۴. مثلثی"
      ],
      correctIdx: 0,
      explanation: "تبدیل فوریه یک پنجره مستطیلی در زمان، یک تابع Sinc در فرکانس است.",
      trapCategory: "تله زوج تبدیل‌های معروف"
    },
    {
      id: "Q-3",
      subject: "فیزیک",
      text: "متحرکی در مسیر مستقیم با شتاب ثابت از حال سکون حرکت می‌کند. اگر مسافت طی شده در ثانیه سوم معادل ۵ متر باشد، شتاب حرکت چند متر بر مجذور ثانیه است؟",
      options: [
        "۱. ۲ متر بر ثانیه مربع",
        "۲. ۱.۵ متر بر ثانیه مربع",
        "۳. ۳ متر بر ثانیه مربع",
        "۴. ۴ متر بر ثانیه مربع"
      ],
      correctIdx: 0,
      explanation: "فرمول مسافت در ثانیه nام: Δx_n = a/2(2n - 1) + v0 است. با جایگذاری n=3 و v0=0 داریم: 5 = a/2(5) که شتاب برابر ۲ به دست می‌آید. داوطلبان نباید فرمول کل مسافت بازه را با ثانیه منفرد اشتباه بگیرند.",
      trapCategory: "تله فرمول ثانیه nام با مسافت کل"
    },
    {
      id: "Q-4",
      subject: "ریاضیات مهندسی",
      text: "در بسط سری فوریه یک تابع زوج، کدام یک از ضرایب همواره صفر است؟",
      options: [
        "۱. ضرایب کوسینوسی (a_n)",
        "۲. مقادیر ثابت (a_0)",
        "۳. ضرایب سینوسی (b_n)",
        "۴. هیچکدام"
      ],
      correctIdx: 2,
      explanation: "توابع زوج دارای بسط سری فوریه کوسینوسی هستند، بنابراین تمام ضرایب سینوسی (b_n) برای آن‌ها صفر است.",
      trapCategory: "تله تفکیک خواص تابع زوج و فرد در سری فوریه"
    },
    {
      id: "Q-11",
      subject: "مدارهای الکتریکی",
      text: "در یک مدار مرتبه دوم که دارای پاسخ ضربه h(t) = e^-2t sin(3t) u(t) است، فرکانس نوسانات آزاد میرا (Damped Natural Frequency) چقدر است؟",
      options: [
        "۱. ۲ رادیان بر ثانیه",
        "۲. ۳ رادیان بر ثانیه",
        "۳. ۵ رادیان بر ثانیه",
        "۴. √۱۳ رادیان بر ثانیه"
      ],
      correctIdx: 1,
      explanation: "در فرم عمومی پاسخ میرای نوسانی e^-at sin(wt)، ضریب w نشان‌دهنده فرکانس نوسانات آزاد میرا است. در اینجا w=3 می‌باشد.",
      trapCategory: "تله تشخیص فرکانس نوسانی از ضریب میرایی"
    },
    {
      id: "Q-12",
      subject: "الکترونیک",
      text: "در یک تقویت‌کننده امیتر مشترک با مقاومت در شاخه امیتر (بدون خازن بای‌پس)، فیدبک اعمال شده از چه نوعی است؟",
      options: [
        "۱. ولتاژ - سری",
        "۲. جریان - سری",
        "۳. ولتاژ - موازی",
        "۴. جریان - موازی"
      ],
      correctIdx: 1,
      explanation: "مقاومت شاخه امیتر جریانی متناسب با جریان خروجی نمونه‌گیری کرده و به صورت سری در ورودی قرار می‌دهد، لذا فیدبک جریان-سری است.",
      trapCategory: "تله تشخیص نوع فیدبک در تقویت‌کننده‌ها"
    },
    {
      id: "Q-13",
      subject: "سیگنال‌ها و سیستم‌ها",
      text: "تبدیل فوریه سیگنال x(t) = sinc^2(t) در فرکانس صفر (w=0) چه مقداری دارد؟ (با فرض تعریف استاندارد sinc(t) = sin(pi*t)/(pi*t))",
      options: [
        "۱. صفر",
        "۲. یک",
        "۳. دو",
        "۴. نصف"
      ],
      correctIdx: 1,
      explanation: "طبق قضیه مساحت، مقدار تبدیل فوریه در فرکانس صفر برابر است با انتگرال سیگنال در حوزه زمان. انتگرال sinc^2(t) از منفی بی‌نهایت تا مثبت بی‌نهایت برابر ۱ است.",
      trapCategory: "تله قضیه مساحت در تبدیل فوریه"
    },
    {
      id: "Q-14",
      subject: "کنترل خطی",
      text: "یک سیستم حلقه‌بسته با فیدبک واحد دارای تابع تبدیل حلقه‌باز G(s) = K / (s(s+2)(s+4)) است. به ازای چه مقدار K سیستم در آستانه ناپایداری قرار می‌گیرد؟",
      options: [
        "۱. K = 8",
        "۲. K = 24",
        "۳. K = 48",
        "۴. K = 12"
      ],
      correctIdx: 2,
      explanation: "با استفاده از جدول راث-هرویتز برای معادله مشخصه s^3 + 6s^2 + 8s + K = 0، شرط پایداری 6*8 > K است، بنابراین K=48 مقدار بحرانی است.",
      trapCategory: "تله محاسباتی در پایداری راث-هرویتز"
    },
    {
      id: "Q-6",
      subject: "ماشین‌های الکتریکی",
      text: "در یک ماشین جریان مستقیم (DC)، کموتاسیون به چه معناست؟",
      options: [
        "۱. تبدیل جریان متناوب القا شده در آرمیچر به جریان مستقیم در خروجی",
        "۲. تنظیم سرعت گردش موتور با تغییر ولتاژ آرمیچر",
        "۳. جلوگیری از اشباع مغناطیسی در قطب‌های اصلی",
        "۴. کاهش تلفات هیسترزیس در هسته استاتور"
      ],
      correctIdx: 0,
      explanation: "کموتاسیون فرآیند معکوس کردن جریان در سیم‌پیچ‌های آرمیچر هنگام عبور از ناحیه خنثی است تا خروجی مستقیم حاصل شود.",
      trapCategory: "تله مفاهیم پایه ماشین‌های DC"
    },
    {
      id: "Q-7",
      subject: "بررسی سیستم‌های قدرت",
      text: "استفاده از باندل (Bundle) در خطوط انتقال فشار قوی عمدتاً به چه منظوری انجام می‌شود؟",
      options: [
        "۱. افزایش مقاومت اهمی خط برای کاهش جریان خطا",
        "۲. کاهش تلفات کرونا و اندوکتانس سری خط",
        "۳. افزایش ولتاژ شکست عایقی مقره‌ها",
        "۴. کاهش ظرفیت خازنی خط نسبت به زمین"
      ],
      correctIdx: 1,
      explanation: "باندل کردن باعث افزایش شعاع متوسط هندسی (GMR) شده که منجر به کاهش شدت میدان الکتریکی در سطح هادی (کاهش کرونا) و کاهش اندوکتانس می‌شود.",
      trapCategory: "تله مزایای هادی‌های دسته‌ای در سیستم قدرت"
    },
    {
      id: "Q-8",
      subject: "الکترومغناطیس",
      text: "طبق قانون لنز، جهت جریان القایی در یک حلقه رسانا به گونه‌ای است که ...",
      options: [
        "۱. با عامل به وجود آورنده خود (تغییر شار) مخالفت کند.",
        "۲. باعث افزایش شار مغناطیسی عبوری از حلقه شود.",
        "۳. همواره در جهت گردش عقربه‌های ساعت باشد.",
        "۴. پتانسیل الکتریکی را در تمام نقاط حلقه یکسان نگه دارد."
      ],
      correctIdx: 0,
      explanation: "قانون لنز بیانگر بقای انرژی در القای الکترومغناطیسی است؛ جریان القایی میدانی ایجاد می‌کند که با تغییر شار مخالف است.",
      trapCategory: "تله درک فیزیکی قانون لنز"
    },
    {
      id: "Q-9",
      subject: "مدارهای منطقی",
      text: "یک مالتی‌پلکسر ۸ به ۱ دارای چند خط انتخابی (Select Lines) است؟",
      options: [
        "۱. ۲ خط",
        "۲. ۳ خط",
        "۳. ۴ خط",
        "۴. ۸ خط"
      ],
      correctIdx: 1,
      explanation: "برای انتخاب بین N ورودی، به log2(N) خط انتخابی نیاز است. برای ۸ ورودی، ۳ خط لازم است (2^3 = 8).",
      trapCategory: "تله تعداد خطوط کنترلی در مدارهای ترکیبی"
    },
    {
      id: "Q-10",
      subject: "سیگنال‌ها و سیستم‌ها",
      text: "کدام یک از توابع زیر یک سیستم خطی و تغییرناپذیر با زمان (LTI) را توصیف می‌کند؟",
      options: [
        "۱. y(t) = x(t) * sin(t)",
        "۲. y(t) = x(t-2)",
        "۳. y(t) = x^2(t)",
        "۴. y(t) = x(-t)"
      ],
      correctIdx: 1,
      explanation: "سیستم y(t)=x(t-2) یک تاخیر ساده است که هم خطی است و هم با جابجایی زمان تغییر نمی‌کند. گزینه‌های دیگر یا غیرخطی هستند یا تغییرپذیر با زمان.",
      trapCategory: "تله تشخیص خواص سیستم‌های LTI"
    },
    {
      id: "Q-11",
      subject: "الکترونیک ۱ و ۲",
      text: "در یک تقویت‌کننده امیتر مشترک با مقاومت در شاخه امیتر (بدون خازن بای‌پس)، اثر مقاومت امیتر بر بهره ولتاژ و پایداری نقطه کار چیست؟",
      options: [
        "۱. بهره ولتاژ افزایش یافته و پایداری نقطه کار کاهش می‌یابد.",
        "۲. بهره ولتاژ کاهش یافته و پایداری نقطه کار نیز کاهش می‌یابد.",
        "۳. بهره ولتاژ افزایش یافته و پایداری نقطه کار بهبود می‌یابد.",
        "۴. بهره ولتاژ کاهش یافته و پایداری نقطه کار بهبود می‌یابد (فیدبک منفی موضعی)."
      ],
      correctIdx: 3,
      explanation: "مقاومت در شاخه امیتر یک فیدبک منفی سری-جریان ایجاد می‌کند که باعث کاهش بهره ولتاژ (Re/(Rc+Re)) شده اما پایداری نقطه کار را در برابر تغییرات بتا و دما به شدت بهبود می‌بخشد.",
      trapCategory: "تله تشخیص اثر فیدبک بر بهره و پایداری تقویت‌کننده"
    },
    {
      id: "Q-13",
      subject: "ماشین‌های الکتریکی",
      text: "در یک ترانسفورماتور تک‌فاز، دلیل استفاده از هسته‌های ورقه ورقه (Laminated) در استاتور چیست؟",
      options: [
        "۱. کاهش تلفات فوکو (جریان‌های گردابی) در هسته مغناطیسی.",
        "۲. کاهش تلفات هیسترزیس ناشی از تغییر جهت شار.",
        "۳. افزایش ضریب خودالقایی سیم‌پیچ‌های اولیه و ثانویه.",
        "۴. بهبود خنک‌کاری و کاهش دمای سیم‌پیچ‌ها حین بارگذاری."
      ],
      correctIdx: 0,
      explanation: "ورقه ورقه کردن هسته مسیر جریان‌های گردابی (Eddy Currents) را محدود کرده و مقاومت مسیر آن‌ها را افزایش می‌دهد که منجر به کاهش چشمگیر تلفات فوکو می‌شود.",
      trapCategory: "تله تفکیک تلفات هسته در ماشین‌های الکتریکی"
    },
    {
      id: "Q-14",
      subject: "بررسی سیستم‌های قدرت",
      text: "در تحلیل خطوط انتقال، استفاده از روش باندل (Bundle) در هر فاز خطوط فشار قوی عمدتاً به چه دلیلی انجام می‌شود؟",
      options: [
        "۱. افزایش مقاومت اهمی خط جهت محدود کردن جریان اتصال کوتاه.",
        "۲. کاهش پدیده کرونا با افزایش شعاع متوسط هندسی (GMR) هادی فاز.",
        "۳. افزایش ولتاژ نامی مقره‌های خط انتقال در برج‌های کششی.",
        "۴. کاهش ظرفیت خازنی خط نسبت به زمین و بهبود پایداری ولتاژ."
      ],
      correctIdx: 1,
      explanation: "باندل کردن هادی‌ها باعث افزایش شعاع موثر هادی فاز شده که منجر به کاهش شدت میدان الکتریکی در سطح هادی و در نتیجه کاهش تلفات کرونا و نویزهای رادیویی می‌شود.",
      trapCategory: "تله مزایای فنی هادی‌های باندل در خط انتقال"
    }
  ];

  // Helper properties to find the weakest subjects in active exam scorecard

  const weakestLessons = useMemo(() => {
    if (!currentExam || !currentExam.lessons) return [];
    return [...currentExam.lessons]
      .sort((a, b) => b.wrong - a.wrong) // Sort most wrongs descending
      .slice(0, 3);
  }, [currentExam]);

  // SMART AUTO DIAGNOSTIC TEST RUNNER from weakest subjects
  const handleStartSmartErrorTest = () => {
    const subjects = weakestLessons.map(l => l.lessonName);
    if (subjects.length === 0) {
      alert("دروس خطادار کافی برای این داوطلب یافت نشد.");
      return;
    }

    // Capture matching difficult questions
    let filtered = QUESTIONS_POOL.filter(q => {
      // Direct subject match
      const mathMatch = (q.subject.includes("ریاضی") || q.subject.includes("حسابان")) && 
                        (subjects.some(s => s.includes("ریاضی") || s.includes("حسابان")));
      
      const subjMatch = subjects.includes(q.subject) || q.subject.toLowerCase() === q.subject;
      return subjMatch || mathMatch;
    });

    if (filtered.length === 0) {
      // Fallback
      filtered = QUESTIONS_POOL.filter(q => q.subject === "مدارهای الکتریکی" || q.subject === "سیگنال‌ها و سیستم‌ها" || q.subject === "کنترل خطی");
    }

    // Sort or slice up to 5 items to ensure conceptual and difficult questions
    const chosen = filtered.slice(0, 5);

    // Synchronize selector states for UI visual feedback
    setSelectedCustomSubjects(subjects);
    setTestDifficulty("hard");
    setTestQuestionsCount(chosen.length);

    setCurrentTestQuestions(chosen);
    setTestTimer(chosen.length * 60); // 60s per question
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTestPhase("running");

    addSystemLog(
      "شبیه‌ساز هوشمند کایزن خطاها",
      student.name,
      `برگزاری آزمون پایش عیوب شامل ${toPersianNum(chosen.length)} تست سطح دشوار در دروس گلوگاهی: ${subjects.join("، ")}`
    );
  };

  const handleStartCustomTest = () => {
    if (selectedCustomSubjects.length === 0) {
      alert("لطفاً حداقل یک درس عمومی یا اختصاصی انتخاب نمایید.");
      return;
    }

    // Filter questions that match selectedCustomSubjects or closely related
    let filtered = QUESTIONS_POOL.filter(q => {
      return selectedCustomSubjects.includes(q.subject) || 
             (selectedCustomSubjects.some(s => s.includes("مدار") || s.includes("سیگنال") || s.includes("کنترل") || s.includes("ماشین")) && 
              (q.subject.includes("مدار") || q.subject.includes("سیگنال") || q.subject.includes("کنترل") || q.subject.includes("ماشین")));
    });

    if (filtered.length === 0) {
      filtered = QUESTIONS_POOL.slice(0, Math.min(QUESTIONS_POOL.length, testQuestionsCount));
    }

    const chosen = filtered.slice(0, testQuestionsCount);

    setCurrentTestQuestions(chosen);
    setTestTimer(testQuestionsCount * 60); // 60s per question
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTestPhase("running");
    
    addSystemLog(
      "شبیه‌ساز آزمون تکمیلی",
      student.name,
      `آغاز آزمون با تعداد ${toPersianNum(chosen.length)} سوال تخصصی در سطح دشواری ${testDifficulty}`
    );
  };

  const handleSubmitCustomTest = () => {
    let corrVal = 0;
    let wrongVal = 0;
    let emptyVal = 0;

    const bySubMap: Record<string, { correct: number; wrong: number; empty: number; score: number }> = {};

    currentTestQuestions.forEach((q) => {
      const selected = userAnswers[q.id];
      if (!bySubMap[q.subject]) {
        bySubMap[q.subject] = { correct: 0, wrong: 0, empty: 0, score: 0 };
      }

      if (selected === undefined) {
        emptyVal++;
        bySubMap[q.subject].empty++;
      } else if (selected === q.correctIdx) {
        corrVal++;
        bySubMap[q.subject].correct++;
      } else {
        wrongVal++;
        bySubMap[q.subject].wrong++;
      }
    });

    const scoreVal = currentTestQuestions.length > 0
      ? Math.round(((corrVal * 3 - wrongVal) / (currentTestQuestions.length * 3)) * 100)
      : 0;

    const customTraz = Math.min(9500, Math.max(2200, 5000 + scoreVal * 42));

    Object.keys(bySubMap).forEach((subKey) => {
      const details = bySubMap[subKey];
      const subTotal = details.correct + details.wrong + details.empty;
      details.score = subTotal > 0 ? Math.round(((details.correct * 3 - details.wrong) / (subTotal * 3)) * 100) : 0;
    });

    setCustomTestResult({
      totalQuestions: currentTestQuestions.length,
      correctCount: corrVal,
      wrongCount: wrongVal,
      emptyCount: emptyVal,
      scorePercent: scoreVal,
      estimatedTraz: customTraz,
      bySubject: bySubMap
    });

    setTestPhase("result");

    addSystemLog(
      "اتمام آزمون تکمیلی",
      student.name,
      `کارنامه صادر شد با تراز تخمینی ${toPersianNum(customTraz)} و درصد کل ${toPersianNum(scoreVal)}٪`
    );
  };

  const handleDownloadPamphlet = () => {
    setIsAlertVisible(true);
    setTimeout(() => {
      setIsAlertVisible(false);
      alert("✅ پاسخ‌نامه صریح عارضه‌یابی و جزوه کایزن با عنوان 'ChatreDanesh_Coaching_Guide.pdf' شامل روش‌های برخورد با تله‌های تستی کنکور با موفقیت در کارتابل شما دانلود شد.");
    }, 2000);
  };

  const handleShareWithParents = () => {
    alert("🔗 گزارش مانیتورینگ تراز فرسودگی، سرعت پاسخگویی و کایزن درسی داوطلب با موفقیت به کارتابل مشاور علمی و اولیای محترم ابلاغ گردید.");
  };

  return (
    <div className="space-y-6" id="report-card-view-container">
      {/* Top Selector and Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right">
        <div>
          <h2 className="text-xl font-black text-slate-900">سامانه کارنامه‌های مانیتورینگ آزمون‌های تخصصی آزمونیار</h2>
          <p className="text-slate-500 text-xs mt-1">کارنامه علمی و آزمون‌های شبیه‌ساز را جهت عارضه‌یابی و مهار تله‌های تستی کنکور سراسری انتخاب نمایید.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setWasShared(false);
              setShowPdfModal(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4.5 py-3 bg-gradient-to-r from-teal-600 via-emerald-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition whitespace-nowrap"
            id="btn-open-pdf-modal"
          >
            <Share2 size={14} className="text-amber-300" />
            <span>🖨️ چاپ PDF و اشتراک با والدین</span>
          </button>

          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full md:w-[280px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-950 focus:bg-white cursor-pointer text-right"
            id="exam-select-dropdown"
          >
            {mockExams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title} ({ex.date})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main summary headers displaying current statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" id="report-assessment-stats">
        <div className="bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-950 p-5 rounded-2xl text-white text-right">
          <p className="text-slate-400 text-[10px] font-bold">تراز علمی نهایی کنکور</p>
          <div className="text-3xl font-black mt-1 font-mono">{currentExam.traz}</div>
        </div>
        <div className="bg-gradient-to-tr from-blue-950 to-indigo-950 p-5 rounded-2xl text-white text-right">
          <p className="text-indigo-200 text-[10px] font-bold">رتبه کشوری شبیه‌ساز</p>
          <div className="text-3xl font-black mt-1 font-mono">{currentExam.rank}</div>
        </div>
        <div className="bg-gradient-to-tr from-emerald-850 to-emerald-950 p-5 rounded-2xl text-white text-right">
          <p className="text-emerald-300 text-[10px] font-bold">درصد انطباق پاسخ‌های صحیح</p>
          <div className="text-3xl font-black mt-1 font-mono">{currentExam.overallPercentage}٪</div>
        </div>
        <div className="bg-gradient-to-tr from-purple-950 to-purple-950 p-5 rounded-2xl text-white text-right">
          <p className="text-purple-300 text-[10px] font-bold">تخمین تراز در آزمون بعد</p>
          <div className="text-3xl font-black mt-1 font-mono">{loading ? "پیگیری..." : `${estimatedTraz}`}</div>
        </div>
      </div>
      
      {/* PhD Specific Academic Portfolio Assessment Row */}
      {student.field === "elec_phd" && currentExam.resumeScore !== undefined && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4" 
          id="phd-portfolio-stats"
        >
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right flex items-center justify-between group hover:border-indigo-100 transition-colors">
             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <FileText size={24} />
             </div>
             <div className="flex-1 pr-4">
                <p className="text-slate-500 text-[10px] font-black tracking-wider">سوابق علمی و پژوهشی (ارزیابی رزومه)</p>
                <div className="flex items-end justify-end gap-2 mt-1">
                   <span className="text-[10px] text-indigo-600 font-bold mb-1 underline decoration-2 decoration-indigo-200">تطبیق پذیرش</span>
                   <span className="text-2xl font-black font-mono text-slate-800">{currentExam.resumeScore}٪</span>
                </div>
             </div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right flex items-center justify-between group hover:border-emerald-100 transition-colors">
             <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <Mic size={24} />
             </div>
             <div className="flex-1 pr-4">
                <p className="text-slate-500 text-[10px] font-black tracking-wider">عملکرد مصاحبه (Meeting Exams)</p>
                <div className="flex items-end justify-end gap-2 mt-1">
                   <span className="text-[10px] text-emerald-600 font-bold mb-1 underline decoration-2 decoration-emerald-200">دفاع تئاتری</span>
                   <span className="text-2xl font-black font-mono text-slate-800">{currentExam.interviewScore}٪</span>
                </div>
             </div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right flex items-center justify-between group hover:border-rose-100 transition-colors">
             <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all">
                <Lightbulb size={24} />
             </div>
             <div className="flex-1 pr-4">
                <p className="text-slate-500 text-[10px] font-black tracking-wider">پتانسیل پژوهشی و نوآوری</p>
                <div className="flex items-end justify-end gap-2 mt-1">
                   <span className="text-[10px] text-rose-600 font-bold mb-1 underline decoration-2 decoration-rose-200">هوش مولد علمی</span>
                   <span className="text-2xl font-black font-mono text-slate-800">{currentExam.researchPotential}٪</span>
                </div>
             </div>
          </div>
        </motion.div>
      )}

      {/* Primary Tab Switching System */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-right" id="report-view-panels">
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("numeric")}
            className={`flex items-center gap-2 py-3 px-6 text-xs font-bold rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === "numeric" ? "bg-white text-blue-955 shadow-sm" : "text-slate-505 hover:text-slate-700 hover:bg-slate-100/50"
            }`}
          >
            <Table size={14} />
            <span>📊 ریز کارنامه درصدی دروس</span>
          </button>
          
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 py-3 px-6 text-xs font-bold rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === "ai" ? "bg-white text-blue-955 shadow-sm" : "text-slate-505 hover:text-slate-705 hover:bg-slate-100/50"
            }`}
          >
            <Brain size={14} className="text-purple-600 animate-pulse" />
            <span>🧠 عارضه‌یابی اشتباهات تستی با AI</span>
          </button>
          
          <button
            onClick={() => setActiveTab("psychology")}
            className={`flex items-center gap-2 py-3 px-6 text-xs font-bold rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === "psychology" ? "bg-white text-blue-955 shadow-sm" : "text-slate-505 hover:text-slate-705 hover:bg-slate-100/50"
            }`}
          >
            <Smile size={14} />
            <span>🎯 پایش خستگی ذهنی و تردید تستی</span>
          </button>
          
          <button
            onClick={() => setActiveTab("remedial")}
            className={`flex items-center gap-2 py-3 px-6 text-xs font-bold rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === "remedial" ? "bg-white text-blue-955 shadow-sm" : "text-slate-505 hover:text-slate-705 hover:bg-slate-100/50"
            }`}
          >
            <CalendarCheck size={14} />
            <span>📅 چرخه برنامه درسی جبرانی داوطلب</span>
          </button>

          <button
            onClick={() => setActiveTab("custom_test")}
            className={`flex items-center gap-2 py-3 px-6 text-xs font-bold rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === "custom_test" ? "bg-white text-blue-955 shadow-sm" : "text-slate-505 hover:text-slate-705 hover:bg-slate-100/50"
            }`}
          >
            <Zap size={14} className="text-amber-500" />
            <span>📝 شبیه‌ساز آزمون تکمیلی شخصی‌سازی شده</span>
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 space-y-4"
                id="loading-spinner-container"
              >
                <div className="w-12 h-12 border-4 border-blue-950 border-t-amber-400 rounded-full animate-spin"></div>
                <div className="text-center space-y-1">
                  <p className="font-bold text-slate-800">هوش کایزن آزمونیار در حال پایش و سنجش کارنامه‌ علمی شما...</p>
                  <p className="text-xs text-slate-400">شناسایی تله‌های تستی کنکور، محاسبات سرعت انتقال، تخمین تراز و رسم روند پویای پیشرفت</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 animate-fade-in"
              >
                {/* 1. Numerical Table Tab */}
                {activeTab === "numeric" && (
                  <div className="space-y-4" id="numeric-tab-content">
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm text-right">
                      <table className="w-full text-right border-collapse text-xs" dir="rtl">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
                            <th className="py-4 px-6 text-right">موضوع درسی تخصصی برق</th>
                            <th className="py-4 px-6 text-right">درصد انطباق علمی</th>
                            <th className="py-4 px-6 text-emerald-700 text-right">تعداد پاسخ‌های صحیح</th>
                            <th className="py-4 px-6 text-rose-600 text-right">تعداد پاسخ‌های غلط (تله)</th>
                            <th className="py-4 px-6 text-slate-400 text-right">گزینه‌های دست‌نخورده / سفید</th>
                            <th className="py-4 px-6 text-right">برچسب ممیزی علمی</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentExam.lessons.map((lesson, idx) => {
                            let statusText = "مستعد تراز برتر";
                            let statusColor = "bg-emerald-50 text-emerald-800 border-emerald-100";
                            if (lesson.percentage < 30) {
                              statusText = "ریسک منفی مفرط / بحرانی";
                              statusColor = "bg-rose-50 text-rose-700 border-rose-150 font-extrabold";
                            } else if (lesson.percentage < 55) {
                              statusText = "نیازمند خلاصه نویسی مواد صریح";
                              statusColor = "bg-amber-50 text-amber-700 border-amber-100";
                            }

                            return (
                              <tr key={idx} className="hover:bg-slate-50/50 transition whitespace-nowrap">
                                <td className="py-4 px-6 font-bold text-slate-800 text-right">{lesson.lessonName}</td>
                                <td className="py-4 px-6 text-right">
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold text-slate-900 w-10 shrink-0 text-right block">
                                      {lesson.percentage}٪
                                    </span>
                                    <div className="w-28 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${lesson.percentage}%` }}
                                        transition={{ type: "spring", stiffness: 50, damping: 11, delay: idx * 0.08 }}
                                        className={`h-full rounded-full ${
                                          lesson.percentage < 30 
                                            ? "bg-gradient-to-r from-rose-500 to-red-600" 
                                            : lesson.percentage < 55 
                                              ? "bg-gradient-to-r from-amber-400 to-amber-500" 
                                              : "bg-gradient-to-r from-emerald-400 to-emerald-600"
                                        }`}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6 font-mono text-emerald-705 font-bold text-right">{lesson.correct} سوال</td>
                                <td className="py-4 px-6 font-mono text-rose-600 font-bold text-right">{lesson.wrong} سوال</td>
                                <td className="py-4 px-6 font-mono text-slate-400 text-right">{lesson.empty} سفید</td>
                                <td className="py-4 px-6 text-right">
                                  <span className={`px-2.5 py-1 text-[9.5px] font-black border rounded-full ${statusColor}`}>
                                    {statusText}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-center min-h-[350px]">
                        <div className="text-right">
                          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 justify-end">
                            <span>نمودار راداری تسلط سرفصلی</span>
                            <Brain size={16} className="text-indigo-600" />
                          </h3>
                          <p className="text-[10px] text-slate-500 mt-1 font-bold">توازن دانش داوطلب در دروس تخصصی بر اساس ضریب انطباق علمی</p>
                        </div>
                        <div className="flex-1 flex justify-center items-center py-4">
                          <RadarChart 
                            data={currentExam.lessons.map(l => ({ 
                              axis: l.lessonName.length > 20 ? l.lessonName.substring(0, 18) + "..." : l.lessonName, 
                              value: l.percentage 
                            }))} 
                            width={320}
                            height={320}
                          />
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5 text-right flex flex-col">
                        <div>
                          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 justify-end">
                            <span>تحلیل توازن سرفصلی</span>
                            <Target size={16} className="text-emerald-600" />
                          </h3>
                        </div>
                        <div className="space-y-4 flex-1 overflow-y-auto">
                          {[...currentExam.lessons].sort((a, b) => b.percentage - a.percentage).map((lesson, idx) => (
                            <div key={idx} className="space-y-1.5 pt-2 border-t border-slate-50 first:border-0 first:pt-0">
                              <div className="flex justify-between items-center h-4">
                                <span className="text-[10px] font-mono font-black text-slate-400">{toPersianNum(lesson.percentage)}٪</span>
                                <span className="text-[11px] font-black text-slate-700">{lesson.lessonName}</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${lesson.percentage}%` }}
                                  className={`h-full rounded-full ${
                                    lesson.percentage > 70 ? "bg-emerald-500" : lesson.percentage > 40 ? "bg-indigo-500" : "bg-rose-500"
                                  }`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 mt-auto">
                          <p className="text-[10px] text-indigo-900 leading-relaxed font-bold">
                            💡 <span className="font-black">تحلیل هوشمند آزمونیار:</span> 
                            {currentExam.lessons.some(l => l.percentage < 30) 
                              ? " با توجه به نوسان شدید در برخی دروس، توازنی علمی شما در وضعیت بحرانی است. تمرکز بر دروس ضعیف‌تر در اولویت کایزن قرار دارد."
                              : " توازن نسبی در اکثر دروس برقرار است. حفظ این پایداری با تست‌های زمان‌دار در مباحث قوت توصیه می‌شود."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* PhD Portfolio Detail Analysis Card */}
                    {student.field === "elec_phd" && currentExam.resumeScore !== undefined && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 text-white p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden mt-6"
                      >
                        {/* Decorative background Elements */}
                        <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                        <div className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                        
                        <div className="relative z-10 space-y-8">
                          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-6">
                            <div className="text-right">
                              <h3 className="text-lg font-black flex items-center gap-2 justify-end text-indigo-400">
                                <span>پورتفولیو آکادمیک و ارزیابی جامع دکتری تخصصی</span>
                                <ShieldCheck size={24} />
                              </h3>
                              <p className="text-xs text-slate-400 font-bold mt-1">ترکیب سوابق علمی، مصاحبه حضوری (Meeting Exam) و پتانسیل تولید علم</p>
                            </div>
                            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] text-slate-300 font-bold max-w-xs leading-relaxed text-right">
                              این بخش مختص داوطلبان مقطع دکتری است که علاوه بر پاسخ‌دهی به تست‌های ۴ گزینه‌ای، بر اساس فاکتورهای نرم و متغیرهای پژوهشی مورد سنجش قرار می‌گیرند.
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Resume Details List */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                                        <FileText size={20} />
                                     </div>
                                     <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-black tracking-tight">امتیاز سوابق پژوهشی</p>
                                        <p className="text-sm font-black text-indigo-300">مقالات ISI و کنفرانس‌های معتبر</p>
                                     </div>
                                  </div>
                                  <span className="text-2xl font-black text-white font-mono">{currentExam.resumeScore}٪</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                                        <Mic size={20} />
                                     </div>
                                     <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-black tracking-tight">عملکرد مصاحبه حضوری</p>
                                        <p className="text-sm font-black text-emerald-300">قدرت انتقال و تسلط بر تز</p>
                                     </div>
                                  </div>
                                  <span className="text-2xl font-black text-white font-mono">{currentExam.interviewScore}٪</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center">
                                        <Lightbulb size={20} />
                                     </div>
                                     <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-black tracking-tight">نوآوری و تولید علم</p>
                                        <p className="text-sm font-black text-rose-300">خلاقیت در حل مسائل مهندسی</p>
                                     </div>
                                  </div>
                                  <span className="text-2xl font-black text-white font-mono">{currentExam.researchPotential}٪</span>
                                </div>
                            </div>

                            {/* Comparative Analytics Mini-Dashboard */}
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col justify-between">
                               <div className="space-y-5 text-right">
                                  <h4 className="text-sm font-black text-slate-200 border-r-2 border-indigo-500 pr-2">تحلیل سیستمی پذیرش نهایی دکتری</h4>
                                  <div className="space-y-4">
                                     <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                           <span className="text-indigo-400">{currentExam.resumeScore}%</span>
                                           <span className="text-slate-300">ارزیابی رزومه علمی</span>
                                        </div>
                                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                          <motion.div initial={{ width: 0 }} animate={{ width: `${currentExam.resumeScore}%` }} className="h-full bg-indigo-500" />
                                        </div>
                                     </div>
                                     <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                           <span className="text-emerald-400">{currentExam.interviewScore}%</span>
                                           <span className="text-slate-300">آمادگی مربیگری (Interviews)</span>
                                        </div>
                                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                          <motion.div initial={{ width: 0 }} animate={{ width: `${currentExam.interviewScore}%` }} className="h-full bg-emerald-500" />
                                        </div>
                                     </div>
                                     <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                           <span className="text-rose-400">{currentExam.researchPotential}%</span>
                                           <span className="text-slate-300">ظرفیت مقالات و پژوهش</span>
                                        </div>
                                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                          <motion.div initial={{ width: 0 }} animate={{ width: `${currentExam.researchPotential}%` }} className="h-full bg-rose-500" />
                                        </div>
                                     </div>
                                  </div>
                               </div>
                               <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-right">
                                  <p className="text-[10px] text-indigo-100 leading-relaxed font-bold">
                                    💡 <span className="text-white font-black">تحلیل مربی دکتری آزمونیار:</span>
                                    { (currentExam.resumeScore || 0) < (currentExam.interviewScore || 0) 
                                      ? " تسلط شما در متینگ‌های علمی بسیار عالی است، اما جهت قبولی در دانشگاه‌های تراز اول، تقویت رزومه با تالیف مقالات جدید توصیه می‌شود."
                                      : " رزومه فعلی شما برای فاز اول پذیرش دکتری بسیار مطلوب است. تمرکز دائم بر شبیه‌سازی مصاحبه‌های شفاهی جهت بهبود نمره Meeting Exam الزامی است."}
                                  </p>
                               </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* 2. AI Recommendation Tab */}
                {activeTab === "ai" && (
                  <div className="space-y-6" id="ai-tab-content">
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-right">
                      <div className="flex gap-3 items-center">
                        <span className="p-2 bg-purple-700 text-white rounded-xl"><Sparkles size={18} /></span>
                        <div>
                          <p className="text-purple-950 font-bold text-sm">بروشور طلایی عارضه‌یابی و مهار گلوگاه‌های آزمون صادر گردید!</p>
                          <p className="text-purple-700 text-xs mt-0.5">شامل تحلیل شروط عقود و فرآیندهای نوین دادرسی کیفری آزمونیار به عنوان مربی هوشمند علمی در جیب شما.</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleDownloadPamphlet}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-700 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex-shrink-0"
                      >
                        <Download size={14} />
                        <span>دانلود بروشور عارضه‌یابی کایزن</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right" id="ai-recommendations-list">
                      {weaknesses.map((weak, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:shadow-sm transition">
                          <div className="space-y-2">
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${
                              weak.severity === "critical" ? "bg-rose-50 text-rose-600 border-rose-100 animate-pulse" : "bg-amber-50 text-amber-600 border-amber-100"
                            }`}>
                              {weak.severity === "critical" ? "رفع عیب فوری" : "هشدار نوسان علمی"}
                            </span>
                            <h3 className="text-sm font-black text-slate-800">{weak.topic}</h3>
                            <p className="text-[11px] text-indigo-700 font-bold">{weak.subject} • درصد تطابق واقعی: {weak.percentage}٪</p>
                            <p className="text-xs text-slate-650 leading-relaxed font-semibold">{weak.recommendation}</p>
                          </div>
                          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-mono text-slate-400">
                            <button
                              onClick={() => {
                                if (onNavigate) {
                                  onNavigate("traps");
                                } else {
                                  alert(`🎯 مبحث '${weak.topic}' در لیست انتظار تله‌های تستی شما قرار گرفت. به 'بانک تله‌های تستی' بروید و جزئیات اشتباه خود را ثبت کنید.`);
                                }
                              }}
                              className="text-rose-600 font-black hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Plus size={10} />
                              <span>ثبت در بانک تله‌ها</span>
                            </button>
                            <div className="flex flex-col items-end">
                              <span>پایلوت آزمایشی: {weak.questionsCount} تست مکرر</span>
                              <span>اولویت: خیلی بالا</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {isAlertVisible && (
                      <div className="p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 text-xs flex items-center gap-2">
                        <AlertCircle className="animate-spin" size={16} />
                        <span>در پیشبرد تقاضای به خدمت‌گیری هوش مصنوعی آزمونیار جهت دانلود اسناد...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Psychological Behavioral Analysis Tab */}
                {activeTab === "psychology" && psychological && (() => {
                  const sLevel = psychological.stressLevel ?? 45;
                  const sAnalysis = psychological.stressAnalysis ?? {
                    avgResponseTimeWrong: 72,
                    avgResponseTimeCorrect: 48,
                    consecutiveErrorsCount: 4,
                    stressLabel: "متوسط",
                    technicalDetail: "داغ شدن سر بازوی التراسونیک به علت کمبود هوای فونداسیون که سبب شده پرسنل درزها را با تعجیل رد کنند."
                  };

                  const chartData = mockExams.map((exam) => {
                    const computedStress = calculateExamStressLevel(exam);
                    const totalWrong = exam.lessons.reduce((sum, s) => sum + (s.wrong || 0), 0);
                    const totalCorrect = exam.lessons.reduce((sum, s) => sum + (s.correct || 0), 0);
                    const totalEmpty = exam.lessons.reduce((sum, s) => sum + (s.empty || 0), 0);
                    const totalQuestions = totalWrong + totalCorrect + totalEmpty || 1;
                    
                    const hasteIndex = Math.min(95, Math.max(10, Math.round((totalWrong / (totalWrong + totalCorrect || 1)) * 100)));
                    const emptyIndex = Math.min(95, Math.max(10, Math.round((totalEmpty / totalQuestions) * 100 * 1.5)));

                    return {
                      id: exam.id,
                      shortTitle: exam.title.replace("آزمون شبیه‌ساز ", "").replace("آزمون جامع ", ""),
                      fullTitle: exam.title,
                      date: exam.date,
                      traz: exam.traz,
                      "میزان خستگی": computedStress,
                      "شاخص شتاب‌زدگی": hasteIndex,
                      "شاخص تردید": emptyIndex,
                      isSelected: exam.id === selectedExamId
                    };
                  });

                  let stressColorText = "text-emerald-600";
                  let stressBg = "bg-emerald-555";
                  let stressBorder = "border-emerald-100";
                  
                  if (sLevel > 70) {
                    stressColorText = "text-rose-605 font-extrabold";
                    stressBg = "bg-rose-500";
                    stressBorder = "border-rose-100";
                  } else if (sLevel > 45) {
                    stressColorText = "text-amber-605 font-extrabold";
                    stressBg = "bg-amber-500";
                    stressBorder = "border-amber-100";
                  } else if (sLevel > 25) {
                    stressColorText = "text-blue-605 font-extrabold";
                    stressBg = "bg-blue-500";
                    stressBorder = "border-blue-100";
                  }

                  return (
                    <div className="space-y-6" id="psychology-tab-content">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        <div className="lg:col-span-2 space-y-4 text-right">
                          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 bg-gradient-to-tr from-blue-50/10 to-transparent">
                            <div className="flex items-center gap-2">
                              <span className="p-2 bg-blue-50 text-blue-900 rounded-xl"><Smile size={18} /></span>
                              <h3 className="text-xs font-black text-slate-900 font-sans">ریشه عیوب و تمرکز ذهن مانیتور شده: <span className="text-blue-950 font-extrabold">{psychological.pattern}</span></h3>
                            </div>
                            <p className="text-slate-650 text-xs leading-relaxed font-semibold">{psychological.description}</p>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 text-right">
                              <p className="text-xs text-slate-800 leading-relaxed font-sans">
                                <strong>💡 اقدام فوری کایزن تحصیلی: </strong>{psychological.suggestion}
                              </p>
                            </div>
                          </div>

                          {/* Stress Level Fluctuation Trend Chart Card */}
                          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                            <div>
                              <h3 className="text-xs font-black text-slate-905 flex items-center gap-2 font-sans">
                                <Activity className="text-purple-650" size={14} />
                                <span>نمودار نوسانات کارایی تمرکزی، خستگی ذهنی و تردید گزینه‌ای داوطلب کنکور</span>
                              </h3>
                              <p className="text-slate-400 text-[9px] mt-0.5">بر روی هر گره کلیک کنید تا متغیرهای تحلیلی مربوط به آزمون گزینش شده لود گردد.</p>
                            </div>

                            <div className="h-[210px] w-full font-sans text-xs" dir="ltr">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={chartData}
                                  onClick={(e: any) => {
                                    if (e && e.activePayload && e.activePayload.length) {
                                      setSelectedExamId(e.activePayload[0].payload.id);
                                    }
                                  }}
                                  margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                  <XAxis 
                                    dataKey="shortTitle" 
                                    stroke="#94a3b8" 
                                    tickLine={false} 
                                    axisLine={false}
                                    style={{ fontSize: "10px", fontWeight: "600" }}
                                  />
                                  <YAxis 
                                    domain={[0, 100]} 
                                    stroke="#94a3b8" 
                                    tickLine={false} 
                                    axisLine={false}
                                    style={{ fontSize: "10px", fontWeight: "600" }}
                                    tickFormatter={(v) => `${v}%`}
                                  />
                                  <RechartsTooltip content={<CustomTooltip />} />
                                  <Line
                                    type="monotone"
                                    dataKey="میزان خستگی"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={(props: any) => {
                                      const { cx, cy, payload } = props;
                                      const isSelected = payload.id === selectedExamId;
                                      return (
                                        <g key={`stress-dot-${payload.id}`}>
                                          <circle 
                                            cx={cx} 
                                            cy={cy} 
                                            r={isSelected ? 6 : 4} 
                                            fill={isSelected ? "#8b5cf6" : "#ffffff"} 
                                            stroke="#8b5cf6" 
                                            strokeWidth={isSelected ? 3 : 2}
                                            style={{ cursor: "pointer" }}
                                          />
                                          {isSelected && (
                                            <circle
                                              cx={cx}
                                              cy={cy}
                                              r={11}
                                              fill="none"
                                              stroke="#8b5cf6"
                                              strokeWidth={1}
                                              strokeDasharray="2 2"
                                            />
                                          )}
                                        </g>
                                      );
                                    }}
                                    activeDot={{ r: 7 }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="شاخص شتاب‌زدگی"
                                    stroke="#f43f5e"
                                    strokeWidth={2.5}
                                    strokeDasharray="4 4"
                                    dot={(props: any) => {
                                      const { cx, cy, payload } = props;
                                      const isSelected = payload.id === selectedExamId;
                                      return (
                                        <circle 
                                          key={`haste-dot-${payload.id}`}
                                          cx={cx} 
                                          cy={cy} 
                                          r={isSelected ? 4 : 3} 
                                          fill={isSelected ? "#f43f5e" : "#ffffff"} 
                                          stroke="#f43f5e" 
                                          strokeWidth={2}
                                          style={{ cursor: "pointer" }}
                                        />
                                      );
                                    }}
                                    activeDot={{ r: 5 }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="شاخص تردید"
                                    stroke="#fbbf24"
                                    strokeWidth={2.5}
                                    strokeDasharray="2 2"
                                    dot={(props: any) => {
                                      const { cx, cy, payload } = props;
                                      const isSelected = payload.id === selectedExamId;
                                      return (
                                        <circle 
                                          key={`doubt-dot-${payload.id}`}
                                          cx={cx} 
                                          cy={cy} 
                                          r={isSelected ? 4 : 3} 
                                          fill={isSelected ? "#fbbf24" : "#ffffff"} 
                                          stroke="#fbbf24" 
                                          strokeWidth={2}
                                          style={{ cursor: "pointer" }}
                                        />
                                      );
                                    }}
                                    activeDot={{ r: 5 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            
                            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 pt-2 border-t border-slate-50 text-[10px] font-bold text-slate-500" dir="rtl">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                                <span>خستگی ذهنی و تمرکزی (٪)</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                <span>شاخص شتاب‌زدگی تستی (٪)</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                <span>شاخص تردید و تعلیق بین گزینه‌ها (٪)</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Side details metrics list */}
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col justify-between h-full text-right">
                            <div className="space-y-4">
                              <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                                <Zap className="text-amber-500" size={14} />
                                <span>ممیزی مشخصات عارضه‌یابی آزمون</span>
                              </h4>
                              
                              <div className="space-y-3.5">
                                <div className="bg-white p-3.5 rounded-2xl border border-slate-100/50 space-y-1">
                                  <span className="text-[10px] text-slate-400 block font-bold">متوسط زمان اختصاص یافته به سوال اشتباه</span>
                                  <span className="text-lg font-black font-mono text-slate-800">
                                    {sAnalysis.avgResponseTimeWrong} ثانیه
                                  </span>
                                  <span className="text-[9px] text-rose-550 font-bold block">🚨 زمان مفرط حاصل از تله و تردید در درس تخصصی اثرگذار</span>
                                </div>

                                <div className="bg-white p-3.5 rounded-2xl border border-slate-100/50 space-y-1">
                                  <span className="text-[10px] text-slate-400 block font-bold font-sans">سرعت پاسخ‌گویی به گزینه‌های صحیح</span>
                                  <span className="text-lg font-black font-mono text-slate-800">
                                    {sAnalysis.avgResponseTimeCorrect} ثانیه
                                  </span>
                                  <span className="text-[9px] text-emerald-600 font-bold block">✓ بهینه و در بازه هوشیاری مرجع</span>
                                </div>

                                <div className="bg-white p-3.5 rounded-2xl border border-slate-100/50 space-y-1">
                                  <span className="text-[10px] text-slate-400 block font-bold">پاسخ‌های منفی متوالی تله‌گذاری شده</span>
                                  <span className="text-lg font-black text-slate-800 font-mono">
                                    {sAnalysis.consecutiveErrorsCount} سوال متوالی منفی
                                  </span>
                                  <span className="text-[9px] text-rose-500 font-bold block">🚨 نیاز به مداخله فوری مشاور کایزن آموزشی</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={handleShareWithParents}
                              className="w-full mt-6 py-3 bg-blue-950 hover:bg-slate-900 border border-slate-200 text-white font-bold text-xs rounded-2xl shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Share2 size={13} />
                              <span>ابلاغ کارنامه به مشاور علمی و کارتابل والدین</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })()}

                {/* 4. Remedial Schedule Tab */}
                {activeTab === "remedial" && (
                  <div className="space-y-4 text-right" id="remedial-tab-content">
                    <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1 text-right">
                        <h3 className="text-sm font-black text-indigo-950 flex items-center gap-1.5">
                          <ClipboardList size={16} />
                          <span>سند کایزن درسی و برنامه جبرانی رفع تله‌های تستی کنکور سراسری</span>
                        </h3>
                        <p className="text-xs text-indigo-700 font-semibold">مبتنی بر تله‌های علمی فرسودگی و درسی ممیزی‌ شده در کانون علمی آزمونیار شما</p>
                      </div>
                      <span className="px-3.5 py-1.5 bg-blue-950 text-white rounded-2xl text-[10px] font-black border border-indigo-900 animate-pulse">
                        چرخه هفتگی کایزن فعال است ⏱️
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="remedial-weekly-schedule">
                      {remedialPlan.map((plan, idx) => {
                        let isWeekend = plan.day === "جمعه" || plan.day === "پنجشنبه";
                        return (
                          <div key={idx} className={`p-5 rounded-2xl border transition-all ${
                            isWeekend 
                              ? "bg-slate-900 text-white border-slate-950 hover:bg-slate-950" 
                              : "bg-slate-50/60 border-slate-100 hover:border-slate-200 hover:bg-white"
                          }`}>
                            <div className="flex justify-between items-start border-b pb-2 mb-3 border-slate-200/55">
                              <span className={`text-sm font-black ${isWeekend ? "text-amber-400" : "text-blue-950"}`}>{plan.day}</span>
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                isWeekend ? "bg-white/10 text-white" : "bg-white text-slate-650 border border-slate-100"
                              }`}>
                                {plan.totalQuestions} تست هدفمند
                              </span>
                            </div>
                            <div className="space-y-2.5 text-right">
                              <div className="space-y-0.5">
                                <span className={`text-[9px] block font-bold ${isWeekend ? "text-slate-400" : "text-slate-500"}`}>شیفت صبح: مطالعه و مرور کتاب درسی</span>
                                <p className={`text-xs font-bold leading-relaxed ${isWeekend ? "text-slate-100" : "text-slate-800"}`}>{plan.morningPlan}</p>
                              </div>
                              <div className="space-y-0.5">
                                <span className={`text-[9px] block font-bold ${isWeekend ? "text-slate-400" : "text-slate-500"}`}>شیفت عصر: پاسخ‌گویی و عیب‌یابی</span>
                                <p className={`text-xs leading-relaxed ${isWeekend ? "text-slate-300" : "text-slate-605"}`}>{plan.afternoonPlan}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5. Custom Supplementary Test Simulator Tab */}
                {activeTab === "custom_test" && (
                  <div className="space-y-6 text-right" id="custom-test-simulation-container">
                    
                    {/* Phase 1: Config/Builder Screen */}
                    {testPhase === "config" && (
                      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                        <div className="border-b border-rose-100 pb-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-rose-50 rounded-xl text-rose-600 block">
                              <Sparkles size={18} />
                            </span>
                            <h3 className="text-base font-black text-slate-900">طراح و شبیه‌ساز آزمون تکمیلی شخصی‌سازی شده سراسری</h3>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            بر پایه هوش کایزن آزمونیار، با توجه به نقاط ضعف درصدی گزارش شده شما، مباحث و تعداد سوالات آزمون خود را بسازید تا تحت زمان‌بندی مرجع کنکور مورد آزمون آنلاین پیوسته قرار بگیرید.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left Panel: Subjects Selection */}
                          <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 space-y-4">
                            <label className="text-xs font-black text-slate-800 block">۱. انتخاب دروس جهت شبیه‌سازی تست‌های تخصصی:</label>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {(student.field === "comp_master" 
                                ? ["ریاضیات تخصصی و آمار", "نظریه زبان‌ها و سیگنال‌ها", "ساختمان داده‌ها و الگوریتم‌ها", "هوش مصنوعی و یادگیری ماشین"]
                                : student.field === "elec_phd"
                                ? ["ریاضیات مهندسی پیشرفته", "نظریه سیستم‌های کنترل خطی", "استعداد تحصیلی و زبان دکتری", "فرآیندهای تصادفی پیشرفته"]
                                : student.field === "elec_master"
                                ? ["ریاضیات مهندسی و معادلات", "مدارهای الکتریکی ۱ و ۲", "سیگنال‌ها و سیستم‌ها", "الکترونیک و کنترل خطی"]
                                : ["GMAT استعداد و آمادگی تحصیلی", "زبان تخصصی مدیریت", "ریاضیات عمومی ۱ و ۲"]
                              ).map((subjName) => {
                                const isSelected = selectedCustomSubjects.includes(subjName);
                                return (
                                  <button
                                    key={subjName}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCustomSubjects(prev => 
                                        isSelected ? prev.filter(x => x !== subjName) : [...prev, subjName]
                                      );
                                    }}
                                    className={`flex items-center justify-between p-3.5 rounded-xl border font-bold text-xs transition cursor-pointer text-right w-full ${
                                      isSelected 
                                        ? "bg-rose-50/50 border-rose-200 text-rose-950 shadow-sm font-extrabold"
                                        : "bg-white border-slate-150 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                                    }`}
                                  >
                                    <span>{subjName}</span>
                                    <span className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                                      isSelected ? "bg-rose-600 border-rose-600 text-white" : "border-slate-300 bg-white"
                                    }`}>✓</span>
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-[10px] text-slate-400">بهتر است دروسی که در ریزدرصدهای کارنامه بالا دارای ریسک تله علمی هستند را برگزینید.</p>
                          </div>

                          {/* Right Panel: Exam Specific parameters */}
                          <div className="space-y-4">
                            <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 space-y-4">
                              <label className="text-xs font-black text-slate-800 block">۲. تعداد تست‌های طراحی‌شده پس از بررسی هوش کایزن:</label>
                              <div className="flex gap-2">
                                {[3, 5, 8].map((qCount) => (
                                  <button
                                    key={qCount}
                                    type="button"
                                    onClick={() => setTestQuestionsCount(qCount)}
                                    className={`flex-1 py-2.5 rounded-xl border font-extrabold text-xs transition cursor-pointer ${
                                      testQuestionsCount === qCount
                                        ? "bg-slate-900 text-white border-slate-900"
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    {toPersianNum(qCount)} تست
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 space-y-4">
                              <label className="text-xs font-black text-slate-800 block">۳. سطح پیچیدگی تله‌ها و دام‌ها:</label>
                              <div className="flex gap-2">
                                {[
                                  { level: "simple", label: "ساده (تله‌های سطحی)" },
                                  { level: "medium", label: "متوسط (دام‌های روتین)" },
                                  { level: "hard", label: "دشوار (تله‌های عمیق)" }
                                ].map((item) => (
                                  <button
                                    key={item.level}
                                    type="button"
                                    onClick={() => setTestDifficulty(item.level as any)}
                                    className={`flex-1 py-2.5 rounded-xl border font-bold text-xs transition cursor-pointer ${
                                      testDifficulty === item.level
                                        ? "bg-rose-950 text-white border-rose-950"
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Start Button */}
                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                          <button
                            type="button"
                            onClick={handleStartCustomTest}
                            className="w-full sm:w-auto px-8 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-2xl shadow-md cursor-pointer transition flex items-center justify-center gap-2"
                          >
                            <Zap size={14} />
                            <span>ساخت و آغاز سنجش آزمون تکمیلی تله‌های ذهنی</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Phase 2: Running mock interactive screen */}
                    {testPhase === "running" && currentTestQuestions.length > 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Questions index summary list */}
                        <div className="lg:col-span-4 space-y-4">
                          <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-950 space-y-4 shadow-lg text-right">
                            <div className="flex justify-between items-center bg-slate-800/60 px-4 py-3 rounded-2xl border border-slate-700">
                              <span className="text-[10px] text-slate-300 font-bold block">زمان باقی‌مانده آزمون:</span>
                              <div className="text-lg font-black font-mono text-amber-400 flex items-center gap-1.5" dir="ltr">
                                <Clock size={16} />
                                <span>
                                  {Math.floor(testTimer / 60)}:{(testTimer % 60).toString().padStart(2, "0")}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[11px] text-slate-400 block font-bold">میزان پیشرفت پاسخ‌دهی:</span>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                  style={{ width: `${(Object.keys(userAnswers).length / currentTestQuestions.length) * 100}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-400">
                                <span>{toPersianNum(Object.keys(userAnswers).length)} پاسخ داده شده</span>
                                <span>{toPersianNum(currentTestQuestions.length)} کل سوالات</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-800 space-y-2.5">
                              <span className="text-xs font-black text-slate-200 block">سوالات دفترچه عارضه‌یابی:</span>
                              <div className="grid grid-cols-4 gap-2">
                                {currentTestQuestions.map((q, idx) => {
                                  const answered = userAnswers[q.id] !== undefined;
                                  const isCurrent = idx === currentQuestionIndex;
                                  return (
                                    <button
                                      key={q.id}
                                      onClick={() => setCurrentQuestionIndex(idx)}
                                      className={`py-2 px-1 text-xs font-black font-mono rounded-xl border transition cursor-pointer text-center ${
                                        isCurrent 
                                          ? "bg-rose-600 text-white border-rose-600 scale-105 shadow-sm"
                                          : answered
                                          ? "bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900"
                                          : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
                                      }`}
                                    >
                                      {toPersianNum(idx + 1)}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <button
                              onClick={handleSubmitCustomTest}
                              className="w-full mt-4 py-3 bg-rose-605 hover:bg-rose-700 bg-rose-600 text-white font-extrabold text-xs rounded-2xl shadow transition cursor-pointer text-center flex items-center justify-center gap-2"
                            >
                              <ShieldCheck size={14} />
                              <span>ثبت نهایی و دریافت کارنامه تکمیلی</span>
                            </button>
                          </div>
                        </div>

                        {/* Interactive question panel */}
                        <div className="lg:col-span-8 flex flex-col justify-between bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] text-slate-700 font-extrabold">
                                  {currentTestQuestions[currentQuestionIndex].subject}
                                </span>
                                <span className="text-slate-400 text-xs font-bold">سوال شماره {toPersianNum(currentQuestionIndex + 1)} از {toPersianNum(currentTestQuestions.length)}</span>
                              </div>
                              <span className="text-rose-600 text-[10px] font-black tracking-tight">{toPersianNum(testDifficulty === "hard" ? "سطح تراز بالای ۸۰۰۰" : testDifficulty === "medium" ? "تراز روتین کنکور" : "ساده")}</span>
                            </div>

                            <p className="text-sm font-black text-slate-800 leading-relaxed font-sans text-right pt-2">
                              {currentTestQuestions[currentQuestionIndex].text}
                            </p>

                            <div className="space-y-2.5 pt-4 text-right">
                              {currentTestQuestions[currentQuestionIndex].options.map((optText, optIdx) => {
                                const isSelected = userAnswers[currentTestQuestions[currentQuestionIndex].id] === optIdx;
                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => {
                                      setUserAnswers(prev => ({
                                        ...prev,
                                        [currentTestQuestions[currentQuestionIndex].id]: optIdx
                                      }));
                                    }}
                                    className={`w-full p-4 rounded-xl border text-xs font-bold leading-relaxed text-right transition cursor-pointer ${
                                      isSelected
                                        ? "bg-rose-50/50 border-rose-300 text-rose-950 font-black shadow-sm"
                                        : "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100/50 hover:border-slate-300"
                                    }`}
                                  >
                                    {optText}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Navigation Controls */}
                          <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                            <button
                              disabled={currentQuestionIndex === 0}
                              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                              className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              سوال قبلی
                            </button>
                            
                            <button
                              onClick={() => {
                                setUserAnswers(prev => {
                                  const updated = { ...prev };
                                  delete updated[currentTestQuestions[currentQuestionIndex].id];
                                  return updated;
                                });
                              }}
                              className="text-[10px] font-bold text-slate-400 hover:text-rose-600 cursor-pointer transition"
                            >
                              پاک کردن گزینه انتخابی
                            </button>

                            {currentQuestionIndex < currentTestQuestions.length - 1 ? (
                              <button
                                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-950 rounded-xl text-xs font-bold text-white cursor-pointer transition"
                              >
                                سوال بعدی
                              </button>
                            ) : (
                              <button
                                onClick={handleSubmitCustomTest}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-black text-white cursor-pointer transition"
                              >
                                ثبت و اتمام آزمون ✓
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Phase 3: Detailed Scorecard / Traps Vault saver */}
                    {testPhase === "result" && customTestResult && (
                      <div className="space-y-6">
                        
                        {/* Summary details cards */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                          <div className="flex justify-between items-center border-b border-rose-100 pb-4">
                            <div>
                              <h3 className="text-base font-black text-slate-900">ریزکارنامه تحلیل دام‌های علمی آزمون تکمیلی کایزن</h3>
                              <p className="text-xs text-slate-500 mt-1">شناسایی عمیق تردیدهای گزینه‌ای و ممانعت از هدررفت تراز در تله‌های تستی کنکور سراسری</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setTestPhase("config")}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition"
                            >
                              + ساخت آزمون جدید
                            </button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-950 text-white p-5 rounded-2xl text-right">
                              <span className="text-slate-400 text-[9px] font-black">تراز علمی تخمینی شبیه‌ساز</span>
                              <div className="text-2xl font-black font-mono mt-1 text-amber-300">{toPersianNum(customTestResult.estimatedTraz)}</div>
                            </div>

                            <div className="bg-gradient-to-tr from-indigo-900 to-indigo-950 text-white p-5 rounded-2xl text-right">
                              <span className="text-indigo-200 text-[9px] font-black">درصد نهایی با جریمه نزولی</span>
                              <div className="text-2xl font-black font-mono mt-1">{toPersianNum(customTestResult.scorePercent)}٪</div>
                            </div>

                            <div className="bg-slate-100/60 p-5 rounded-2xl border border-slate-100 text-right">
                              <span className="text-slate-400 text-[9px] font-black">صحیح / غلط / سفید</span>
                              <div className="text-lg font-black mt-1 text-slate-800 font-mono">
                                <span className="text-emerald-600">{toPersianNum(customTestResult.correctCount)} ص</span> - <span className="text-rose-600">{toPersianNum(customTestResult.wrongCount)} غ</span> - <span className="text-slate-400">{toPersianNum(customTestResult.emptyCount)} س</span>
                              </div>
                            </div>

                            <div className="bg-rose-50 text-rose-950 p-5 rounded-2xl border border-rose-100 text-right flex flex-col justify-center">
                              <span className="text-[9px] font-black text-rose-800">تعداد تله‌ تستی فعال شده</span>
                              <div className="text-2xl font-black font-mono mt-1">{toPersianNum(customTestResult.wrongCount)} تله</div>
                            </div>
                          </div>
                        </div>

                        {/* Breakdown analysis of each question & SAVE TRAP */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-slate-800">ممیزی تله‌ها و عیب‌یابی تک‌تک سوالات کلاس‌بندی شده:</h4>
                          
                          {currentTestQuestions.map((q, idx) => {
                            const selectedIdx = userAnswers[q.id];
                            const isCorrect = selectedIdx === q.correctIdx;
                            const isUnanswered = selectedIdx === undefined;
                            
                            const isSavedMap = savedTrapQuestionIds[q.id];

                            return (
                              <div 
                                key={q.id} 
                                className={`p-5 rounded-3xl border transition-all bg-white relative overflow-hidden ${
                                  isCorrect 
                                    ? "border-emerald-100 shadow-sm" 
                                    : isUnanswered
                                    ? "border-slate-100 shadow-sm"
                                    : "border-rose-100 shadow-md ring-1 ring-rose-100"
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black font-mono text-xs flex items-center justify-center">
                                      {toPersianNum(idx + 1)}
                                    </span>
                                    <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md text-[10px] text-slate-500 font-bold">
                                      {q.subject}
                                    </span>
                                    {!isCorrect && !isUnanswered && (
                                      <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black">
                                        افتاده در تله ⚠️
                                      </span>
                                    )}
                                  </div>

                                  {/* SAVE TRAP INTERACTION */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isSavedMap) return;
                                      
                                      saveTestTrap({
                                        questionTitle: q.text,
                                        subject: q.subject,
                                        category: (q.subject === "مدارهای الکتریکی" || q.subject === "سیگنال‌ها و سیستم‌ها" || q.subject === "الکترونیک" || q.subject === "کنترل خطی") ? "اشتباه_محاسباتی" : "مفهومی",
                                        trapType: q.trapCategory,
                                        correctAnswer: q.options[q.correctIdx],
                                        userMistake: selectedIdx !== undefined ? `انتخاب نادرست گزینه شماره ${toPersianNum(selectedIdx + 1)}` : "سوال را سفید باقی گذاشتم",
                                        technicalNote: q.explanation,
                                        importance: "high"
                                      });

                                      setSavedTrapQuestionIds(prev => ({
                                        ...prev,
                                        [q.id]: true
                                      }));

                                      addSystemLog(
                                        "ثبت تله تستی",
                                        student.name,
                                        `ذخیره خودکار تله ${q.trapCategory} در درس ${q.subject}`
                                      );

                                      alert("✓ این خطای تستی علمی با موفقیت در کیف تله‌های ذهنی ذخیره شد و در چرخه جبرانی هوشمند آزمونیار قرار گرفت.");
                                    }}
                                    className={`py-1.5 px-3 rounded-xl border text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                                      isSavedMap 
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-extrabold cursor-default"
                                        : "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                                    }`}
                                  >
                                    <Sparkles size={11} />
                                    <span>{isSavedMap ? "در تله‌ها و عارضه‌ها ثبت شد ✓" : "ثبت در تله‌ها"}</span>
                                  </button>
                                </div>

                                <p className="text-xs font-bold text-slate-800 leading-relaxed mb-4 text-right">
                                  {q.text}
                                </p>

                                {/* Options */}
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
                                  {q.options.map((optText, optIdx) => {
                                    const isCorrectOpt = optIdx === q.correctIdx;
                                    const isSelectedOpt = optIdx === selectedIdx;
                                    
                                    let borderStyle = "border-slate-100 bg-slate-50/40 opacity-70";
                                    if (isCorrectOpt) {
                                      borderStyle = "border-emerald-400 bg-emerald-50/50 text-emerald-900 font-extrabold";
                                    } else if (isSelectedOpt) {
                                      borderStyle = "border-rose-400 bg-rose-50 text-rose-900 font-extrabold";
                                    }
                                    
                                    return (
                                      <div key={optIdx} className={`p-3 rounded-xl border text-[11px] leading-relaxed text-right ${borderStyle}`}>
                                        <div className="flex items-center gap-1">
                                          {isCorrectOpt && <span className="text-emerald-600">✓</span>}
                                          {isSelectedOpt && !isCorrectOpt && <span className="text-rose-600">⚠️</span>}
                                          <span>{optText}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-right">
                                  <div className="flex items-center gap-1 text-[10px] font-black text-rose-800">
                                    <AlertCircle size={12} />
                                    <span>شناسایی تله تستی: {q.trapCategory}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">
                                    <span className="font-bold text-slate-805 text-slate-800">راهبرد مقابله ممیز:</span> {q.explanation}
                                  </p>
                                </div>

                              </div>
                            );
                          })}
                        </div>

                      </div>
                    )}

                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Interactive PDF Printing and Parent Sharing Modal */}
      <ReportCardPrintModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        student={student}
        currentExam={currentExam}
        weaknesses={weaknesses}
        psychological={psychological}
        remedialPlan={remedialPlan}
        estimatedTraz={estimatedTraz}
      />

    </div>
  );
}
