/* ═══════════════════════════════════════════════
   ARCOSULL — MAIN.JS v5
   3-slide carousel, FAQ, Charts, Form
   ═══════════════════════════════════════════════ */

/* ─── CARROSSEL 3-SLIDE (estado por classe) ─── */
let currentSlide = 0;
const totalSlides = 5;
let carouselInterval = null;

/**
 * Retorna o nome da classe de estado para cada slide
 * com base na distância do slide ativo.
 *   diff=0  → centro (active)
 *   diff=1  → direita próxima (next)
 *   diff=-1 → esquerda próxima (prev)
 *   diff=2  → escondido à direita
 *   diff=-2 → escondido à esquerda
 */
function getSlideState(slideIndex) {
  const diff = ((slideIndex - currentSlide) + totalSlides) % totalSlides;
  if (diff === 0) return 'state-active';
  if (diff === 1) return 'state-next';
  if (diff === totalSlides - 1) return 'state-prev';
  if (diff === 2) return 'state-hidden-right';
  return 'state-hidden-left';
}

function updateCarousel() {
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  const slides = track.querySelectorAll('.carousel-slide');
  const stateClasses = ['state-active', 'state-prev', 'state-next', 'state-hidden-left', 'state-hidden-right'];

  slides.forEach((slide, i) => {
    stateClasses.forEach(c => slide.classList.remove(c));
    slide.classList.add(getSlideState(i));
  });

  // Atualiza os dots
  document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

function goToSlide(index) {
  currentSlide = ((index % totalSlides) + totalSlides) % totalSlides;
  updateCarousel();
}

function startAutoPlay() {
  carouselInterval = setInterval(() => goToSlide(currentSlide + 1), 4500);
}

function stopAutoPlay() {
  if (carouselInterval) clearInterval(carouselInterval);
}

document.addEventListener('DOMContentLoaded', () => {
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');

  if (prevBtn) prevBtn.addEventListener('click', () => {
    stopAutoPlay();
    goToSlide(currentSlide - 1);
    startAutoPlay();
  });

  if (nextBtn) nextBtn.addEventListener('click', () => {
    stopAutoPlay();
    goToSlide(currentSlide + 1);
    startAutoPlay();
  });

  document.querySelectorAll('.carousel-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      stopAutoPlay();
      goToSlide(parseInt(dot.dataset.index));
      startAutoPlay();
    });
  });

  // Inicia estado e autoplay
  updateCarousel();
  startAutoPlay();
  updateSim(40000);
});

/* Swipe para mobile */
let touchStartX = 0;
document.addEventListener('DOMContentLoaded', () => {
  const vp = document.querySelector('.carousel-viewport');
  if (!vp) return;
  vp.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  vp.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      stopAutoPlay();
      diff > 0 ? goToSlide(currentSlide + 1) : goToSlide(currentSlide - 1);
      startAutoPlay();
    }
  }, { passive: true });
});

/* ─── MODAL SIMULAÇÃO ─── */
let _modalPlan = {};

