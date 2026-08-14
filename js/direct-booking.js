"use strict";
const isEnglish = document.documentElement.lang === "en";

document.addEventListener(
    "DOMContentLoaded",
    initDirectBooking
);

async function initDirectBooking() {

    const form =
        document.getElementById("directBookingForm");

    if (!form) {
        return;
    }

    const arrivalInput =
        document.getElementById("arrivalDate");

    const departureInput =
        document.getElementById("departureDate");

    const messageElement =
        document.getElementById("bookingFormMessage");

    let bookedRanges = [];
    let whatsappNumber = "";

    setEarliestArrival(arrivalInput);

    try {

        const [
            availabilityResponse,
            dataResponse
        ] = await Promise.all([
            fetch(`data/availability.json?t=${Date.now()}`),
            fetch(`data.json?t=${Date.now()}`)
        ]);

        if (!availabilityResponse.ok) {
            throw new Error(
                "Die Verfügbarkeitsdaten konnten nicht geladen werden."
            );
        }

        if (!dataResponse.ok) {
            throw new Error(
                "Die Kontaktdaten konnten nicht geladen werden."
            );
        }

        const availability =
            await availabilityResponse.json();

        const websiteData =
            await dataResponse.json();

        bookedRanges =
            Array.isArray(availability.booked)
                ? availability.booked
                : [];

        whatsappNumber =
            String(
                websiteData?.config?.whatsapp || ""
            ).replace(/\D/g, "");

        if (!whatsappNumber) {
            throw new Error(
                "Die WhatsApp-Nummer fehlt in data.json."
            );
        }

    } catch (error) {

        console.error(
            "Direktanfrage konnte nicht vorbereitet werden:",
            error
        );

        showMessage(
    messageElement,
    isEnglish
        ? "The direct booking request cannot be loaded at the moment. " +
          "Please contact us by phone or WhatsApp."
        : "Die Direktanfrage kann momentan nicht geladen werden. " +
          "Bitte kontaktieren Sie uns telefonisch oder per WhatsApp.",
    "error"
);

        form.querySelector(
            'button[type="submit"]'
        ).disabled = true;

        return;
    }

    arrivalInput.addEventListener(
        "change",
        () => {

            if (!arrivalInput.value) {
                return;
            }

            const minimumDeparture =
                addDaysToDateKey(
                    arrivalInput.value,
                    2
                );

            departureInput.min =
                minimumDeparture;

            if (
                !departureInput.value ||
                departureInput.value < minimumDeparture
            ) {
                departureInput.value =
                    minimumDeparture;
            }

            clearMessage(messageElement);
        }
    );

    departureInput.addEventListener(
        "change",
        () => clearMessage(messageElement)
    );

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            clearMessage(messageElement);

            if (!form.reportValidity()) {
                return;
            }

            const arrival =
                arrivalInput.value;

            const departure =
                departureInput.value;

            const guests =
                document.getElementById(
                    "guestCount"
                ).value;

            const dogs =
                document.getElementById(
                    "dogCount"
                ).value;

            const name =
                document.getElementById(
                    "guestName"
                ).value.trim();

            const personalMessage =
                document.getElementById(
                    "bookingMessage"
                ).value.trim();

            const validationError =
                validateRequest(
                    arrival,
                    departure,
                    bookedRanges
                );

            if (validationError) {

                showMessage(
                    messageElement,
                    validationError,
                    "error"
                );

                return;
            }

            const numberOfNights =
                differenceInCalendarDays(
                    arrival,
                    departure
                );

            const dogsText =
    dogs === "0"
        ? (isEnglish ? "none" : "keine")
        : dogs;

const messageLines =
    isEnglish
        ? [
            "Hello!",
            "",
            "I am interested in booking the mini apartment in Forchtenstein directly.",
            "",
            `Name: ${name}`,
            `Arrival: ${formatDateKey(arrival)}`,
            `Departure: ${formatDateKey(departure)}`,
            `Nights: ${numberOfNights}`,
            `Guests: ${guests}`,
            `Dogs: ${dogsText}`
        ]
        : [
            "Guten Tag!",
            "",
            "ich interessiere mich für eine Direktbuchung " +
            "des Mini-Apartments in Forchtenstein.",
            "",
            `Name: ${name}`,
            `Anreise: ${formatDateKey(arrival)}`,
            `Abreise: ${formatDateKey(departure)}`,
            `Übernachtungen: ${numberOfNights}`,
            `Gäste: ${guests}`,
            `Hunde: ${dogsText}`
        ];

if (personalMessage) {

    messageLines.push(
        "",
        isEnglish ? "Message:" : "Nachricht:",
        personalMessage
    );
}

if (isEnglish) {

    messageLines.push(
        "",
        "Please check availability and send me a direct booking offer.",
        "",
        "Thank you!"
    );

} else {

    messageLines.push(
        "",
        "Bitte prüfen Sie die Verfügbarkeit " +
        "und senden Sie mir ein Direktangebot.",
        "",
        "Vielen Dank!"
    );
}         

            const whatsappUrl =
                `https://wa.me/${whatsappNumber}` +
                `?text=${encodeURIComponent(
                    messageLines.join("\n")
                )}`;

            showMessage(
    messageElement,
    isEnglish
        ? "According to the calendar, the selected dates are currently available. " +
          "WhatsApp will now open with your prepared request."
        : "Der Zeitraum ist laut Kalender grundsätzlich frei. " +
          "WhatsApp wird nun mit Ihrer vorbereiteten Anfrage geöffnet.",
    "success"
);

            window.open(
                whatsappUrl,
                "_blank",
                "noopener,noreferrer"
            );
        }
    );
}


