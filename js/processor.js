/**
 * Модуль координації процесу обробки зображень
 */
window.App = window.App || {};

window.App.processor = {
    /**
     * Запуск процесу обчислення різниці між зображеннями
     */
    async run({
        tolerance,
        engine = 'js',
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
        onComplete
    }) {
        if (state.isCalculating) return;

        if (window.App.logger) {
            window.App.logger.log(`Запуск обробки: рушій [${engine.toUpperCase()}], допуск ${tolerance}.`);
        }

        state.isCalculating = true;

        if (btnCalculate) btnCalculate.disabled = true;
        if (btnApplyResize) btnApplyResize.disabled = true;

        if (progressBar) progressBar.style.width = '0%';
        if (progressText) progressText.innerText = '0%';
        if (timeText) timeText.innerText = 'Обчислення...';

        const startTime = performance.now();

        try {
            const width = state.img1.canvas.width;
            const height = state.img1.canvas.height;

            // Отримуємо сирі масиви пікселів з обох полотен
            const imgData1 = state.img1.ctx.getImageData(0, 0, width, height);
            const imgData2 = state.img2.ctx.getImageData(0, 0, width, height);

            // Вибираємо відповідний рушій обробки
            const engineInstance = window.App.engines[engine] || window.App.engines['js'];

            const { resultImageData, stats } = await engineInstance.process({
                imgData1,
                imgData2,
                width,
                height,
                tolerance,
                onProgress: (percent) => {
                    if (progressBar) progressBar.style.width = `${percent}%`;
                    if (progressText) progressText.innerText = `${percent}%`;
                }
            });

            // Відображаємо результуючі пікселі на Canvas
            if (canvasResult) {
                canvasResult.width = width;
                canvasResult.height = height;
                const ctxRes = canvasResult.getContext('2d');
                ctxRes.putImageData(resultImageData, 0, 0);
                canvasResult.style.display = 'block';
            }

            if (phRes) phRes.classList.add('hidden');
            if (resHint) resHint.style.display = 'inline';
            if (btnSave) btnSave.disabled = false;

            const duration = (performance.now() - startTime).toFixed(2);
            if (timeText) timeText.innerText = `${duration} ms`;

            if (window.App.logger) {
                const posPct = ((stats.posCount / stats.totalPixels) * 100).toFixed(1);
                const negPct = ((stats.negCount / stats.totalPixels) * 100).toFixed(1);
                const matchPct = ((stats.matchCount / stats.totalPixels) * 100).toFixed(1);

                window.App.logger.log(`Обчислення успішно завершено за ${duration} ms.`);
                window.App.logger.log(
                    `Статистика: Червоні (+) : ${stats.posCount.toLocaleString()} (${posPct}%), ` +
                    `Сині (-) : ${stats.negCount.toLocaleString()} (${negPct}%), ` +
                    `Без змін : ${stats.matchCount.toLocaleString()} (${matchPct}%).`
                );
            }
        } catch (error) {
            console.error('Помилка під час обробки:', error);
            if (window.App.logger) {
                window.App.logger.log(`Помилка: ${error.message || error}`);
            }
            alert(`Помилка під час обчислення: ${error.message}`);
        } finally {
            state.isCalculating = false;
            if (btnApplyResize) btnApplyResize.disabled = false;
            if (typeof onComplete === 'function') {
                onComplete();
            }
        }
    }
};
