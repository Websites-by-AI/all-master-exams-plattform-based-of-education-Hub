
export const getAppName = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("app_name") || "آزمونیار";
  }
  return "آزمونیار";
};

export const setAppName = (name: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("app_name", name);
    // Dispatch a custom event so other components can listen for the change
    window.dispatchEvent(new Event("app_name_changed"));
  }
};
