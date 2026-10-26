/**
 * Модуль експорту та збереження результатів
 */
window.App = window.App || {};

window.App.exporter = {
    /**
     * Зберегти вміст canvas у файл
     * @param {HTMLCanvasElement} canvas
     * @param {string} mimeType
     * @param {string} baseName
     */
    saveCanvas(canvas, mimeType = 'image/png', baseName = 'result_difference') {
        if (!canvas || canvas.width === 0 || canvas.height === 0 || canvas.style.display === 'none') {
            if (window.App.logger) {
                window.App.logger.log('Помилка: Немає результату для збереження.');
            }
            alert('Спочатку необхідно виконати обчислення для отримання результату!');
            return;
        }

        const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png';
        const link = document.createElement('a');
        link.download = `${baseName}.${ext}`;
        link.href = canvas.toDataURL(mimeType, 0.95);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (window.App.logger) {
            window.App.logger.log(`Результат успішно збережено у форматі ${ext.toUpperCase()}`);
        }
    }
};
