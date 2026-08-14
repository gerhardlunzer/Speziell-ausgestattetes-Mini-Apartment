async function init() {

    const daten = await fetch("data.json");

    const data = await daten.json();

    const galerieDatei = await fetch("gallery.json");
    
    const gallery = await galerieDatei.json();
    
const isEnglish = document.documentElement.lang === "en";

document.getElementById("title").textContent =
    isEnglish
        ? "Specially Equipped Mini Apartment"
        : data.config.title;

document.getElementById("nameText").textContent =
    (isEnglish ? "Your host: " : "Ihr Ansprechpartner: ") + data.config.name;

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

    bilder.forEach((bild, index) => {

        container.innerHTML += `
            <a
                href="images/${bild.image}.jpg"
                class="glightbox"
                data-gallery="${containerId}"
                ${index >= 4 ? 'style="display:none"' : ''}
            >
                <img
                    src="thumbs/${containerId === 'apartmentGallery' ? 'a' : 'o'}${String(index + 1).padStart(2, '0')}.jpg"
                    alt="${isEnglish && bild.alt_en ? bild.alt_en : bild.alt}"
                    loading="lazy"
                >
            </a>
        `;

    });

}

    galerieErzeugen("apartmentGallery", gallery.apartment);
    galerieErzeugen("outsideGallery", gallery.outside);
   
    const lightbox = GLightbox({
    touchNavigation: true,
    loop: true,
    zoomable: true
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

const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}