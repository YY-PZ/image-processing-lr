/**
 * Web Worker для паралельного попіксельного віднімання зображень (SharedArrayBuffer)
 */
self.onmessage = function (e) {
    const data = e.data;
    if (!data) return;

    const view1 = new Uint8ClampedArray(data.sab1);
    const view2 = new Uint8ClampedArray(data.sab2);
    const viewRes = new Uint8ClampedArray(data.sabRes);
    const { startPixel, endPixel, tolerance, workerId } = data;

    let posCount = 0;
    let negCount = 0;
    let matchCount = 0;

    const totalToProcess = endPixel - startPixel;
    const reportInterval = Math.max(5000, Math.floor(totalToProcess / 20));

    for (let p = startPixel; p < endPixel; p++) {
        const i = p * 4;

        const r1 = view1[i];
        const g1 = view1[i + 1];
        const b1 = view1[i + 2];
        const a1 = view1[i + 3];

        const r2 = view2[i];
        const g2 = view2[i + 1];
        const b2 = view2[i + 2];

        // Фотометрична яскравість (Luminance ITU-R BT.601)
        const val1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
        const val2 = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;

        const diff = val1 - val2;
        const diffMag = Math.abs(diff);

        if (diffMag <= tolerance) {
            // В межах допуску - беремо вихідний піксель базового зображення
            viewRes[i] = r1;
            viewRes[i + 1] = g1;
            viewRes[i + 2] = b1;
            viewRes[i + 3] = a1;
            matchCount++;
        } else if (diff > 0) {
            // Позитивна різниця — Червоний колір
            const intensity = Math.min(255, Math.max(0, Math.round(diffMag)));
            viewRes[i] = intensity; // R
            viewRes[i + 1] = 0;     // G
            viewRes[i + 2] = 0;     // B
            viewRes[i + 3] = 255;   // A
            posCount++;
        } else {
            // Негативна різниця — Синій колір
            const intensity = Math.min(255, Math.max(0, Math.round(diffMag)));
            viewRes[i] = 0;         // R
            viewRes[i + 1] = 0;     // G
            viewRes[i + 2] = intensity; // B
            viewRes[i + 3] = 255;   // A
            negCount++;
        }

        // Періодичне сповіщення про прогрес виконання
        if ((p - startPixel) % reportInterval === 0) {
            self.postMessage({
                type: 'progress',
                workerId: workerId,
                processed: p - startPixel,
                total: totalToProcess
            });
        }
    }

    self.postMessage({
        type: 'complete',
        workerId: workerId,
        posCount,
        negCount,
        matchCount
    });
};
