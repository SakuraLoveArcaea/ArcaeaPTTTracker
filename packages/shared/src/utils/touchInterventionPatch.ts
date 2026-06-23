// Patch Event.prototype.preventDefault globally to avoid browser console warnings:
// "[Intervention] Ignored attempt to cancel a touchend event with cancelable=false, for example because scrolling is in progress and cannot be interrupted."
// This happens when Highcharts' document-level touch listeners try to preventDefault on non-cancelable touch events.
(function () {
    if (typeof Event !== 'undefined' && Event.prototype) {
        const originalPreventDefault = Event.prototype.preventDefault;
        Event.prototype.preventDefault = function (this: Event) {
            if (this.cancelable !== false) {
                originalPreventDefault.call(this);
            }
        };
    }
})();
