import type { IconName } from './Icon'

/** Which icon stands for a platform (generic shapes, not the platforms' logos). */
export const platformIcon = (platform: string): IconName => {
  if (/steam|epic|pc/i.test(platform)) return 'monitor'
  if (/nintendo/i.test(platform)) return 'handheld'
  return 'gamepad'
}
