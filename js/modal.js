/**
 * Модуль модального вікна для перегляду зображень у повному розмірі
 */
window.App = window.App || {};

window.App.modal = {
    modalElem: null,
    imgElem: null,
    titleElem: null,

    init({ modalId, imgId, titleId, closeBtnId, backdropId }) {
        this.modalElem = document.getElementById(modalId);
        this.imgElem = document.getElementById(imgId);
        this.titleElem = document.getElementById(titleId);

        const closeBtn = document.getElementById(closeBtnId);
        const backdrop = document.getElementById(backdropId);

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        if (backdrop) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.close();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalElem && !this.modalElem.classList.contains('hidden')) {
                this.close();
            }
        });
    },

    open(canvas, title = 'Зображення') {
        if (!canvas || canvas.style.display === 'none' || canvas.width === 0) return;

        if (this.imgElem) {
            this.imgElem.src = canvas.toDataURL();
        }
        if (this.titleElem) {
            this.titleElem.innerText = `${title} (${canvas.width}x${canvas.height}px)`;
        }
        if (this.modalElem) {
            this.modalElem.classList.remove('hidden');
        }
    },

    close() {
        if (this.modalElem) {
            this.modalElem.classList.add('hidden');
        }
    }
};
