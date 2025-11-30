// Простой абстрактный компонент для управления DOM элементом
export default class AbstractComponent {
  constructor() {
    this._element = null;
  }

  getElement() {
    if (!this._element) {
      this._element = this.render();
    }
    return this._element;
  }

  removeElement() {
    this._element = null;
  }

  // Переопределять в наследнике
  render() {
    throw new Error('You must implement render() in component');
  }
}
