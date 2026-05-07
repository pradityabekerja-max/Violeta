console.log("script loaded");

// Wrap initialization to ensure DOM is ready and make code defensive
function initBirthdayApp() {
  // Elements
  const countdownContainer = document.getElementById("countdown-container");
  const countdownElement = document.getElementById("countdown");
  const form = document.getElementById("birthday-form");
  const steps = Array.from(document.querySelectorAll(".question"));
  const responseDiv = document.getElementById("form-response");
  const finalContainer = document.getElementById("final-photo-container");
  const bgMusic = document.getElementById("bg-music");
  const nextBtnEl = document.getElementById("next-btn");
  const prevBtnEl = document.getElementById("prev-btn");
  const submitBtnEl = document.getElementById("submit-btn");
  const devStart = document.getElementById("dev-start");

  if (!countdownContainer || !countdownElement) {
    console.warn("Countdown elements missing — aborting init");
    return;
  }

  // Read target date from data attribute (fallback to now)
  const targetAttr =
    countdownContainer.dataset && countdownContainer.dataset.target;
  const targetDate = targetAttr ? new Date(targetAttr) : new Date();

  // Countdown logic
  function updateCountdown() {
    const now = new Date();
    const diff = targetDate - now;
    if (isNaN(diff)) {
      countdownElement.textContent = "Tanggal tidak valid";
      return;
    }

    if (diff <= 0) {
      clearInterval(countdownInterval);
      countdownElement.textContent = "Selamat Ulang Tahun!";
      // reveal the form
      showForm();
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    countdownElement.textContent = `${days}d ${hours}j ${minutes}m ${seconds}s`;
  }

  const countdownInterval = setInterval(updateCountdown, 1000);
  updateCountdown();

  // Dev override: show form immediately if URL contains ?dev=1 or running on localhost
  try {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get("dev") === "1" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1"
    ) {
      clearInterval(countdownInterval);
      showForm();
    }
  } catch (e) {
    /* ignore when not in browser environment */
  }

  // Show form (and set accessibility attributes)
  function showForm() {
    if (countdownContainer) countdownContainer.classList.add("hidden");
    if (form) {
      form.classList.remove("hidden");
      form.setAttribute("aria-hidden", "false");
    }
    // show first step and update nav state
    currentStep = 1;
    renderStep();
  }

  // Step display
  function showFormStep(step) {
    // Deprecated: controlled via renderStep()
  }

  // State for current step
  let currentStep = 1;

  function renderStep() {
    steps.forEach((s) => {
      const stepNum = Number(s.dataset.step);
      const isCurrent = stepNum === currentStep;
      s.style.display = isCurrent ? "" : "none";
      s.setAttribute("aria-hidden", isCurrent ? "false" : "true");
      if (isCurrent) {
        const focusable = s.querySelector(
          "input, textarea, button, select, label",
        );
        if (focusable) focusable.focus();
      }
    });
    // update nav buttons visibility (defensive)
    if (prevBtnEl) prevBtnEl.classList.toggle("hidden", currentStep === 1);
    if (submitBtnEl && nextBtnEl) {
      if (currentStep === steps.length) {
        nextBtnEl.classList.add("hidden");
        submitBtnEl.classList.remove("hidden");
      } else {
        nextBtnEl.classList.remove("hidden");
        submitBtnEl.classList.add("hidden");
      }
    }
  }

  // Simple validation per step
  function validateStep(step) {
    const s = document.querySelector(`.question[data-step="${step}"]`);
    if (!s) return true;
    const radios = s.querySelectorAll('input[type="radio"]');
    if (radios.length) {
      return Array.from(radios).some((r) => r.checked);
    }
    const textarea = s.querySelector("textarea");
    if (textarea) {
      return textarea.value.trim().length > 0;
    }
    return true;
  }

  // Next buttons
  // Next / Prev handlers wired to the single controls in the new markup
  // Next / Prev handlers wired to the single controls in the new markup
  if (nextBtnEl) {
    nextBtnEl.addEventListener("click", () => {
      if (!validateStep(currentStep)) {
        if (responseDiv)
          responseDiv.textContent = "Mohon isi jawaban sebelum melanjutkan.";
        return;
      }
      if (responseDiv) responseDiv.textContent = "";
      currentStep = Math.min(steps.length, currentStep + 1);
      renderStep();
    });
  }

  if (prevBtnEl) {
    prevBtnEl.addEventListener("click", () => {
      currentStep = Math.max(1, currentStep - 1);
      renderStep();
    });
  }

  // Dev start button (expose the quiz immediately during testing)
  if (devStart) {
    devStart.addEventListener("click", () => {
      clearInterval(countdownInterval);
      showForm();
    });
  }

  // Autoplay resume on first user gesture (some browsers block autoplay)
  function tryPlayMusic() {
    if (!bgMusic) return;
    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        /* autoplay blocked; we'll try on user gesture */
      });
    }
  }

  // Try to play when user first interacts
  ["click", "keydown", "touchstart"].forEach((ev) => {
    window.addEventListener(ev, function once() {
      tryPlayMusic();
      window.removeEventListener(ev, once);
    });
  });

  // Form submission
  if (form) {
    // decide whether to use a mock submission (useful for localhost/testing)
    const urlParams = new URLSearchParams(window.location.search);
    const isLocal =
      location.hostname === "localhost" || location.hostname === "127.0.0.1";
    const useMock = urlParams.get("mock") === "1";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      // final validation: ensure last step filled
      const lastStep = steps.length;
      if (!validateStep(lastStep)) {
        if (responseDiv)
          responseDiv.textContent =
            "Mohon isi jawaban terakhir sebelum mengirim.";
        return;
      }

      const formData = new FormData(form);
      const data = {};
      formData.forEach((v, k) => (data[k] = v));

      if (responseDiv) responseDiv.textContent = "Mengirim...";

      // If mock mode is active, simulate a network request
      if (useMock) {
        console.info("Using mock submission (dev mode)");
        await new Promise((r) => setTimeout(r, 700));
        if (responseDiv)
          responseDiv.textContent =
            "Terima kasih (mock): jawaban disimpan (dev).";
        form.reset();
        form.classList.add("hidden");
        form.setAttribute("aria-hidden", "true");
        if (finalContainer) finalContainer.classList.remove("hidden");
        if (finalContainer && finalContainer.focus) finalContainer.focus();
        return;
      }

      // Real submission path
      try {
        console.log("DATA YANG DIKIRIM:", data);

        const res = await fetch(
          "https://script.google.com/macros/s/AKfycbya3xoyYVRsvPe4xKWJ9htCnsl2EE9bh3VYbhCUW73DDs_Ek7hxO-_zG6up4Mq8SNm9/exec",
          {
            method: "POST",
            body: new URLSearchParams(data),
          },
        );

        console.log("STATUS:", res.status);

        // If the response is not OK, surface status and body for debugging
        if (!res.ok) {
          let bodyText = "";
          try {
            bodyText = await res.text();
          } catch (e) {
            bodyText = "<unable to read response body>";
          }
          const msg = `Gagal mengirim: ${res.status} ${res.statusText}. ${bodyText}`;
          console.error(msg);
          if (responseDiv)
            responseDiv.textContent = `Gagal mengirim: ${res.status} ${res.statusText}. Cek console.`;
          return;
        }

        // Success
        let resultText = "";
        try {
          resultText = await res.text();
        } catch (e) {}
        if (responseDiv)
          responseDiv.textContent =
            "Terima kasih, jawaban Anda telah tersimpan!";
        form.reset();
        form.classList.add("hidden");
        form.setAttribute("aria-hidden", "true");
        if (finalContainer) finalContainer.classList.remove("hidden");
        if (finalContainer && finalContainer.focus) finalContainer.focus();
      } catch (err) {
        // Network-level failure (CORS, DNS, offline, etc.)
        console.error("Network error while submitting form:", err);
        if (responseDiv)
          responseDiv.innerHTML = `Terjadi kesalahan jaringan saat mengirim: ${err.message}.<br>Kamu bisa: <strong>1)</strong> jalankan dengan ?mock=1 atau di localhost untuk mengetes, atau <strong>2)</strong> periksa koneksi/CORS endpoint.`;

        // If running locally, fallback to mock success to allow testing without changing URL
        if (isLocal) {
          console.info(
            "Falling back to mock submission because we are on localhost",
          );
          await new Promise((r) => setTimeout(r, 500));
          if (responseDiv)
            responseDiv.textContent =
              "Terima kasih (fallback mock): jawaban disimpan (dev).";
          form.reset();
          form.classList.add("hidden");
          form.setAttribute("aria-hidden", "true");
          if (finalContainer) finalContainer.classList.remove("hidden");
          if (finalContainer && finalContainer.focus) finalContainer.focus();
        }
      }
    });
  }

  // Ensure initial render state (form hidden by default)
  renderStep();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBirthdayApp);
} else {
  initBirthdayApp();
}
