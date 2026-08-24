/**
 * Light or dark, as one piece of state the room and the page share.
 *
 * The light switch in the scene and the system appearance both write here, and
 * both the room's lamp and the page's colours read it. That is the whole reason
 * it exists as a module: with the switch setting a theme and the theme driving
 * the switch, the two would chase each other.
 *
 * "Explicit choice, else the system" is the rule, and the stored value is
 * removed rather than overwritten when the system changes — absent means
 * following, which is a different state from having chosen the same thing.
 */

export const THEME_KEY = 'desk-room.theme';

/** The attribute `index.css` keys off. Absent means follow the media query. */
const ATTRIBUTE = 'data-theme';

const DARK_SCHEME = '(prefers-color-scheme: dark)';

/** A choice that has been made and stored, or null while following the system. */
export const storedTheme = (): 'light' | 'dark' | null => {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    // Private mode, or storage disabled. Following the system is a fine answer.
    return null;
  }
};

/** What the page is showing right now, chosen or inherited. */
export const isDark = (): boolean => {
  const stored = storedTheme();
  if (stored) return stored === 'dark';
  return window.matchMedia(DARK_SCHEME).matches;
};

/**
 * Record a choice and apply it.
 *
 * Written to the DOM here rather than through React, because the same attribute
 * is set by an inline script before the island exists — one owner for the
 * attribute, whoever gets there first.
 */
export const chooseTheme = (dark: boolean) => {
  const value = dark ? 'dark' : 'light';
  document.documentElement.setAttribute(ATTRIBUTE, value);
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {
    // The page still changes; it just will not survive a reload.
  }
};

/** Drop the choice and follow the system again. */
export const followSystem = () => {
  document.documentElement.removeAttribute(ATTRIBUTE);
  try {
    localStorage.removeItem(THEME_KEY);
  } catch {
    // Nothing stored, nothing to clear.
  }
};

/**
 * Watch the system appearance.
 *
 * A change there clears any stored choice, so whichever was done last wins.
 * Both are deliberate acts, and the alternative — a click on the switch
 * outranking every later change of appearance — quietly severs the room from
 * the page with nothing on screen to say why.
 */
export const watchSystem = (onChange: (dark: boolean) => void): (() => void) => {
  const query = window.matchMedia(DARK_SCHEME);
  const listen = (event: MediaQueryListEvent) => {
    followSystem();
    onChange(event.matches);
  };
  query.addEventListener('change', listen);
  return () => query.removeEventListener('change', listen);
};
