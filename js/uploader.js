/**
 * Модуль завантаження та відображення зображень
 */
window.App = window.App || {};

window.App.uploader = {
    /**
     * Налаштування завантажувача файлів для зображення
     */
    setupUpload({ inputId, imgObj, placeholderId, sizeLabelId, tooltipId, name, onLoaded }) {
        const input = document.getElementById(inputId);
        const placeholder = document.getElementById(placeholderId);
        const sizeLabel = document.getElementById(sizeLabelId);
        const tooltip = document.getElementById(tooltipId);

        if (!input) return;

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                imgObj.img.onload = () => {
                    imgObj.w = imgObj.img.width;
                    imgObj.h = imgObj.img.height;
                    imgObj.loaded = true;

                    // Оновлення UI
                    if (placeholder) placeholder.classList.add('hidden');
                    imgObj.canvas.style.display = 'block';
                    imgObj.canvas.width = imgObj.w;
                    imgObj.canvas.height = imgObj.h;
                    imgObj.ctx.drawImage(imgObj.img, 0, 0);

                    if (sizeLabel) {
                        sizeLabel.innerText = `(${imgObj.w}x${imgObj.h})`;
                    }
                    if (tooltip) {
                        tooltip.innerHTML = `Розмір: ${imgObj.w}x${imgObj.h}<br>Вага: ${(file.size / 1024).toFixed(1)} KB`;
                    }

                    if (window.App.logger) {
                        window.App.logger.log(`${name} завантажено: ${imgObj.w}x${imgObj.h}px`);
                    }

                    if (typeof onLoaded === 'function') {
                        onLoaded();
                    }
                };
                imgObj.img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
};
