"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const button =
        document.getElementById("bookingToggleButton");

    const details =
        document.getElementById("bookingDetails");

    if (!button || !details) {
        return;
    }

    button.addEventListener("click", () => {

        const isOpen =
            button.getAttribute("aria-expanded") === "true";

        details.hidden = isOpen;

        button.setAttribute(
            "aria-expanded",
            String(!isOpen)
        );

        button.textContent = isOpen
            ? "📅 Verfügbarkeit & Direktbuchung"
            : "📅 Verfügbarkeit & Direktbuchung schließen";

        if (!isOpen) {
            details.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

    });

});