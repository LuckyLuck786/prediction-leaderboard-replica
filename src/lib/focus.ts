/**
 * For an element inside a container that clips (overflow hidden or scrolling):
 * the focus ring is drawn just inside its edge, where the container cannot cut
 * it off (BUG-065). Written out in full so Tailwind sees the class.
 */
export const INSET_FOCUS_RING = "focus-visible:outline-offset-[-2px]";
