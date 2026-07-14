const version = "1.0";

document.getElementById("statusVersion").textContent = version;
document.getElementById("statusCalendar").textContent = "Bereit";
document.getElementById("statusGallery").textContent = "Bereit";
document.getElementById("statusSync").textContent = "Noch keine Synchronisierung";

document.getElementById("calendar").addEventListener("click", () => {

    alert("Hier wird später der Airbnb-Kalender synchronisiert.");

});

document.getElementById("gallery").addEventListener("click", () => {

    alert("Hier wird später die Galerie verwaltet.");

});

document.getElementById("settings").addEventListener("click", () => {

    alert("Hier erscheinen später die Einstellungen.");

});

document.getElementById("status").addEventListener("click", () => {

    document.querySelector(".status-box").scrollIntoView({

        behavior: "smooth"

    });

});