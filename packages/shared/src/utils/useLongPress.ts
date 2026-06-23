import { ref } from 'vue';

/**
 * Custom hook to detect long press gestures (touch and mouse) in Vue components.
 * Automatically handles touch movement thresholds to avoid accidental triggers during scrolling.
 * 
 * @param onLongPressCallback Callback executed when the long press is triggered, receiving the pressed HTMLElement.
 * @param delay Duration in milliseconds before triggering the long press (default: 600ms).
 */
export function useLongPress(onLongPressCallback: (el: HTMLElement) => void, delay = 600) {
    const touchTimer = ref<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressActive = ref(false);
    const startX = ref(0);
    const startY = ref(0);

    const start = (e: TouchEvent | MouseEvent) => {
        isLongPressActive.value = false;
        const targetEl = e.currentTarget as HTMLElement;
        
        if (window.TouchEvent && e instanceof TouchEvent) {
            if (e.touches.length > 0) {
                startX.value = e.touches[0].clientX;
                startY.value = e.touches[0].clientY;
            }
        }
        
        if (touchTimer.value) clearTimeout(touchTimer.value);

        touchTimer.value = setTimeout(() => {
            isLongPressActive.value = true;
            onLongPressCallback(targetEl);
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(50);
            }
        }, delay);
    };

    const move = (e: TouchEvent) => {
        if (!touchTimer.value) return;
        if (e.touches.length > 0) {
            const diffX = Math.abs(e.touches[0].clientX - startX.value);
            const diffY = Math.abs(e.touches[0].clientY - startY.value);
            // Cancel if user dragged finger more than 10 pixels
            if (diffX > 10 || diffY > 10) {
                cancel();
            }
        }
    };

    const cancel = () => {
        if (touchTimer.value) {
            clearTimeout(touchTimer.value);
            touchTimer.value = null;
        }
    };

    return {
        start,
        move,
        cancel,
        isLongPressActive
    };
}
