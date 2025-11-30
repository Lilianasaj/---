export default class HeaderComponent {
  constructor(container) {
    this.container = container;
  }

  render() {
    const el = document.createElement('div');
    el.className = 'logo';
    el.textContent = 'Spendly';
    const header = document.querySelector(this.container);
    header.appendChild(el);
  }
}
