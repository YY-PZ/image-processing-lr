/**
 * Рушій обробки зображень: Web Workers (Багатопотоковість з SharedArrayBuffer)
 * 
 * Паралельна попіксельна обробка на базі кількості ядер CPU (navigator.hardwareConcurrency)
 * зі спільною пам'яттю (SharedArrayBuffer).
 */
window.App = window.App || {};
window.App.engines = window.App.engines || {};

window.App.engines['worker'] = {
    id: 'worker',
    name: 'Web Workers (SharedArrayBuffer)',
    isAvailable: true,

    /**
     * Перевірка доступності SharedArrayBuffer у поточному середовищі
     */
    checkSupport() {
        if (typeof Worker === 'undefined') {
            return {
                ok: false,
                reason: 'Web Workers не підтримуються вашим браузером.'
            };
        }

        if (typeof SharedArrayBuffer === 'undefined') {
            return {
                ok: false,
                reason: 'SharedArrayBuffer недоступний у цьому браузері або заблокований з міркувань безпеки (Spectre/Meltdown).'
            };
        }

        if (typeof crossOriginIsolated !== 'undefined' && !crossOriginIsolated) {
            return {
                ok: false,
                reason: 'Сторінка не має ізоляції crossOriginIsolated (window.crossOriginIsolated === false).\n' +
                        'Для роботи SharedArrayBuffer веб-сервер повинен надсилати HTTP-заголовки:\n' +
                        '  Cross-Origin-Opener-Policy: same-origin\n' +
                        '  Cross-Origin-Embedder-Policy: require-corp'
            };
        }

        try {
            const test = new SharedArrayBuffer(16);
            if (test.byteLength !== 16) {
                return { ok: false, reason: 'Не вдалося коректно виділити SharedArrayBuffer.' };
            }
        } catch (err) {
            return { ok: false, reason: `Помилка виділення SharedArrayBuffer: ${err.message}` };
        }

        return { ok: true };
    },

    /**
     * Багатопотокове попіксельне віднімання зображень
     */
    async process({
        imgData1,
        imgData2,
        width,
        height,
        tolerance = 0,
        onProgress = () => {}
    }) {
        // Перевіряємо доступність технології
        const support = this.checkSupport();
        if (!support.ok) {
            const errorMsg = `Метод "Web Workers (SharedArrayBuffer)" недоступний:\n\n${support.reason}`;
            alert(errorMsg);
            if (window.App.logger) {
                window.App.logger.log(`Помилка: ${support.reason.replace(/\n/g, ' ')}`);
            }
            throw new Error(support.reason);
        }

        const totalPixels = width * height;
        const totalBytes = totalPixels * 4;

        // Кількість потоків на основі ядер процесора
        const hardwareThreads = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
        const maxSensibleWorkers = Math.max(1, Math.floor(totalPixels / 2000));
        const numWorkers = Math.min(hardwareThreads, maxSensibleWorkers);

        if (window.App.logger) {
            window.App.logger.log(
                `Запуск Web Workers: ${numWorkers} потоків (hardwareConcurrency: ${hardwareThreads}), пам'ять: SharedArrayBuffer.`
            );
        }

        // Виділяємо спільні буфери
        const sab1 = new SharedArrayBuffer(totalBytes);
        const sab2 = new SharedArrayBuffer(totalBytes);
        const sabRes = new SharedArrayBuffer(totalBytes);

        new Uint8ClampedArray(sab1).set(imgData1.data);
        new Uint8ClampedArray(sab2).set(imgData2.data);

        const pixelsPerWorker = Math.floor(totalPixels / numWorkers);
        const workerProgress = new Array(numWorkers).fill(0);

        const workers = [];
        const promises = [];

        try {
            for (let k = 0; k < numWorkers; k++) {
                const startPixel = k * pixelsPerWorker;
                const endPixel = (k === numWorkers - 1) ? totalPixels : (k + 1) * pixelsPerWorker;

                let worker;
                try {
                    worker = new Worker('js/workers/diff-worker.js');
                } catch (err) {
                    const msg = `Помилка створення Web Worker #${k} з файлу 'js/workers/diff-worker.js':\n${err.message}.\n` +
                                `Зверніть увагу: протокол file:// блокує завантаження скриптів у Worker. ` +
                                `Запустіть проєкт через локальний сервер (наприклад Live Server).`;
                    alert(msg);
                    if (window.App.logger) {
                        window.App.logger.log(`Помилка створення Worker: ${err.message}`);
                    }
                    throw new Error(msg);
                }

                workers.push(worker);

                const workerPromise = new Promise((resolve, reject) => {
                    worker.onmessage = (e) => {
                        const msg = e.data;
                        if (!msg) return;

                        if (msg.type === 'progress') {
                            workerProgress[k] = msg.processed / msg.total;
                            const totalRatio = workerProgress.reduce((sum, val) => sum + val, 0) / numWorkers;
                            onProgress(Math.min(99, Math.round(totalRatio * 100)));
                        } else if (msg.type === 'complete') {
                            workerProgress[k] = 1;
                            resolve(msg);
                        }
                    };

                    worker.onerror = (err) => {
                        const msg = `Помилка у фоновому потоці #${k}: ${err.message || 'Worker Error'}`;
                        reject(new Error(msg));
                    };

                    worker.postMessage({
                        sab1,
                        sab2,
                        sabRes,
                        startPixel,
                        endPixel,
                        tolerance,
                        workerId: k
                    });
                });

                promises.push(workerPromise);
            }

            const results = await Promise.all(promises);
            onProgress(100);

            let totalPos = 0;
            let totalNeg = 0;
            let totalMatch = 0;

            for (const r of results) {
                totalPos += r.posCount;
                totalNeg += r.negCount;
                totalMatch += r.matchCount;
            }

            const resultImageData = new ImageData(width, height);
            resultImageData.data.set(new Uint8ClampedArray(sabRes));

            return {
                resultImageData,
                stats: {
                    totalPixels,
                    posCount: totalPos,
                    negCount: totalNeg,
                    matchCount: totalMatch
                }
            };
        } finally {
            // Завжди зупиняємо всі створені воркери
            workers.forEach((w) => {
                try {
                    w.terminate();
                } catch (e) {
                    // ignore
                }
            });
        }
    }
};
