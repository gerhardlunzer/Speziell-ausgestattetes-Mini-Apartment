"use strict";
const isEnglish = document.documentElement.lang === "en";

document.addEventListener("DOMContentLoaded", () => {

    const button =
        document.getElementById("showMapButton");

    const container =
        document.getElementById("googleMapContainer");

    const frame =
        document.getElementById("googleMapFrame");

    if (!button || !container || !frame) {
        return;
    }

    button.addEventListener("click", () => {

        const isOpen =
            button.getAttribute("aria-expanded") === "true";

        if (isOpen) {

            container.hidden = true;

            button.setAttribute(
                "aria-expanded",
                "false"
            );

            button.textContent =
                isEnglish
        ? "🗺️ Show map"
        : "🗺️ Karte anzeigen";

            return;
        }

        if (!frame.src) {

            const mapSource =
                frame.dataset.src;

            if (!mapSource) {
                return;
            }

            frame.src = mapSource;
        }

        container.hidden = false;

        button.setAttribute(
            "aria-expanded",
            "true"
        );

        button.textContent =
            isEnglish
        ? "🗺️ Hide map"
        : "🗺️ Karte ausblenden";

    });

});