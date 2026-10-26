/**
 * Модуль логування
 */
window.App = window.App || {};

window.App.logger = {
    element: null,

    init(elementOrId) {
        if (typeof elementOrId === 'string') {
            this.element = document.getElementById(elementOrId);
        } else {
            this.element = elementOrId;
        }
    },

    log(message) {
        if (!this.element) {
            console.log(`[Log] ${message}`);
            return;
        }
        const time = new Date().toLocaleTimeString();
        this.element.value += `[${time}] ${message}\n`;
        this.element.scrollTop = this.element.scrollHeight;
    },

    clear() {
        if (this.element) {
            this.element.value = '';
        }
    }
};
