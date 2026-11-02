import type { NavigateFunction } from "react-router-dom";

export const ABOUT_SECTION_ID = "about";

export function navigateToAbout(
  navigate: NavigateFunction,
  pathname: string,
) {
  if (pathname === "/") {
    scrollToAboutSection();
    return;
  }

  navigate({ pathname: "/", hash: ABOUT_SECTION_ID });
}

export function scrollToAboutSection(): boolean {
  const el = document.getElementById(ABOUT_SECTION_ID);
  if (!el) return false;

  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}
