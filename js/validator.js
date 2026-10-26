/**
 * Модуль валідації та контролю стану елементів керування
 */
window.App = window.App || {};

window.App.validator = {
    /**
     * Валідація поля допуску різниці (0-255)
     * @param {HTMLInputElement} inputEl
     * @param {HTMLElement} errorEl
     * @param {boolean} [showLog=false]
     * @returns {boolean}
     */
    validateTolerance(inputEl, errorEl, showLog = false) {
        if (!inputEl || !errorEl) return false;

        const raw = inputEl.value.trim();
        const val = Number(raw);
        let errorMsg = '';

        if (inputEl.validity && inputEl.validity.badInput) {
            errorMsg = 'Введіть коректне числове значення допуску різниці.';
        } else if (raw === '') {
            errorMsg = 'Допуск різниці не заданий. Введіть число від 0 до 255.';
        } else if (isNaN(val) || !Number.isInteger(val)) {
            errorMsg = 'Некоректне значення: допуск різниці має бути цілим числом.';
        } else if (val < 0 || val > 255) {
            errorMsg = 'Некоректне значення: допуск різниці має бути в межах від 0 до 255.';
        }

        if (errorMsg) {
            errorEl.textContent = errorMsg;
            errorEl.classList.remove('hidden');
            inputEl.classList.add('input-error');
            if (showLog && window.App.logger) {
                window.App.logger.log(`Помилка: ${errorMsg}`);
            }
            return false;
        } else {
            errorEl.textContent = '';
            errorEl.classList.add('hidden');
            inputEl.classList.remove('input-error');
            return true;
        }
    },

    /**
     * Оновлення доступності кнопки розрахунку
     */
    updateCalculateButtonState({ btnCalculate, toleranceInput, toleranceError, state }) {
        if (!btnCalculate || state.isCalculating) return;

        const isToleranceValid = this.validateTolerance(toleranceInput, toleranceError, false);
        const canCalc = state.img1.loaded && state.img2.loaded && state.sizesMatch && isToleranceValid;
        btnCalculate.disabled = !canCalc;

        if (!state.img1.loaded || !state.img2.loaded) {
            btnCalculate.title = "Спочатку завантажте обидва зображення";
        } else if (!state.sizesMatch) {
            btnCalculate.title = "Необхідно узгодити розміри зображень";
        } else if (!isToleranceValid) {
            btnCalculate.title = "Введіть коректний допуск різниці (0-255)";
        } else {
            btnCalculate.title = "Обчислити різницю";
        }
    }
};
