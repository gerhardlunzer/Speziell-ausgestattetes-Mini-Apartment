"use strict";
const isEnglish = document.documentElement.lang === "en";

document.addEventListener("DOMContentLoaded", initBookingCalendar);

async function initBookingCalendar() {

    const calendarContainer =
        document.getElementById("booking-calendar");

    if (!calendarContainer) {
        return;
    }

    calendarContainer.innerHTML = `
        <p class="calendar-loading">
            ${isEnglish
            ? "Availability is being loaded …"
            : "Verfügbarkeit wird geladen …"}
        </p>
    `;

    try {

        /*
         * Der Zeitstempel verhindert, dass der Browser eine alte
         * availability.json aus dem Zwischenspeicher verwendet.
         */
        const response = await fetch(
            `data/availability.json?t=${Date.now()}`
        );

        if (!response.ok) {
            throw new Error(
                `Verfügbarkeitsdaten konnten nicht geladen werden:
                 HTTP ${response.status}`
            );
        }

        const availability = await response.json();

        if (!Array.isArray(availability.booked)) {
            throw new Error(
                "Die Verfügbarkeitsdatei hat ein ungültiges Format."
            );
        }

        renderCalendar(
            calendarContainer,
            availability.booked,
            availability.updatedAt
        );

    } catch (error) {

        console.error(
            "Fehler beim Laden des Kalenders:",
            error
        );

        calendarContainer.innerHTML = `
            <div class="calendar-error">
                <strong>
                    ${isEnglish
                ? "The availability calendar could not be loaded at the moment."
                : "Der Verfügbarkeitskalender konnte momentan nicht geladen werden."}
        </strong>

        <p>
            ${isEnglish
                ? "Please try again later or contact us directly."
                : "Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt."}
                </p>
            </div>
        `;

    }

}


function renderCalendar(
    container,
    bookedRanges,
    updatedAt
) {

    const today = startOfDay(new Date());

    const todayBooked =
        isDateBooked(today, bookedRanges);

    const statusClass =
        todayBooked ? "occupied" : "available";

    const statusText =
        todayBooked
            ? (isEnglish
            ? "The apartment is occupied today."
            : "Das Apartment ist heute belegt.")
        : (isEnglish
            ? "The apartment is currently available today."
            : "Das Apartment ist heute grundsätzlich verfügbar.");

    const lastUpdatedText =
        formatUpdatedAt(updatedAt);

    container.innerHTML = `
        <div class="current-status ${statusClass}">
            <span class="current-status-dot"></span>
            <span>${statusText}</span>
        </div>

        <div class="calendar-months"></div>

        ${
            lastUpdatedText
                ? `
                    <p class="calendar-updated">
                        ${isEnglish
        ? "Calendar last updated:"
        : "Kalender zuletzt aktualisiert:"}
    ${lastUpdatedText}
    </p>
                `
                : ""
        }
    `;

    const monthsContainer =
        container.querySelector(".calendar-months");

    /*
     * Aktueller Monat plus elf weitere Monate.
     */
    for (let offset = 0; offset < 12; offset += 1) {

        const monthDate = new Date(
            today.getFullYear(),
            today.getMonth() + offset,
            1
        );

        monthsContainer.appendChild(
            createMonth(
                monthDate,
                today,
                bookedRanges
            )
        );

    }

}


function createMonth(
    monthDate,
    today,
    bookedRanges
) {

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const monthElement =
        document.createElement("section");

    monthElement.className = "calendar-month";

    const monthTitle =
        new Intl.DateTimeFormat(
isEnglish ? "en-GB" : "de-AT",            {
                month: "long",
                year: "numeric"
            }
        ).format(monthDate);

    monthElement.innerHTML = `
        <h3>${capitalizeFirstLetter(monthTitle)}</h3>

        <div class="calendar-weekdays">
            <span>${isEnglish ? "Mon" : "Mo"}</span>
    <span>${isEnglish ? "Tue" : "Di"}</span>
    <span>${isEnglish ? "Wed" : "Mi"}</span>
    <span>${isEnglish ? "Thu" : "Do"}</span>
    <span>${isEnglish ? "Fri" : "Fr"}</span>
    <span>${isEnglish ? "Sat" : "Sa"}</span>
    <span>${isEnglish ? "Sun" : "So"}</span>
        </div>

        <div class="calendar-days"></div>
    `;

    const daysContainer =
        monthElement.querySelector(".calendar-days");

    /*
     * JavaScript zählt Sonntag als 0.
     * Für unseren Kalender soll Montag der erste Tag sein.
     */
    const firstDayOfMonth =
        new Date(year, month, 1);

    const leadingEmptyDays =
        (firstDayOfMonth.getDay() + 6) % 7;

    for (
        let empty = 0;
        empty < leadingEmptyDays;
        empty += 1
    ) {

        const emptyElement =
            document.createElement("span");

        emptyElement.className =
            "calendar-day calendar-day-empty";

        daysContainer.appendChild(emptyElement);

    }

    const numberOfDays =
        new Date(year, month + 1, 0).getDate();

    for (
        let dayNumber = 1;
        dayNumber <= numberOfDays;
        dayNumber += 1
    ) {

        const date =
            new Date(year, month, dayNumber);

        const dayElement =
            document.createElement("span");

        dayElement.classList.add("calendar-day");
        dayElement.textContent = String(dayNumber);

        const isPast =
            startOfDay(date) < today;

        const isToday =
            isSameDay(date, today);

        const booked =
            isDateBooked(date, bookedRanges);

       if (isPast && !isToday) {

    dayElement.classList.add("past");
    dayElement.title =
        `${formatDate(date)} – ${isEnglish ? "past" : "vergangen"}`;

} else if (booked) {

    dayElement.classList.add("booked");
    dayElement.title =
        `${formatDate(date)} – ${isEnglish ? "already booked" : "bereits belegt"}`;

} else {

    dayElement.classList.add("free");
    dayElement.title =
        `${formatDate(date)} – ${isEnglish ? "available" : "grundsätzlich frei"}`;

}

        if (isToday) {
            dayElement.classList.add("today");
        }

        daysContainer.appendChild(dayElement);

    }

    return monthElement;

}


function isDateBooked(
    date,
    bookedRanges
) {

    const dateKey = toDateKey(date);

    return bookedRanges.some(range => {

        /*
         * endExclusive ist der Abreisetag.
         * Dieser Tag wird deshalb nicht mehr rot markiert.
         */
        return (
            dateKey >= range.start &&
            dateKey < range.endExclusive
        );

    });

}


function toDateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function startOfDay(date) {

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

}


function isSameDay(firstDate, secondDate) {

    return (
        firstDate.getFullYear() ===
            secondDate.getFullYear() &&
        firstDate.getMonth() ===
            secondDate.getMonth() &&
        firstDate.getDate() ===
            secondDate.getDate()
    );

}


function formatDate(date) {

    return new Intl.DateTimeFormat(
    isEnglish ? "en-GB" : "de-AT",        {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    ).format(date);

}


function formatUpdatedAt(updatedAt) {

    if (!updatedAt) {
        return "";
    }

    const date =
        new Date(updatedAt);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat(
    isEnglish ? "en-GB" : "de-AT",        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);

}


function capitalizeFirstLetter(text) {

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );

}