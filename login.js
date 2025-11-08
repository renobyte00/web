// === CONFIGURE ===
    // Change this value to the password you want (for demo only).
    const PASSWORD = "09/22/25"; // <- change this
    // Destination page to open when password is correct
    const DESTINATION = "homepage.html"; // put your real site file here

    // Optional: simple attempt limit
    let attemptsLeft = 3;

    const pwInput = document.getElementById("pw");
    const goBtn = document.getElementById("go");
    const msg = document.getElementById("message");

    function deny(text) {
      msg.textContent = text || "Access denied";
      pwInput.value = "";
      pwInput.focus();
    }

    function allow() {
      // small success message then redirect
      msg.style.color = "#0b6b3a";
      msg.textContent = "Access granted — redirecting...";
      // redirect to your protected page
      window.location.href = DESTINATION;
    }

    goBtn.addEventListener("click", function (e) {
      e.preventDefault();
      const v = pwInput.value;
      if (!v) {
        deny("Please enter the access key.");
        return;
      }

      if (v === PASSWORD) {
        allow();
      } else {
        attemptsLeft -= 1;
        if (attemptsLeft <= 0) {
          // disable UI after limit
          msg.style.color = "#cc0000";
          msg.textContent = "Too many failed attempts — access blocked.";
          goBtn.disabled = true;
          pwInput.disabled = true;
        } else {
          msg.style.color = "#cc0000";
          deny(`Access denied — ${attemptsLeft} attempt(s) left.`);
        }
      }
    });

    // allow pressing Enter
    pwInput.addEventListener("keydown", function(e){
      if (e.key === "Enter") goBtn.click();
    });