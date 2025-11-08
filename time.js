// Start date in Philippine Time (UTC+8)
const startDate = new Date("2025-09-22T19:12:00+08:00");

function updateTimer() {
    const now = new Date();
    let diff = now - startDate; // difference in milliseconds

    if(diff < 0) diff = 0; // if current time is before start date

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById("timer").textContent =
        `${days} days 🍓, ${hours} hours 🍵, ${minutes} minutes ☕, ${seconds} seconds 👾`;
}

// update every second
setInterval(updateTimer, 1000);

// initial call
updateTimer();