/** Brief flash when the mobile betting drawer newly opens. */

export function shouldMobileDrawerOpenEntryPulse(prevOpen, nextOpen) {

  return prevOpen !== true && nextOpen === true;

}

