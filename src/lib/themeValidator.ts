/**
 * Theme Validation Utility
 * Ensures application content is focused on Master's in Electrical Engineering
 * and does not contain irrelevant law-related terms.
 */

const FORBIDDEN_LEVELS = [
  "وکالت", "قضاوت", "سردفتری", "حقوق مدنی", "اصول فقه", "آیین دادرسی", 
  "قانون مجازات", "تجارت و شرکت‌ها", "قانون اساسی", "کاتوزیان", "کانون وکلا", "میزان"
];

const REQUIRED_LEVELS = [
  "برق", "ارشد برق", "مدار", "سیگنال", "کنترل", "ماشین", "الکترونیک", "ریاضی مهندسی", "مغناطیس"
];

/**
 * Validates if the given text aligns with the EE theme.
 * @param text The text content to validate
 * @returns { isConsistent: boolean, issues: string[] }
 */
export function validateThemeConsistency(text: string): { isConsistent: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for forbidden law terms
  FORBIDDEN_LEVELS.forEach(term => {
    if (text.includes(term)) {
      issues.push(`Forbidden Law term found: "${term}"`);
    }
  });

  // Basic check for presence of some EE context in large chunks
  if (text.length > 200) {
    const hasEEContext = REQUIRED_LEVELS.some(term => text.includes(term));
    if (!hasEEContext) {
      issues.push("Content lacks Electrical Engineering context markers.");
    }
  }

  return {
    isConsistent: issues.length === 0,
    issues
  };
}

/**
 * Global application check (to be called in dev/console)
 */
export function runFullSiteThemeCheck() {
  console.log("🚀 Starting Full Site Theme Consistency Check (Master's in Electrical Engineering)...");
  
  const sampleData = document.body.innerText;
  const result = validateThemeConsistency(sampleData);
  
  if (result.isConsistent) {
    console.log("✅ Theme Check Passed: Content is focused on Electrical Engineering.");
  } else {
    console.error("❌ Theme Check Failed: Inconsistent content found!");
    result.issues.forEach(issue => console.warn(`   - ${issue}`));
  }
  
  return result.issues;
}
