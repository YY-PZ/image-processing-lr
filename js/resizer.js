/**
 * Модуль узгодження (зведення) розмірів зображень
 */
window.App = window.App || {};

window.App.resizer = {
    /**
     * Застосувати зведення розміру одного зображення до іншого
     * @param {Object} options
     */
    applyResize({ targetValue, method, state, onComplete }) {
        // targetValue: '1' -> змінюємо Зобр. 2 під розмір Зобр. 1
        // targetValue: '2' -> змінюємо Зобр. 1 під розмір Зобр. 2
        const sourceImgObj = targetValue === '1' ? state.img2 : state.img1;
        const targetSizeObj = targetValue === '1' ? state.img1 : state.img2;

        const targetW = targetSizeObj.canvas.width;
        const targetH = targetSizeObj.canvas.height;
        const sourceW = sourceImgObj.canvas.width;
        const sourceH = sourceImgObj.canvas.height;

        const targetLabel = targetValue === '1' ? '2' : '1';

        if (window.App.logger) {
            window.App.logger.log(`Початок зведення Зобр. ${targetLabel} до ${targetW}x${targetH} методом [${method}]`);
        }

        // Тимчасовий канвас для нової картинки
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = targetW;
        tempCanvas.height = targetH;
        const tCtx = tempCanvas.getContext('2d');

        if (method === 'stretch') {
            // Жорстке розтягування (спотворює)
            tCtx.drawImage(sourceImgObj.canvas, 0, 0, sourceW, sourceH, 0, 0, targetW, targetH);
        } else if (method === 'crop-topleft') {
            // Беремо лівий верхній кут без масштабування
            tCtx.drawImage(
                sourceImgObj.canvas,
                0, 0,
                Math.min(sourceW, targetW), Math.min(sourceH, targetH),
                0, 0,
                Math.min(sourceW, targetW), Math.min(sourceH, targetH)
            );
        } else if (method === 'crop-center') {
            // Обрізка по центру (зі збереженням пропорцій)
            const ratioSource = sourceW / sourceH;
            const ratioTarget = targetW / targetH;
            let drawW, drawH, drawX, drawY;

            if (ratioSource > ratioTarget) {
                // Джерело ширше — обрізаємо боки
                drawH = targetH;
                drawW = sourceW * (targetH / sourceH);
                drawX = (targetW - drawW) / 2;
                drawY = 0;
            } else {
                // Джерело вище — обрізаємо верх/низ
                drawW = targetW;
                drawH = sourceH * (targetW / sourceW);
                drawX = 0;
                drawY = (targetH - drawH) / 2;
            }
            tCtx.drawImage(sourceImgObj.canvas, drawX, drawY, drawW, drawH);
        }

        // Застосовуємо результат на реальний канвас в UI
        sourceImgObj.canvas.width = targetW;
        sourceImgObj.canvas.height = targetH;
        sourceImgObj.ctx.clearRect(0, 0, targetW, targetH);
        sourceImgObj.ctx.drawImage(tempCanvas, 0, 0);

        // Оновлюємо UI лейбли
        const lblId = targetValue === '1' ? 'sizeLbl2' : 'sizeLbl1';
        const labelElem = document.getElementById(lblId);
        if (labelElem) {
            labelElem.innerText = `(${targetW}x${targetH}) - Зведено`;
        }

        if (window.App.logger) {
            window.App.logger.log(`Зведення завершено успішно.`);
        }

        if (typeof onComplete === 'function') {
            onComplete();
        }
    }
};
