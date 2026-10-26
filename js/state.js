/**
 * Стан додатку
 */
window.App = window.App || {};

window.App.state = {
    img1: {
        canvas: null,
        ctx: null,
        img: new Image(),
        w: 0,
        h: 0,
        loaded: false
    },
    img2: {
        canvas: null,
        ctx: null,
        img: new Image(),
        w: 0,
        h: 0,
        loaded: false
    },
    sizesMatch: false,
    isCalculating: false
};