function openSimModal(plano, credito, parcela) {
  _modalPlan = { plano, credito, parcela };
  const tag = document.getElementById('simModalPlanTag');
  if (tag) {
    tag.innerHTML =
      `<strong>${plano}</strong><br>` +
      `💰 Crédito: <strong>${credito}</strong> &nbsp;|&nbsp; ` +
      `💳 Parcela estimada: <strong>${parcela}/mês</strong>`;
  }
  document.getElementById('simModalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSimModal() {
  document.getElementById('simModalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('simModalOverlay')) closeSimModal();
}

function submitSimModal(e) {
  e.preventDefault();
  const btn      = e.target.querySelector('.btn-modal-enviar');
  const btnText  = btn.querySelector('.btn-enviar-text');
  const btnLoad  = btn.querySelector('.btn-enviar-loading');

  btnText.style.display = 'none';
  btnLoad.style.display = 'inline-flex';
  btn.disabled = true;

  const nome  = document.getElementById('modal-nome').value.trim();
  const email = document.getElementById('modal-email').value.trim();
  const tel   = document.getElementById('modal-telefone').value.trim();
  const cep   = document.getElementById('modal-cep').value.trim();

  const msg = encodeURIComponent(
    `Olá! Tenho interesse em um consórcio Arcosull.\n\n` +
    `*Dados da simulação*\n` +
    `Plano: ${_modalPlan.plano}\n` +
    `Crédito: ${_modalPlan.credito}\n` +
    `Parcela estimada: ${_modalPlan.parcela}/mês\n\n` +
    `*Dados do cliente*\n` +
    `Nome: ${nome}\n` +
    `E-mail: ${email}\n` +
    `Telefone: ${tel}\n` +
    `CEP: ${cep}`
  );

  setTimeout(() => {
    window.open(`https://wa.me/554598066693?text=${msg}`, '_blank');
    btnText.textContent = '✓ Enviado!';
    btnText.style.display = 'inline-flex';
    btnLoad.style.display = 'none';
    setTimeout(() => {
      closeSimModal();
      e.target.reset();
      btnText.textContent = 'Enviar Dados';
      btn.disabled = false;
    }, 1800);
  }, 900);
}

/* ─── Fechar modal com ESC ─── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSimModal();
});

/* ─── FAQ ACCORDION ─── */
function toggleFaq(btn) {
  const item = btn.parentElement;
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(faq => faq.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

/* ─── CHART.JS ─── */
let simChart = null;
let chartMouseleaveAdded = false;

function createChart(creditValue, prazo = 72) {
  const ctx = document.getElementById('simChart');
  if (!ctx) return;

  // Remove pontos do hover ao sair do gráfico
  if (!chartMouseleaveAdded) {
    ctx.addEventListener('mouseleave', () => {
      if (simChart) {
        simChart.tooltip.hide();
        simChart.setActiveElements([]);
        simChart.update('none');
      }
    });
    chartMouseleaveAdded = true;
  }

  const months = prazo;
  const labels = [];
  const creditData = [];
  const parcelasData = [];
  const valorizacaoData = [];
  const taxaAdmin = 0.15;

  for (let i = 0; i <= months; i += 3) {
    labels.push(i === 0 ? 'Início' : `${i}m`);
    const t = i / months;
    const sCurve = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    creditData.push(Math.round(creditValue * sCurve));
    parcelasData.push(Math.round(creditValue * (1 + taxaAdmin) * Math.pow(t, 0.85)));
    const base = creditValue * (1 + 0.06 * (i / 12));
    const wave = Math.sin(i * 0.15) * creditValue * 0.02;
    valorizacaoData.push(Math.round((base * sCurve) + wave));
  }

  if (simChart) {
    simChart.data.labels = labels;
    simChart.data.datasets[0].data = creditData;
    simChart.data.datasets[1].data = parcelasData;
    simChart.data.datasets[2].data = valorizacaoData;
    simChart.update('none');
    return;
  }

  const chartCtx = ctx.getContext('2d');
  const blueGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
  blueGrad.addColorStop(0, 'rgba(59,130,246,0.2)'); blueGrad.addColorStop(1, 'rgba(59,130,246,0)');
  const greenGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
  greenGrad.addColorStop(0, 'rgba(16,185,129,0.15)'); greenGrad.addColorStop(1, 'rgba(16,185,129,0)');
  const purpleGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
  purpleGrad.addColorStop(0, 'rgba(139,92,246,0.15)'); purpleGrad.addColorStop(1, 'rgba(139,92,246,0)');

  simChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Crédito acumulado', data: creditData, borderColor: '#3b82f6', backgroundColor: blueGrad, fill: true, tension: 0.45, borderWidth: 3, pointRadius: 0, pointHoverRadius: 7, pointHoverBackgroundColor: '#3b82f6', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 3 },
        { label: 'Parcelas pagas', data: parcelasData, borderColor: '#10b981', backgroundColor: greenGrad, fill: true, tension: 0.45, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: '#10b981', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 3 },
        { label: 'Valorização', data: valorizacaoData, borderColor: '#8b5cf6', backgroundColor: purpleGrad, fill: true, tension: 0.45, borderWidth: 2, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: '#8b5cf6', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 800, easing: 'easeInOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,37,64,0.95)', titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.85)',
          padding: 16, cornerRadius: 12,
          titleFont: { size: 13, weight: '700', family: 'Inter' },
          bodyFont: { size: 12, family: 'Inter' },
          displayColors: true, boxWidth: 10, boxHeight: 10, boxPadding: 6, usePointStyle: true,
          callbacks: { label: c => '  ' + c.dataset.label + ':  R$ ' + c.parsed.y.toLocaleString('pt-BR') }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,0.03)', drawBorder: false }, ticks: { color: '#9ca3af', font: { size: 10, weight: '600', family: 'Inter' }, maxTicksLimit: 8 } },
        y: {
          grid: { color: 'rgba(0,0,0,0.03)', drawBorder: false },
          ticks: {
            color: '#9ca3af', font: { size: 10, weight: '600', family: 'Inter' },
            callback: v => v >= 1000000 ? 'R$ ' + (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? 'R$ ' + (v / 1000).toFixed(0) + 'k' : 'R$ ' + v,
            maxTicksLimit: 6
          },
          beginAtZero: true
        }
      }
    }
  });
}

