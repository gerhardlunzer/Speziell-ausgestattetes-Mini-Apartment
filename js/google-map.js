"use strict";

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
                "🗺️ Karte anzeigen";

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
            "🗺️ Karte ausblenden";

    });

});