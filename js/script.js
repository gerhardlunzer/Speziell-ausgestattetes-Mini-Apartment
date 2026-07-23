async function init() {

    const daten = await fetch("data.json");

    const data = await daten.json();

    const galerieDatei = await fetch("gallery.json");
    
    const gallery = await galerieDatei.json();
    
    document.getElementById("title").textContent = data.config.title;

document.getElementById("nameText").textContent =
    "Ihr Ansprechpartner: " + data.config.name;

    document.getElementById("addressText").textContent =
        data.config.address;

    document.getElementById("phoneText").textContent =
        data.config.phone;

    document.getElementById("phoneButton").href =
        "tel:" + data.config.phone;

    document.getElementById("bottomPhone").href =
        "tel:" + data.config.phone;

    document.getElementById("whatsappButton").href =
        "https://wa.me/" + data.config.whatsapp;

    document.getElementById("bottomWhatsapp").href =
        "https://wa.me/" + data.config.whatsapp;

    document.getElementById("navigationButton").href =
        data.config.maps;

    document.getElementById("mapsButton").href =
        data.config.maps;

 function galerieErzeugen(containerId, bilder) {

    const container = document.getElementById(containerId);

    bilder.forEach((datei, index) => {

        container.innerHTML += `
<a href="images/${datei}.jpg"
   class="glightbox"
   data-gallery="${containerId}"
   ${index >= 4 ? 'style="display:none"' : ''}>
    <img src="thumbs/${datei}.jpg" loading="lazy">
</a>`;

    });

}

    galerieErzeugen("apartmentGallery", gallery.apartment);
        galerieErzeugen("outsideGallery", gallery.outside);
   
    const lightbox = GLightbox({
    touchNavigation: true,
    loop: true,
    zoomable: true
});

const counter = document.createElement("div");

counter.className = "glightbox-counter";

document.body.appendChild(counter);

lightbox.on("open", () => {

    updateCounter();

});

lightbox.on("slide_changed", () => {

    updateCounter();

});

lightbox.on("close", () => {

    counter.textContent = "";

});

function updateCounter() {

    const current =
        lightbox.getActiveSlideIndex() + 1;

    const total =
        lightbox.getElements().length;

    counter.textContent =
        `${current} / ${total}`;

}

    const calendarEl = document.getElementById("calendar");
    
    const calendar = new FullCalendar.Calendar(calendarEl, {

        initialView: "dayGridMonth",
        locale: "de",
        firstDay: 1,
        height: "auto",

        events: [

            {
                title: "Belegt",
                start: "2026-08-12",
                end: "2026-08-16",
                color: "#d9534f"
            },

            {
                title: "Belegt",
                start: "2026-08-24",
                end: "2026-08-28",
                color: "#d9534f"
            }

        ]

    });
    
    calendar.render();
    
    const toggle = document.querySelector(".calendar-toggle");
    
    const wrapper = document.querySelector(".calendar-wrapper");

    toggle.addEventListener("click", function () {

        wrapper.classList.toggle("open");

        if (wrapper.classList.contains("open")) {

            toggle.innerHTML =
                '<i class="fa-regular fa-calendar"></i> Verfügbarkeit ausblenden';

        } else {

            toggle.innerHTML =
                '<i class="fa-regular fa-calendar"></i> Verfügbarkeit prüfen';

        }

        calendar.updateSize();

    });

}

// Fade-In beim Scrollen
const observer = new IntersectionObserver(entries => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {
            entry.target.classList.add("show");
        }

    });

});

document.querySelectorAll(".fade").forEach(section => {
    observer.observe(section);
});

init().catch(console.error);