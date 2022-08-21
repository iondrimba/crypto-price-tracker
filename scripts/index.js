const productNames = {
  'btc-usdt': 'Bitcoin',
};

const currency = document.querySelector('.currency-title');
const high24h = document.querySelector('.high24h');
const low24h = document.querySelector('.low24h');
const price = document.querySelector('.last');
const change = document.querySelector('.change24h');
const volume = document.querySelector('.vol24h');

const btnProducts = [...document.querySelectorAll('[data-product]')];
const btnTheme = [...document.querySelectorAll('[data-theme]')];
const state = {
  timer: null,
  delay: 5000,
  data: [],
  theme: 'light',
  product: 'btc-usd',
  load: function () {
    this.theme = localStorage.getItem('theme') || this.theme;
    this.product = localStorage.getItem('product') || this.product;
  }
};

function changeTheme(theme) {
  document.body.classList = [];
  document.body.classList.add(theme);

  localStorage.setItem('theme', theme);
}

function selectButton(buttons, button) {
  buttons.map((btn) => {
    btn.classList.remove('active');
  });

  button.classList.add('active');
}

function setTitle(product) {
  currency.textContent = `${productNames[product.toLowerCase()]} price`;
}

function formatToDecimal(value, minimumFractionDigits = 2) {
  return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits }).format(value);
}

function setLastPrice(value) {
  price.textContent = formatToDecimal(value);

  window.document.title = `${price.textContent} Crypto Price Tracker`;
}

function setHigh(value) {
  high24h.textContent = formatToDecimal(value);
}

function setLow(value) {
  low24h.textContent = formatToDecimal(value);
}

function setPriceVariation(value) {
  let formatted = formatToDecimal(value, 3);

  change.classList.remove('negative');
  change.classList.remove('positive');

  if (value > 0) {
    change.classList.add('positive');
    formatted = `+${formatted}`;
  }

  if (value < 0) {
    change.classList.add('negative');
  }

  change.textContent = formatted;
}

function setVolume(value) {
  volume.textContent = formatToDecimal(value, 3);
}

function btnThemeClick({ currentTarget }) {
  const theme = currentTarget.dataset.theme;

  changeTheme(theme);
}

function btnProductClick({ currentTarget }) {
  const product = currentTarget.dataset.product;

  selectButton(btnProducts, currentTarget);
  changeProduct(product, state.data);
  clearTimeout(state.timer);
  timer();
}

function updateOnlineStatus() {
  const condition = navigator.onLine ? 'online' : 'offline';
}

window.addEventListener('load', function () {
  const socket = new WebSocket('wss://ws.okx.com:8443/ws/v5/public');

  socket.addEventListener('open', function () {
    const payload = {
      op: 'subscribe',
      args: [
        {
          channel: 'tickers',
          instId: 'BTC-USDT'
        }
      ]
    };

    socket.send(JSON.stringify(payload));

    selectButton(btnProducts, document.querySelector(`[data-product=${state.product.toLocaleLowerCase()}]`));

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    btnTheme.map((btn) => btn.addEventListener('click', btnThemeClick));
    btnProducts.map((btn) => btn.addEventListener('click', btnProductClick));
  });

  socket.addEventListener('message', function (event) {
    const { arg, data } = JSON.parse(event.data);

    if (arg.channel === 'tickers' && data) {
      setTitle(arg.instId);
      setPriceVariation(((data[0].last - data[0].open24h) / data[0].open24h) * 100);
      setLastPrice(data[0].last);
      setHigh(data[0].high24h);
      setLow(data[0].low24h);
      setVolume(data[0].vol24h);
    }
  });

  state.load();

  changeTheme(state.theme);
});
