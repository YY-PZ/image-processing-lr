/**
 * Головний файл ініціалізації та координації додатку
 */
document.addEventListener('DOMContentLoaded', () => {
    const { state, logger, validator, uploader, resizer, processor, exporter, modal } = window.App;

    // Ініціалізація канвасів у стані
    const canvas1 = document.getElementById('canvas1');
    const canvas2 = document.getElementById('canvas2');
    const canvasResult = document.getElementById('canvasResult');

    state.img1.canvas = canvas1;
    state.img1.ctx = canvas1.getContext('2d');
    state.img2.canvas = canvas2;
    state.img2.ctx = canvas2.getContext('2d');

    // DOM Елементи керування
    const resizeSettings = document.getElementById('resizeSettings');
    const resizeTarget = document.getElementById('resizeTarget');
    const resizeMethod = document.getElementById('resizeMethod');
    const btnApplyResize = document.getElementById('btnApplyResize');
    const btnCalculate = document.getElementById('btnCalculate');
    const toleranceInput = document.getElementById('tolerance');
    const toleranceError = document.getElementById('toleranceError');
    const processingEngine = document.getElementById('processingEngine');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const timeText = document.getElementById('timeText');
    const phRes = document.getElementById('phRes');
    const resHint = document.getElementById('resHint');
    const exportFormat = document.getElementById('exportFormat');
    const btnSave = document.getElementById('btnSave');

    // 1. Ініціалізація логера
    logger.init('logConsole');

    // 2. Ініціалізація модального вікна
    modal.init({
        modalId: 'fullscreenModal',
        imgId: 'fullscreenImg',
        titleId: 'modalTitle',
        closeBtnId: 'btnCloseModal',
        backdropId: 'modalBackdrop'
    });

    // Допоміжна функція оновлення стану кнопки обчислення
    function refreshCalcButton() {
        validator.updateCalculateButtonState({
            btnCalculate,
            toleranceInput,
            toleranceError,
            state
        });
    }

    // 3. Перевірка стану готовності та узгодженості розмірів
    function checkState() {
        if (!state.img1.loaded || !state.img2.loaded) {
            refreshCalcButton();
            return;
        }

        // Порівнюємо поточні розміри робочих canvas
        state.sizesMatch = (state.img1.canvas.width === state.img2.canvas.width &&
                            state.img1.canvas.height === state.img2.canvas.height);

        if (!state.sizesMatch) {
            resizeSettings.classList.remove('hidden');
            refreshCalcButton();
            logger.log("Увага: Розміри відрізняються. Необхідно застосувати зведення.");
        } else {
            resizeSettings.classList.add('hidden');
            refreshCalcButton();
            logger.log("Розміри збігаються. Готово до обчислення.");
        }
    }

    // 4. Налаштування завантаження зображень
    uploader.setupUpload({
        inputId: 'uploadImg1',
        imgObj: state.img1,
        placeholderId: 'ph1',
        sizeLabelId: 'sizeLbl1',
        tooltipId: 'tooltipImg1',
        name: 'Зобр. 1',
        onLoaded: checkState
    });

    uploader.setupUpload({
        inputId: 'uploadImg2',
        imgObj: state.img2,
        placeholderId: 'ph2',
        sizeLabelId: 'sizeLbl2',
        tooltipId: 'tooltipImg2',
        name: 'Зобр. 2',
        onLoaded: checkState
    });

    // 5. Події валідації допуску
    toleranceInput.addEventListener('input', refreshCalcButton);
    toleranceInput.addEventListener('change', refreshCalcButton);

    // 6. Зведення розмірів
    btnApplyResize.addEventListener('click', () => {
        resizer.applyResize({
            targetValue: resizeTarget.value,
            method: resizeMethod.value,
            state,
            onComplete: checkState
        });
    });

    // 7. Запуск обчислення різниці
    btnCalculate.addEventListener('click', () => {
        if (!validator.validateTolerance(toleranceInput, toleranceError, true)) {
            refreshCalcButton();
            toleranceInput.focus();
            return;
        }

        processor.run({
            tolerance: Number(toleranceInput.value),
            engine: processingEngine.value,
            state,
            progressBar,
            progressText,
            timeText,
            canvasResult,
            phRes,
            resHint,
            btnCalculate,
            btnApplyResize,
            btnSave,
            onComplete: refreshCalcButton
        });
    });

    // 8. Експорт / збереження результату
    btnSave.addEventListener('click', () => {
        exporter.saveCanvas(canvasResult, exportFormat.value, 'difference_result');
    });

    // 9. Повноекранний перегляд
    canvasResult.addEventListener('click', () => {
        modal.open(canvasResult, 'Результат віднімання');
    });

    if (resHint) {
        resHint.addEventListener('click', () => {
            modal.open(canvasResult, 'Результат віднімання');
        });
    }

    canvas1.addEventListener('click', () => {
        if (state.img1.loaded) modal.open(canvas1, 'Зображення 1');
    });

    canvas2.addEventListener('click', () => {
        if (state.img2.loaded) modal.open(canvas2, 'Зображення 2');
    });

    // Початкова ініціалізація
    refreshCalcButton();
});
