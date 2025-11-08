const slides = [
  { img: "newyork.jpg", label: "NEW YORK" },
  { img: "spain.webp", label: "SPAIN" },
  { img: "switzerland.jpg", label: "SWITZERLAND" },
  { img: "japan.jpg", label: "JAPAN" },
  { img: "italy.webp", label: "ITALY" },
  { img: "BALI.jpeg", label: "BALI" },
  { img: "download.jfif", label: "MALDIVES" },
  { img: "china.webp", label: "CHINA" },
  { img: "greenland.jpeg", label: "GREENLAND" },
  { img: "caption.jpg", label: "ICELAND" },
  { img: "images.jfif", label: "ANTARTICA" },
];

let currentSlide = 0;

function updateSlide() {
  const codeSlide = document.getElementById('code-slide');
  codeSlide.innerHTML = `
    <img 
      src="${slides[currentSlide].img}"
      alt="Code screenshot ${currentSlide + 1}"
      class="slideshow-img"
    >
    <div class="code-label">${slides[currentSlide].label}</div>
  `;
  document.getElementById('slide-indicator').textContent =
    `Slide ${currentSlide + 1} / ${slides.length}`;
  document.getElementById('prev-btn').disabled = currentSlide === 0;
  document.getElementById('next-btn').disabled = currentSlide === slides.length - 1;
}

document.getElementById('prev-btn').onclick = function() {
  if (currentSlide > 0) { currentSlide--; updateSlide(); }
};
document.getElementById('next-btn').onclick = function() {
  if (currentSlide < slides.length - 1) { currentSlide++; updateSlide(); }
};

updateSlide();