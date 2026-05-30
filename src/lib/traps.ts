import { TestTrap } from "../types";

export const getTestTraps = (): TestTrap[] => {
  const saved = localStorage.getItem("chatre_test_traps");
  if (!saved) return [
    {
      id: "TRAP-1",
      questionTitle: "تشخیص ثابت زمانی در مدارهای ترکیبی سلف و مقاومت",
      subject: "مدار الکتریکی ۱",
      category: "اشتباه_محاسباتی",
      trapType: "تله مقاومت معادل تونات",
      correctAnswer: "ال تقسیم بر مقاومت دیده شده از دو سر سلف (L/Req)",
      userMistake: "مقاومت کل مدار را بدون در نظر گرفتن محل قرارگیری سلف در فرمول قرار دادم.",
      technicalNote: "برای محاسبه ثابت زمانی (tau) در مدار مرتبه اول، حتماً باید مقاومت تِوِنی (Thevenin) دیده شده از دو سر عنصر ذخیره‌ساز انرژی (L یا C) را محاسبه کنید.",
      importance: "high",
      createdAt: "۱۴۰۵/۰۲/۲۸"
    },
    {
      id: "TRAP-2",
      questionTitle: "پایداری سیستم‌های مرتبه دوم بر اساس پارامترهای میرایی",
      subject: "سیگنال و سیستم",
      category: "مفهومی",
      trapType: "تله محل قطب‌های روی محور موهومی",
      correctAnswer: "سیستم دارای قطب روی محور موهومی غیرتکراری، 'پایدار مرزی' است، نه پایدار مطلق.",
      userMistake: "سیستم را به دلیل نداشتن قطب در سمت راست صفحه s، پایدار مطلق فرض کردم.",
      technicalNote: "پایداری BIBO مستلزم آن است که تمام قطب‌ها در سمت چپ صفحه s باشند. وجود قطب‌های غیرتکراری روی محور jw باعث پایداری مرزی می‌شود که در ورودی پله، خروجی کراندار نیست.",
      importance: "medium",
      createdAt: "۱۴۰۵/۰۲/۲۸"
    }
  ];
  try {
    return JSON.parse(saved);
  } catch (e) {
    return [];
  }
};

export const saveTestTrap = (trap: Omit<TestTrap, "id" | "createdAt">) => {
  const traps = getTestTraps();
  const newTrap: TestTrap = {
    ...trap,
    id: `TRAP-${Date.now()}`,
    createdAt: new Date().toLocaleDateString("fa-IR")
  };
  localStorage.setItem("chatre_test_traps", JSON.stringify([newTrap, ...traps]));
  return newTrap;
};

export const deleteTestTrap = (id: string) => {
  const traps = getTestTraps();
  const filtered = traps.filter(t => t.id !== id);
  localStorage.setItem("chatre_test_traps", JSON.stringify(filtered));
};