/* ─── SIMULADOR ─── */
let simMode = 'credito';
let _simCreditValue = 40000;

// Dados reais das tabelas de parcelas Porto (com redução 20% padrão até contemplação)
const catConfig = {
  'Veículos': { min: 25000, max: 200000, step: 1000, default: 40000, labelMin: 'R$ 25 mil', labelMax: 'R$ 200 mil' },
  'Imóveis':  { min: 70000, max: 1000000, step: 5000, default: 200000, labelMin: 'R$ 70 mil', labelMax: 'R$ 1 M' },
  'Pesados':  { min: 180000, max: 360000, step: 5000, default: 250000, labelMin: 'R$ 180 mil', labelMax: 'R$ 360 mil' },
};

function getSimPlan(n, categoria) {
  if (categoria.includes('Imóvel') || categoria.includes('Imovel')) {
    if (n <= 140000) return { prazo: 200, taxa: 0.25 };
    if (n <= 280000) return { prazo: 200, taxa: 0.23 };
    if (n <= 560000) return { prazo: 200, taxa: 0.21 };
    return { prazo: 200, taxa: 0.195 };
  }
  if (categoria.includes('Pesado')) {
    return { prazo: 120, taxa: 0.16 };
  }
  // Veículos
  if (n < 34000)  return { prazo: 50, taxa: 0.20 };
  if (n <= 65000) return { prazo: 72, taxa: 0.20 };
  if (n <= 125000) return { prazo: 80, taxa: 0.18 };
  return { prazo: 90, taxa: 0.17 };
}

function updateSim(val) {
  const n = parseInt(val);
  const range = document.getElementById('sim-range');
  const min = parseInt(range.min), max = parseInt(range.max);
  const pct = ((n - min) / (max - min)) * 100;
  range.style.background = `linear-gradient(to right, #3b82f6 0%, #1d4ed8 ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`;

  const categoria = document.querySelector('.cat-btn.active')?.textContent?.trim() || 'Veículos';

  if (simMode === 'parcela') {
    document.getElementById('sim-num').textContent = n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    // Inverso: crédito ≈ parcela / 0.80 * 72 / 1.20 (base Veículos 72m)
    const credito = Math.round((n / 0.80) * 72 / 1.20);
    _simCreditValue = credito;
    document.getElementById('stat-parcela').textContent = 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('stat-prazo').textContent = '72 meses';
    document.getElementById('stat-taxa').textContent = '20% total';
    createChart(credito, 72);
  } else {
    document.getElementById('sim-num').textContent = n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    _simCreditValue = n;
    const plan = getSimPlan(n, categoria);
    // Parcela com redução de 20% padrão (valor pago até a contemplação)
    const parcelaCheia = n * (1 + plan.taxa) / plan.prazo;
    const parcelaReducao = parcelaCheia * 0.80;
    document.getElementById('stat-parcela').textContent = 'R$ ' + parcelaReducao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('stat-prazo').textContent = plan.prazo + ' meses';
    document.getElementById('stat-taxa').textContent = (plan.taxa * 100).toFixed(1) + '% total';
    createChart(n, plan.prazo);
  }
}

