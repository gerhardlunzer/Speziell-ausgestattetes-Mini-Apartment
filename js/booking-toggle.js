"use strict";

const isEnglishToggle =
    document.documentElement.lang === "en";

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
            ? (
                isEnglishToggle
                    ? "📅 Availability & Direct Booking"
                    : "📅 Verfügbarkeit & Direktbuchung"
            )
            : (
                isEnglishToggle
                    ? "📅 Close Availability & Direct Booking"
                    : "📅 Verfügbarkeit & Direktbuchung schließen"
            );

        if (!isOpen) {
            details.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

    });

});