function validateRequest(
    arrival,
    departure,
    bookedRanges
) {

    if (!arrival || !departure) {
        return isEnglish
        ? "Please select your arrival and departure dates."
        : "Bitte wählen Sie Anreise und Abreise aus.";
}

    if (!meetsAdvanceBookingDeadline(arrival)) {
    return isEnglish
        ? "Arrival must be booked at least 24 hours in advance."
        : "Die Anreise muss mindestens 24 Stunden " +
          "im Voraus gebucht werden.";
}

    const nights =
        differenceInCalendarDays(
            arrival,
            departure
        );

    if (nights < 2) {
        return isEnglish
        ? "The minimum stay is 2 nights. " +
          "Please select a later departure date."
        : "Der Mindestaufenthalt beträgt 2 Nächte. " +
          "Bitte wählen Sie ein späteres Abreisedatum.";
    }

    const overlap =
        bookedRanges.some(range => {

            return (
                arrival < range.endExclusive &&
                departure > range.start
            );
        });

    if (overlap) {
        return isEnglish
        ? "Unfortunately, the selected dates overlap with an existing booking. " +
          "Please choose different dates."
        : "Der gewählte Zeitraum überschneidet sich leider " +
          "mit einer bestehenden Buchung. " +
          "Bitte wählen Sie einen anderen Zeitraum.";
    }

    return "";
}


function meetsAdvanceBookingDeadline(
    arrivalDateKey
) {

    const [
        year,
        month,
        day
    ] = arrivalDateKey
        .split("-")
        .map(Number);

    /*
     * Die geplante Anreise wird mit der Check-in-Zeit
     * um 15:00 Uhr verglichen.
     */
    const arrivalDateTime =
        new Date(
            year,
            month - 1,
            day,
            15,
            0,
            0
        );

    const minimumTime =
        Date.now() + 24 * 60 * 60 * 1000;

    return (
        arrivalDateTime.getTime() >= minimumTime
    );
}


function setEarliestArrival(input) {

    const now =
        new Date();

    for (
        let offset = 0;
        offset < 10;
        offset += 1
    ) {

        const candidate =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + offset,
                15,
                0,
                0
            );

        const atLeast24Hours =
            candidate.getTime() >=
            now.getTime() +
                24 * 60 * 60 * 1000;

        if (atLeast24Hours) {

            input.min =
                toDateKey(candidate);

            return;
        }
    }
}


function differenceInCalendarDays(
    startKey,
    endKey
) {

    const start =
        dateKeyToUtc(startKey);

    const end =
        dateKeyToUtc(endKey);

    return Math.round(
        (end - start) /
        (24 * 60 * 60 * 1000)
    );
}


function addDaysToDateKey(
    dateKey,
    numberOfDays
) {

    const date =
        dateKeyToUtc(dateKey);

    date.setUTCDate(
        date.getUTCDate() + numberOfDays
    );

    return date.toISOString().slice(0, 10);
}


function dateKeyToUtc(dateKey) {

    const [
        year,
        month,
        day
    ] = dateKey
        .split("-")
        .map(Number);

    return new Date(
        Date.UTC(
            year,
            month - 1,
            day
        )
    );
}


function toDateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDateKey(dateKey) {

    const [
        year,
        month,
        day
    ] = dateKey
        .split("-")
        .map(Number);

    const date =
        new Date(
            year,
            month - 1,
            day
        );

    return new Intl.DateTimeFormat(
    isEnglish ? "en-GB" : "de-AT",        {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    ).format(date);
}


function showMessage(
    element,
    text,
    type
) {

    element.textContent = text;

    element.className =
        `booking-form-message ${type}`;
}


function clearMessage(element) {

    element.textContent = "";

    element.className =
        "booking-form-message";
}