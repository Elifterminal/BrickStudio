// Global toggle for movable parts. When off, spinning pieces hold still (good for building).
export let animating = true;

export function toggleAnimating() {
    animating = !animating;
    return animating;
}
