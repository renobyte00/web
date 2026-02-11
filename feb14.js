document.addEventListener("DOMContentLoaded", () => {
  const heartBtn = document.getElementById("heartBtn");
  const overlay = document.getElementById("overlay");
  const yesBtn = document.getElementById("yesOverlay");
  const noBtn = document.getElementById("noOverlay");
  const successOverlay = document.getElementById("successOverlay");
  const explosion = document.getElementById("explosion");
  let scale = 1;

  function resetButtons() {
    scale = 1;
    yesBtn.style.transform = "scale(1)";
    noBtn.style.left = "";
    noBtn.style.top = "";
  }

  heartBtn.addEventListener("click", () => {
    overlay.classList.add("show");
  });
    heartBtn.addEventListener("click", () => {
    resetButtons(); // reset every time it opens
    overlay.classList.add("show");
  });

  // YES click closes + resets
  yesBtn.addEventListener("click", () => {
    overlay.classList.remove("show");

    successOverlay.classList.add("show");
heartExplosion();
  launchConfetti();
  

    resetButtons();
  });

 
  noBtn.addEventListener('mouseover', ()=> {
    const noBtnreact = noBtn.getBoundingClientRect();
    const maxX = window.innerWidth - noBtnreact.width;
    const maxY = window.innerHeight - noBtnreact.height;

    const randomX= Math.floor(Math.random() * maxX)
    const randomY = Math.floor(Math.random() * maxY)

    noBtn.style.left = randomX + 'px';
    noBtn.style.top = randomY + 'px';
 scale += 0.2;
    yesBtn.style.transform = `scale(${scale})`;
  
  });

  function launchConfetti() {
  confetti({
    particleCount: 200,
    spread: 100,
    origin: { y: 0.6 }
  });
}


function heartExplosion() {
  explosion.innerHTML = "";

  for (let i = 0; i < 90; i++) {
    const heart = document.createElement("span");
    heart.innerHTML = "💖";

    const x = (Math.random() - 0.5) * 1000 + "px";
    const y = (Math.random() - 0.5) * 1000 + "px";

    heart.style.setProperty("--x", x);
    heart.style.setProperty("--y", y);

    explosion.appendChild(heart);
  }
}

 
});