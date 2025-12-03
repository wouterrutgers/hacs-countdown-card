const TRANSLATIONS = {
  en: {
    its_almost: "It's almost",
    it_was: "It was",
    months: "months", month: "month",
    days: "days", day: "day",
    hours: "hours", hour: "hour",
    min: "min", sec: "sec", ms: "ms",
  },
  nl: {
    its_almost: "Het is bijna",
    it_was: "Het was",
    months: "maanden", month: "maand",
    days: "dagen", day: "dag",
    hours: "uren", hour: "uur",
    min: "min", sec: "sec", ms: "ms",
  },
};

const STYLES = `
  :host { display: block; }
  
  .countdown-container {
    border-radius: 24px;
    padding: 40px 24px;
    text-align: center;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    overflow: hidden;
    position: relative;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  
  .countdown-container.dark {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  }
  
  .countdown-container.light {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .event-name {
    font-size: 1.2em;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 4px;
    margin-bottom: 8px;
    position: relative;
    z-index: 1;
  }
  
  .event-title {
    font-size: 2.5em;
    font-weight: 700;
    color: #fff;
    margin-bottom: 32px;
    position: relative;
    z-index: 1;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
  
  .past-event .event-title {
    color: #4ecdc4;
  }
  
  .countdown-grid {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
    position: relative;
    z-index: 1;
  }
  
  .countdown-unit {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 20px 16px;
    min-width: 80px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .countdown-unit:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
  
  .countdown-value {
    font-size: 2.5em;
    font-weight: 700;
    color: #fff;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
  
  .countdown-label {
    font-size: 0.7em;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: 8px;
  }
  
  .milliseconds {
    min-width: 60px;
    padding: 16px 12px;
  }
  
  .milliseconds .countdown-value {
    font-size: 1.8em;
    color: rgba(255, 255, 255, 0.8);
  }
  
  @media (max-width: 480px) {
    .countdown-container { padding: 24px 16px; }
    .countdown-unit { min-width: 60px; padding: 14px 10px; }
    .countdown-value { font-size: 1.8em; }
    .event-title { font-size: 1.8em; }
  }
`;

const CONFETTI_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da', '#fcbad3', '#a8d8ea'];
const CONFETTI_COUNT = 40;
const UPDATE_INTERVAL = 37;

class CountdownCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._interval = null;
    this._lang = 'en';
    this._wasPast = null;
    this._confettiTriggered = false;
    this._confettiCanvas = null;
    this._confettiAnimationId = null;
  }

  set hass(hass) {
    if (!hass) return;
    const lang = hass.language?.substring(0, 2) || 'en';
    if (this._lang !== lang) {
      this._lang = TRANSLATIONS[lang] ? lang : 'en';
      if (this._config) {
        this._wasPast = null;
        this._stopConfetti();
        this._confettiTriggered = false;
        this._render();
        this._startCountdown();
      }
    }
  }
  
  _t(key) {
    return TRANSLATIONS[this._lang]?.[key] || TRANSLATIONS.en[key];
  }

  setConfig(config) {
    if (!config.datetime) {
      throw new Error('Please define a datetime');
    }
    this._config = {
      name: config.name || 'Countdown',
      datetime: config.datetime,
      show_seconds: config.show_seconds !== false,
      show_milliseconds: config.show_milliseconds !== false,
      theme: config.theme || 'dark',
    };
    this._render();
    this._startCountdown();
  }

  _render() {
    const { name, theme } = this._config;
    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <div class="countdown-container ${theme}">
        <div class="event-name" id="event-label">${this._t('its_almost')}</div>
        <div class="event-title">${this._escapeHtml(name)}</div>
        <div class="countdown-grid" id="countdown-grid"></div>
      </div>
    `;
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  _startCountdown() {
    if (this._interval) clearInterval(this._interval);
    
    const update = () => {
      const target = new Date(this._config.datetime);
      const now = Date.now();
      let diff = target - now;
      
      const container = this.shadowRoot?.querySelector('.countdown-container');
      const grid = this.shadowRoot?.getElementById('countdown-grid');
      const label = this.shadowRoot?.getElementById('event-label');
      
      if (!container || !grid) return;
      
      const isPast = diff < 0;
      
      if (isPast && this._wasPast !== true) {
        this._wasPast = true;
        container.classList.add('past-event');
        if (label) label.textContent = this._t('it_was');
        if (!this._confettiTriggered) {
          this._confettiTriggered = true;
          this._triggerConfetti();
        }
      } else if (!isPast && this._wasPast !== false) {
        this._wasPast = false;
        container.classList.remove('past-event');
        if (label) label.textContent = this._t('its_almost');
        this._stopConfetti();
        this._confettiTriggered = false;
      }
      
      if (!isPast && diff < 1000 && !this._confettiTriggered) {
        this._confettiTriggered = true;
        this._triggerConfetti();
      }
      
      if (isPast) {
        grid.innerHTML = '';
        return;
      }
      
      const MS_MONTH = 1000 * 60 * 60 * 24 * 30.44;
      const MS_DAY = 1000 * 60 * 60 * 24;
      const MS_HOUR = 1000 * 60 * 60;
      const MS_MIN = 1000 * 60;
      
      const months = Math.floor(diff / MS_MONTH); diff %= MS_MONTH;
      const days = Math.floor(diff / MS_DAY); diff %= MS_DAY;
      const hours = Math.floor(diff / MS_HOUR); diff %= MS_HOUR;
      const minutes = Math.floor(diff / MS_MIN); diff %= MS_MIN;
      const seconds = Math.floor(diff / 1000);
      const ms = Math.floor((diff % 1000) / 10);
      
      let html = '';
      if (months > 0) html += this._unit(months, 'month', months !== 1);
      if (months > 0 || days > 0) html += this._unit(days, 'day', days !== 1);
      if (months > 0 || days > 0 || hours > 0) html += this._unit(hours, 'hour', hours !== 1);
      if (months > 0 || days > 0 || hours > 0 || minutes > 0) html += this._unit(minutes, 'min', false);
      if (this._config.show_seconds && (days > 0 || hours > 0 || minutes > 0 || seconds > 0)) {
        html += this._unit(seconds, 'sec', false);
      }
      if (this._config.show_milliseconds) {
        html += `<div class="countdown-unit milliseconds">
          <div class="countdown-value">${String(ms).padStart(2, '0')}</div>
          <div class="countdown-label">${this._t('ms')}</div>
        </div>`;
      }
      
      grid.innerHTML = html;
    };
    
    update();
    this._interval = setInterval(update, UPDATE_INTERVAL);
  }

  _unit(value, key, plural) {
    return `<div class="countdown-unit">
      <div class="countdown-value">${String(value).padStart(2, '0')}</div>
      <div class="countdown-label">${this._t(plural ? key + 's' : key)}</div>
    </div>`;
  }

  _triggerConfetti() {
    const container = this.shadowRoot?.querySelector('.countdown-container');
    if (!container || this._confettiCanvas) return;
    
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      setTimeout(() => this._triggerConfetti(), 100);
      return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    Object.assign(canvas.style, {
      position: 'absolute', top: '0', left: '0',
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '100'
    });
    container.appendChild(canvas);
    this._confettiCanvas = canvas;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    const pieces = Array.from({ length: CONFETTI_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: (8 + Math.random() * 10) * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      speed: 2 + Math.random() * 3,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.15,
      drift: (Math.random() - 0.5) * 2,
    }));
    
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      for (const p of pieces) {
        p.y += p.speed;
        p.x += p.drift;
        p.angle += p.spin;
        
        if (p.y > height + 50) {
          p.x = Math.random() * width;
          p.y = -20;
          p.speed = 2 + Math.random() * 3;
          p.drift = (Math.random() - 0.5) * 2;
        }
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      
      this._confettiAnimationId = requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  _stopConfetti() {
    if (this._confettiAnimationId) {
      cancelAnimationFrame(this._confettiAnimationId);
      this._confettiAnimationId = null;
    }
    if (this._confettiCanvas) {
      this._confettiCanvas.remove();
      this._confettiCanvas = null;
    }
  }

  disconnectedCallback() {
    if (this._interval) clearInterval(this._interval);
    this._interval = null;
    this._stopConfetti();
  }

  connectedCallback() {
    if (this._config && !this._interval) {
      this._startCountdown();
    }
  }

  getCardSize() { return 4; }
  static getConfigElement() { return document.createElement('countdown-card-editor'); }
  static getStubConfig() { return { name: 'New Year 2026', datetime: '2026-01-01T00:00:00' }; }
}

class CountdownCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this._config = config;
    this._render();
  }

  _render() {
    const { name = '', datetime = '', theme = 'dark' } = this._config;
    this.shadowRoot.innerHTML = `
      <style>
        .editor { padding: 16px; }
        .row { margin-bottom: 16px; }
        label { display: block; margin-bottom: 4px; font-weight: 500; }
        input, select {
          width: 100%; padding: 8px; border-radius: 4px;
          border: 1px solid var(--divider-color);
          background: var(--card-background-color);
          color: var(--primary-text-color);
          box-sizing: border-box;
        }
      </style>
      <div class="editor">
        <div class="row">
          <label>Event Name</label>
          <input type="text" id="name" value="${name}">
        </div>
        <div class="row">
          <label>Target Date & Time</label>
          <input type="datetime-local" id="datetime" value="${datetime}">
        </div>
        <div class="row">
          <label>Theme</label>
          <select id="theme">
            <option value="dark" ${theme === 'dark' ? 'selected' : ''}>Dark</option>
            <option value="light" ${theme === 'light' ? 'selected' : ''}>Light</option>
          </select>
        </div>
      </div>
    `;
    this.shadowRoot.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('change', this._onChange.bind(this));
    });
  }

  _onChange(e) {
    const config = { ...this._config, [e.target.id]: e.target.value };
    this._config = config;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config }, bubbles: true, composed: true
    }));
  }
}

customElements.define('countdown-card', CountdownCard);
customElements.define('countdown-card-editor', CountdownCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'countdown-card',
  name: 'Countdown Card',
  description: 'A beautiful countdown card inspired by itsalmo.st',
  preview: true,
});
