// Theme handling. Dark is the default, as on the source; the choice is
// remembered in localStorage and applied before first paint.

export const THEME_STORAGE_KEY = "theme";
export const DARK_CLASS = "dark";
export type Theme = "dark" | "light";

/**
 * Runs inline at the top of <body>, before anything is painted, so a visitor
 * who chose the light theme never sees a dark flash. Kept as a string because
 * it must execute before React loads.
 */
export const THEME_INIT_SCRIPT = `try {
  if (localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) === "light") {
    document.documentElement.classList.remove(${JSON.stringify(DARK_CLASS)});
  }
} catch (error) {
  console.error("Could not read the saved theme; using the default.", error);
}`;

/**
 * Switches the theme for this page view and tries to remember it. A browser
 * may block storage; the switch still works and the failure is reported.
 */
export function toggleTheme(): Theme {
  const isDark = document.documentElement.classList.toggle(DARK_CLASS);
  const theme: Theme = isDark ? "dark" : "light";
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error("Could not save the theme choice; it will reset on reload.", error);
  }
  return theme;
}
