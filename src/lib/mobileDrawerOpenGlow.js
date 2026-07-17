/** Subtle drawer-tab pulse when betting is open but the mobile panel is collapsed. */
export function shouldMobileDrawerOpenGlow(isPortraitMobile, bettingOpen, drawerCollapsed) {
  return isPortraitMobile === true && bettingOpen === true && drawerCollapsed === true;
}
