const countdownElement = document.getElementById('countdown');
const countdownContainer = document.getElementById('countdown-container');
const startBtn = document.getElementById('start-btn');
const targetDate = new Date('May 15, 2026 00:00:00').getTime();

const countdownInterval = setInterval(() => {
  const now = new Date().getTime();
  const distance = targetDate - now;
  if(distance < 0){
    clearInterval(countdownInterval);
    countdownElement.innerHTML = "Selamat Ulang Tahun!";
    startBtn.classList.remove('hidden');
  } else {
    const days = Math.floor(distance / (1000*60*60*24));
    const hours = Math.floor((distance % (1000*60*60*24))/(1000*60*60));
    const minutes = Math.floor((distance % (1000*60*60))/(1000*60));
    const seconds = Math.floor((distance % (1000*60))/1000);
    countdownElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
}, 1000);

// tombol lanjut klik
startBtn.addEventListener('click', ()=>{
  countdownContainer.classList.add('hidden');
  document.getElementById('birthday-form').classList.remove('hidden');
  showFormStep(1);
});

// Form interaktif
const form = document.getElementById('birthday-form');
const steps = document.querySelectorAll('.question');
function showFormStep(step){
  steps.forEach(s => s.style.display='none');
  const current = document.querySelector(`.question[data-step="${step}"]`);
  if(current) current.style.display='block';
}

// Next button
const nextBtns = document.querySelectorAll('.next-btn');
nextBtns.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const parent = btn.parentElement;
    const step = parseInt(parent.dataset.step);
    showFormStep(step+1);
  });
});

// Form submit ke Google Sheets
const responseDiv = document.getElementById('form-response');
form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const formData = new FormData(form);
  const data = {}
  formData.forEach((v,k)=> data[k]=v);

  try{
    const res = await fetch('https://script.google.com/macros/s/AKfycbzuZeAtZerIZ3NvHo91bxKNa9LNsP-d-zpDNZ4Oo44NihC2Zgo2RIOLU63HxtEMkhiY/exec', {
      method:'POST',
      body: JSON.stringify(data)
    });
    const result = await res.json();
    responseDiv.innerHTML = "Terima kasih, jawaban Anda telah tersimpan!";
    form.reset();
    form.classList.add('hidden');
    document.getElementById('final-photo-container').classList.remove('hidden');
  } catch(err){
    responseDiv.innerHTML = "Terjadi kesalahan. Coba lagi.";
  }
});
