/**
 * Рушій обробки зображень: Vanilla JS (CPU)
 * 
 * Попіксельне віднімання зображень з підтримкою порогу чутливості (допуску),
 * розрахунком яскравості за стандартом Luminance (ITU-R BT.601),
 * визначенням знаку різниці (Червоний / Синій) та пропорційною інтенсивністю.
 */
window.App = window.App || {};
window.App.engines = window.App.engines || {};

window.App.engines['js'] = {
    id: 'js',
    name: 'Vanilla JS (CPU)',
    isAvailable: true,

    /**
     * Виконання попіксельного порівняння зображень
     * @param {Object} params
     * @param {ImageData} params.imgData1 - Пікселі базового зображення (від якого віднімаємо)
     * @param {ImageData} params.imgData2 - Пікселі другого зображення (яке віднімаємо)
     * @param {number} params.width - Ширина зображень
     * @param {number} params.height - Висота зображень
     * @param {number} params.tolerance - Поріг допуску в рівнях яскравості (0-255)
     * @param {Function} [params.onProgress] - Функція оновлення прогресу (0-100)
     * @returns {Promise<{ resultImageData: ImageData, stats: Object }>}
     */
    async process({
        imgData1,
        imgData2,
        width,
        height,
        tolerance = 0,
        onProgress = () => {}
    }) {
        const totalPixels = width * height;
        const data1 = imgData1.data;
        const data2 = imgData2.data;

        // Створюємо буфер для результуючого зображення
        const resultImageData = new ImageData(width, height);
        const resData = resultImageData.data;

        let posCount = 0;
        let negCount = 0;
        let matchCount = 0;

        // Розбиваємо обробку на порції (chunks), щоб інтерфейс не зависав
        // і Progress Bar оновлювався у реальному часі
        const CHUNK_SIZE = 50000;
        const numChunks = Math.ceil(totalPixels / CHUNK_SIZE);

        for (let chunkIdx = 0; chunkIdx < numChunks; chunkIdx++) {
            const startPixel = chunkIdx * CHUNK_SIZE;
            const endPixel = Math.min(startPixel + CHUNK_SIZE, totalPixels);

            for (let p = startPixel; p < endPixel; p++) {
                const i = p * 4;

                const r1 = data1[i];
                const g1 = data1[i + 1];
                const b1 = data1[i + 2];
                const a1 = data1[i + 3];

                const r2 = data2[i];
                const g2 = data2[i + 1];
                const b2 = data2[i + 2];

                // Яскравість (Luminance ITU-R BT.601)
                const val1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
                const val2 = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;

                const diff = val1 - val2;
                const diffMag = Math.abs(diff);

                // Якщо різниця в межах допуску
                if (diffMag <= tolerance) {
                    // Піксель залишається як у базовому зображенні (Зобр. 1)
                    resData[i] = r1;
                    resData[i + 1] = g1;
                    resData[i + 2] = b1;
                    resData[i + 3] = a1;
                    matchCount++;
                } else if (diff > 0) {
                    // Позитивна різниця (Зобр. 1 яскравіше за Зобр. 2) -> Червоний
                    const intensity = Math.min(255, Math.max(0, Math.round(diffMag)));
                    resData[i] = intensity; // R
                    resData[i + 1] = 0;     // G
                    resData[i + 2] = 0;     // B
                    resData[i + 3] = 255;   // A
                    posCount++;
                } else {
                    // Негативна різниця (Зобр. 1 темніше за Зобр. 2) -> Синій
                    const intensity = Math.min(255, Math.max(0, Math.round(diffMag)));
                    resData[i] = 0;         // R
                    resData[i + 1] = 0;     // G
                    resData[i + 2] = intensity; // B
                    resData[i + 3] = 255;   // A
                    negCount++;
                }
            }

            // Оновлюємо прогрес виконання
            const percent = Math.min(100, Math.round((endPixel / totalPixels) * 100));
            onProgress(percent);

            // Передаємо керування браузеру для перемалювання UI
            if (numChunks > 1) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        return {
            resultImageData,
            stats: {
                totalPixels,
                posCount,
                negCount,
                matchCount
            }
        };
    }
};
