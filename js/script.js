document.addEventListener("DOMContentLoaded", function () {
  // Initialize elements
  const rsvpModal = new bootstrap.Modal(document.getElementById("rsvpModal"));
  const confirmationToast = new bootstrap.Toast(
    document.getElementById("confirmationToast")
  );
  const rsvpForm = document.getElementById("weddingRsvpForm");
  const guestCountSelect = document.getElementById("guestCount");
  const additionalGuestsContainer = document.getElementById(
    "additionalGuestsContainer"
  );
  const formSteps = document.querySelectorAll(".form-step");
  const progressBar = document.getElementById("formProgress");
  const progressText = document.querySelector(".progress-text");

  // Counters
  const daysCounter = document.getElementById("days-counter");
  const confirmedCounter = document.getElementById("confirmed-counter");
  const declinedCounter = document.getElementById("declined-counter");

  // Open RSVP modal
  document.querySelectorAll('[id^="openRsvpBtn"]').forEach((btn) => {
    btn.addEventListener("click", function () {
      loadFormData(); // Load saved data if exists
      rsvpModal.show();
    });
  });

  // Set wedding date countdown
  const weddingDate = new Date("September 20, 2025 13:00:00").getTime();
  updateCountdown();
  setInterval(updateCountdown, 86400000); // Update daily

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = weddingDate - now;
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    daysCounter.textContent = days >= 0 ? days : 0;
  }

  // Form navigation
  document.querySelectorAll(".btn-next").forEach((btn) => {
    btn.addEventListener("click", function () {
      const nextStep = this.getAttribute("data-next");
      if (validateStep(parseInt(this.closest(".form-step").dataset.step))) {
        showStep(nextStep);
      }
    });
  });

  document.querySelectorAll(".btn-prev").forEach((btn) => {
    btn.addEventListener("click", function () {
      const prevStep = this.getAttribute("data-prev");
      showStep(prevStep);
    });
  });

  function showStep(stepNumber) {
    // Hide all steps
    formSteps.forEach((step) => {
      step.classList.remove("active");
      step.style.display = "none";
    });

    // Show current step
    const currentStep = document.querySelector(
      `.form-step[data-step="${stepNumber}"]`
    );
    currentStep.classList.add("active");
    currentStep.style.display = "block";

    // Update progress
    const progressPercent = (stepNumber / 4) * 100;
    progressBar.style.width = `${progressPercent}%`;
    progressText.textContent = `Step ${stepNumber} of 4`;

    // Save form data at each step
    saveFormData();
  }

  function validateStep(stepNumber) {
    let isValid = true;
    const currentStep = document.querySelector(
      `.form-step[data-step="${stepNumber}"]`
    );

    // Step 1 validation
    if (stepNumber === 1) {
      const firstName = document.getElementById("firstName");
      const lastName = document.getElementById("lastName");
      const email = document.getElementById("email");

      if (!firstName.value.trim()) {
        firstName.classList.add("is-invalid");
        isValid = false;
      } else {
        firstName.classList.remove("is-invalid");
      }

      if (!lastName.value.trim()) {
        lastName.classList.add("is-invalid");
        isValid = false;
      } else {
        lastName.classList.remove("is-invalid");
      }

      if (!email.value.trim() || !/^\S+@\S+\.\S+$/.test(email.value)) {
        email.classList.add("is-invalid");
        isValid = false;
      } else {
        email.classList.remove("is-invalid");
      }
    }

    // Step 2 validation
    if (stepNumber === 2) {
      const attendanceSelected = document.querySelector(
        'input[name="attendance"]:checked'
      );
      const feedback = document.querySelector(".attendance-feedback");

      if (!attendanceSelected) {
        feedback.style.display = "block";
        isValid = false;
      } else {
        feedback.style.display = "none";

        // Toggle guest details based on selection
        const guestDetailsSection = document.getElementById("guestDetails");
        if (attendanceSelected.value === "no") {
          guestDetailsSection.style.display = "none";
          guestDetailsSection
            .querySelector("select")
            .removeAttribute("required");
        } else {
          guestDetailsSection.style.display = "block";
          guestDetailsSection
            .querySelector("select")
            .setAttribute("required", "");
        }
      }
    }

    // Step 3 validation
    if (
      stepNumber === 3 &&
      document.querySelector('input[name="attendance"]:checked')?.value ===
        "yes"
    ) {
      if (!guestCountSelect.value) {
        guestCountSelect.classList.add("is-invalid");
        isValid = false;
      } else {
        guestCountSelect.classList.remove("is-invalid");
      }
    }

    return isValid;
  }

  // Dynamic guest fields
  guestCountSelect.addEventListener("change", function () {
    const guestCount = parseInt(this.value);
    additionalGuestsContainer.innerHTML = "";

    if (guestCount > 1) {
      for (let i = 1; i < guestCount; i++) {
        const guestDiv = document.createElement("div");
        guestDiv.className = "mb-3 animate__animated animate__fadeIn";
        guestDiv.style.animationDelay = `${i * 0.1}s`;
        guestDiv.innerHTML = `
                <label for="guest${i}" class="form-label">Guest ${i} Full Name*</label>
                <input type="text" class="form-control" id="guest${i}" name="guest_${i}" required>
                <div class="invalid-feedback">Please provide guest name</div>
              `;
        additionalGuestsContainer.appendChild(guestDiv);
      }
    }

    saveFormData();
  });

  // Form submission
  rsvpForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (validateStep(4)) {
      // Create FormData from form
      const formData = new FormData(rsvpForm);

      // For debugging - log form data
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      try {
        // Submit to Formspree
        const response = await fetch("https://formspree.io/f/mgvyeqka", {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        });

        if (response.ok) {
          // Show success message
          showConfirmation({
            firstName: formData.get("firstName"),
            attendance: formData.get("attendance"),
            guestCount: formData.get("guestCount"),
          });

          // Reset form
          rsvpForm.reset();
          localStorage.removeItem("weddingRsvpData");
          rsvpModal.hide();
        } else {
          throw new Error("Form submission failed");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Submission failed. Please try again.");
      }
    }
  });

  // Save form data to localStorage
  function saveFormData() {
    const formData = {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      email: document.getElementById("email").value,
      attendance: document.querySelector('input[name="attendance"]:checked')
        ?.value,
      guestCount: document.getElementById("guestCount").value,
      dietaryRequirements: document.getElementById("dietaryRequirements").value,
      songRequest: document.getElementById("songRequest").value,
      message: document.getElementById("message").value,
    };

    // Save additional guests
    if (formData.guestCount > 1) {
      formData.additionalGuests = [];
      for (let i = 1; i < formData.guestCount; i++) {
        const guestName = document.getElementById(`guest${i}`)?.value;
        if (guestName) {
          formData.additionalGuests.push(guestName);
        }
      }
    }

    localStorage.setItem("weddingRsvpData", JSON.stringify(formData));
  }

  // Load saved form data
  function loadFormData() {
    const savedData = localStorage.getItem("weddingRsvpData");
    if (savedData) {
      const formData = JSON.parse(savedData);

      // Fill basic fields
      document.getElementById("firstName").value = formData.firstName || "";
      document.getElementById("lastName").value = formData.lastName || "";
      document.getElementById("email").value = formData.email || "";

      if (formData.attendance) {
        document.getElementById(
          `attending${formData.attendance === "yes" ? "Yes" : "No"}`
        ).checked = true;
      }

      if (formData.guestCount) {
        document.getElementById("guestCount").value = formData.guestCount;
        const event = new Event("change");
        document.getElementById("guestCount").dispatchEvent(event);

        // Fill additional guests after fields are created
        setTimeout(() => {
          if (formData.additionalGuests) {
            formData.additionalGuests.forEach((guest, index) => {
              const guestField = document.getElementById(`guest${index + 1}`);
              if (guestField) {
                guestField.value = guest;
              }
            });
          }
        }, 0);
      }

      document.getElementById("dietaryRequirements").value =
        formData.dietaryRequirements || "";
      document.getElementById("songRequest").value = formData.songRequest || "";
      document.getElementById("message").value = formData.message || "";
    }
  }

  // Show confirmation with details
  function showConfirmation(data) {
    const toastDetails = document.getElementById("toastDetails");
    let detailsText = "";

    if (data.attendance === "yes") {
      detailsText = `We're excited to see ${
        data.guestCount > 1 ? "your party of " + data.guestCount : "you"
      }!`;
      if (data.songRequest) {
        detailsText += ` We'll add "${data.songRequest}" to our playlist!`;
      }
    } else {
      detailsText =
        "We'll miss you at the wedding! Thank you for letting us know.";
    }

    toastDetails.textContent = detailsText;
    confirmationToast.show();
  }

  // Initialize form
  showStep(1);
});

// Add to your script.js
function createPetals() {
  const petalCount = 15;
  for (let i = 0; i < petalCount; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal';
    petal.innerHTML = '🌸';
    petal.style.left = Math.random() * 100 + 'vw';
    petal.style.animationDuration = 5 + Math.random() * 10 + 's';
    petal.style.animationDelay = Math.random() * 5 + 's';
    document.body.appendChild(petal);
  }
}

window.addEventListener("load", () => {
  const petalContainer = document.createElement("div");
  petalContainer.className = "petal-container";
  document.body.appendChild(petalContainer);

  // Create 15 petals
  for (let i = 0; i < 15; i++) {
    const petal = document.createElement("div");
    petal.className = "petal";
    petal.innerHTML = "🌸";
    petal.style.left = Math.random() * 100 + "vw";
    petal.style.animationDelay = Math.random() * 2 + "s";
    petalContainer.appendChild(petal);
  }

  // Remove after animation
  setTimeout(() => {
    petalContainer.remove();
  }, 10000);
});