function simularAgora() {
  const btn = document.querySelector('.btn-simular');
  btn.style.transform = 'scale(0.95)';
  setTimeout(() => { btn.style.transform = ''; }, 200);

  const categoria = document.querySelector('.cat-btn.active')?.textContent?.trim() || 'Veículos';
  const prazo     = document.getElementById('stat-prazo')?.textContent?.trim() || '';
  const parcela   = document.getElementById('stat-parcela')?.textContent?.trim() || '';
  const credito   = 'R$ ' + _simCreditValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ',00';

  openSimModal(`${categoria} — ${prazo}`, credito, parcela);
}

function setTab(el, mode) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  simMode = mode;
  const labelEl = document.getElementById('sim-label-text');
  const range = document.getElementById('sim-range');
  if (mode === 'parcela') {
    labelEl.textContent = 'Escolha o valor da parcela:';
    range.min = 200; range.max = 5000; range.step = 50; range.value = 500;
    document.querySelector('.sim-range-labels').innerHTML = '<span>R$ 200</span><span>R$ 5.000</span>';
    updateSim(500);
  } else {
    const cat = document.querySelector('.cat-btn.active')?.textContent?.trim() || 'Veículos';
    const cfg = catConfig[cat] || catConfig['Veículos'];
    labelEl.textContent = 'Escolha o valor do crédito:';
    range.min = cfg.min; range.max = cfg.max; range.step = cfg.step; range.value = cfg.default;
    document.querySelector('.sim-range-labels').innerHTML = `<span>${cfg.labelMin}</span><span>${cfg.labelMax}</span>`;
    updateSim(cfg.default);
  }
}

function setCat(el) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  if (simMode === 'credito') {
    const cat = el.textContent.trim();
    const cfg = catConfig[cat] || catConfig['Veículos'];
    const range = document.getElementById('sim-range');
    range.min = cfg.min; range.max = cfg.max; range.step = cfg.step; range.value = cfg.default;
    document.querySelector('.sim-range-labels').innerHTML = `<span>${cfg.labelMin}</span><span>${cfg.labelMax}</span>`;
    updateSim(cfg.default);
  }
}

/* ─── FORMULÁRIO ─── */
function maskPhone(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
  else if (v.length > 0) v = `(${v}`;
  input.value = v;
}

function maskCep(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length > 8) v = v.slice(0, 8);
  if (v.length > 5) v = `${v.slice(0, 5)}-${v.slice(5)}`;
  input.value = v;
}

function handleFormSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-enviar');
  const btnText = btn.querySelector('.btn-enviar-text');
  const btnLoading = btn.querySelector('.btn-enviar-loading');
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline-flex';
  btn.disabled = true;
  setTimeout(() => {
    btnText.textContent = '✓ Dados Enviados!';
    btnText.style.display = 'inline'; btnLoading.style.display = 'none';
    btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    setTimeout(() => {
      btnText.textContent = 'Enviar Dados';
      btn.style.background = ''; btn.disabled = false;
      e.target.reset();
    }, 3000);
  }, 1500);
}

/* ─── NAV ─── */
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 50) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); document.getElementById('navLinks').classList.remove('open'); }
  });
});

/* ─── SCROLL REVEAL ─── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0)'; }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.section-header, .sim-container, .contato-container, .bene-grid, .faq-list, .carousel-3').forEach(el => {
  el.style.opacity = '0'; el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
  revealObserver.observe(el);
});
