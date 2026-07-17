/** Brief flash when the mobile betting drawer newly collapses. */

export function shouldMobileDrawerCollapseEntryPulse(prevCollapsed, nextCollapsed) {

  return prevCollapsed !== true && nextCollapsed === true;

}

