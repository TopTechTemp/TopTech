function _productItemInit() {
    let initted = [];

    function qs(relative, selector) {
        return relative.querySelector(selector);
    }
    function getHeight(node) {
        let clone = node.cloneNode(true);
        const width = node.offsetWidth;
        clone.style.cssText = `position: absolute; z-index: -99; top: -100vh; left: -100vw; max-height: none; width: ${width}px;`;
        document.body.append(clone);
        let height = clone.offsetHeight;
        clone.remove();
        return height + 10;
    }

    class ProductSpoiler {
        constructor(node) {
            this.onClick = this.onClick.bind(this);

            this.rootElem = node;
            this.button = qs(this.rootElem, ".product-spoiler__button");
            this.hideable = qs(this.rootElem, ".product-spoiler__hideable");

            this.button.addEventListener("click", this.onClick);
            this.hide();
        }
        onClick() {
            this.rootElem.classList.contains("product-spoiler--shown")
                ? this.hide() : this.show();
        }
        hide() {
            this.rootElem.classList.remove("product-spoiler--shown");
            this.hideable.style.removeProperty("max-height");
            const iframe = this.hideable.querySelector("iframe");
            if (iframe) {
                // остановить воспроизведение ютуб-видео. Чтобы работало, важно, чтобы в ссылке был указан GET-параметр enablejsapi=1: https://www.youtube.com/embed/...?enablejsapi=1
                iframe.contentWindow.postMessage(`{"event":"command","func":"stopVideo","args":""}`, "*");
            }
        }
        show() {
            this.rootElem.classList.add("product-spoiler--shown");
            const height = getHeight(this.hideable);
            this.hideable.style.maxHeight = `${height + 400}px`;
        }
    }

    const productScoresData = [
        { score: 1, className: "product-score__under-5" },
        { score: 2, className: "product-score__under-5" },
        { score: 3, className: "product-score__under-5" },
        { score: 4, className: "product-score__under-5" },
        { score: 5, className: "product-score__under-7" },
        { score: 6, className: "product-score__under-7" },
        { score: 7, className: "product-score__under-8" },
        { score: 8, className: "product-score__under-9" },
        { score: 9, className: "product-score__under-10" },
    ];
    class ProductScore {
        constructor(node) {
            this.rootElem = node;
            this.score = parseInt(this.rootElem.dataset.prodScore) || 0;
            this.scaleFill = qs(this.rootElem, ".product-score-item__scale-fill");
            this.isPie = Boolean(qs(this.rootElem, ".product-estimate-pie"));

            this.setClass();
        }
        setClass() {
            let data = productScoresData.find(obj => obj.score === this.score);
            if (!data) {
                if (this.score < 1) data = productScoresData[0];
                else if (this.score > 9) data = productScoresData[productScoresData.length - 1];
            }

            data.className.split(" ").forEach(cl => {
                this.rootElem.classList.add(cl);
            });
            if (this.scaleFill) this.scaleFill.style.width = `${this.score * 10}%`;
            if (this.isPie) this.rootElem.style.cssText += `--prod_dasharray: ${1194 / 100 * this.score * 10}`;
        }
    }

    class ProductEstimatePie {
        constructor(node) {
            this.resize = this.resize.bind(this);

            this.rootElem = node;
            this.circleScale = this.rootElem.querySelector("circle:first-child");
            this.circleScaleFill = this.rootElem.querySelector("circle:last-child");
            window.addEventListener("resize", this.resize);
            this.resize();
        }
        resize() {
            const radiusRaw = this.rootElem.offsetWidth / 2;
            const radius = radiusRaw - Math.round((radiusRaw * 0.155));
            this.circleScale.setAttribute("r", radius);
            this.circleScaleFill.setAttribute("r", radius);

            const productEstimateClassInst = initted.find(classInst => {
                return classInst.rootElem.querySelector(".product-estimate-pie") === this.rootElem;
            });
            const score = productEstimateClassInst ? productEstimateClassInst.score : 1;
            const fullScaleDasharray = Math.round(radius * 6.28);
            const halfScaleDasharray = Math.round(fullScaleDasharray / 100 * score * 10);
            this.rootElem.style.cssText += `
                --prod_score_dasharray_half: ${halfScaleDasharray}; 
                --prod_score_dasharray_total: ${fullScaleDasharray}
            `;
        }
    }

    function init() {
        inittingSelectors.forEach(selectorData => {
            const selector = selectorData.selector;
            const classInstance = selectorData.classInstance;
            const notInittedNodes = Array.from(document.querySelectorAll(selector))
                .filter(node => {
                    let isInitted = Boolean(
                        initted.find(inpClass => {
                            return inpClass.rootElem === node
                                && inpClass instanceof selectorData.classInstance
                        })
                    );
                    return isInitted ? false : true;
                });

            notInittedNodes.forEach(inittingNode => {
                const inputParams = new classInstance(inittingNode);
                initted.push(inputParams);
            });
        });
        initted = initted.filter(inpParams => inpParams.rootElem);
    }

    let inittingSelectors = [
        { selector: ".product-spoiler", classInstance: ProductSpoiler },
        { selector: "[data-prod-score]", classInstance: ProductScore },
        { selector: ".product-estimate-pie", classInstance: ProductEstimatePie },
    ];

    let isInitting = false;
    const observer = new MutationObserver(() => {
        if (isInitting) return;

        isInitting = true;
        init();
        setTimeout(() => {
            isInitting = false;
            init();
        }, 0);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    init();
}

_productItemInit();