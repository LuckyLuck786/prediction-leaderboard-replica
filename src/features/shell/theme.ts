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
export const THEME_INIT_SCRIPT = `if (localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)}) === "light") document.documentElement.classList.remove(${JSON.stringify(DARK_CLASS)});`;

export function toggleTheme(): Theme {
  const isDark = document.documentElement.classList.toggle(DARK_CLASS);
  const theme: Theme = isDark ? "dark" : "light";
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  return theme;
}
