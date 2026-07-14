const apartmentFotos = [
    "a01",
    "a02",
    "a03",
    "a04"
];

const outsideFotos = [
    "o01",
    "o02",
    "o03",
    "o04"
];

const apartmentGallery = document.getElementById("apartmentGallery");
const outsideGallery = document.getElementById("outsideGallery");

function galerieErzeugen(container, bilder) {

    bilder.forEach(datei => {

        container.innerHTML += `
<a href="images/${datei}.jpg" class="glightbox">
    <img src="thumbs/${datei}.jpg"
         loading="lazy"
         alt="">
</a>
`;

    });

}

galerieErzeugen(apartmentGallery, apartmentFotos);
galerieErzeugen(outsideGallery, outsideFotos);

GLightbox({
    touchNavigation: true,
    loop: true,
    zoomable: true
});

document.addEventListener("DOMContentLoaded", function () {

    // ===== Kalender =====

    const calendarEl = document.getElementById("calendar");

    const calendar = new FullCalendar.Calendar(calendarEl, {

        initialView: "dayGridMonth",

        locale: "de",

        firstDay: 1,

        height: "auto"

    });

    calendar.render();

    // ===== Kalender auf-/zuklappen =====

    const toggle = document.querySelector(".calendar-toggle");
    const wrapper = document.querySelector(".calendar-wrapper");

    toggle.addEventListener("click", function () {

    wrapper.classList.toggle("open");

    if(wrapper.classList.contains("open")){

        toggle.innerHTML =
        '<i class="fa-regular fa-calendar"></i> Verfügbarkeit ausblenden';

    }else{

        toggle.innerHTML =
        '<i class="fa-regular fa-calendar"></i> Verfügbarkeit prüfen';

    }

    calendar.updateSize();

});

});