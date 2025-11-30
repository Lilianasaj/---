export default class ChartDynamicsComponent {
  constructor(container) {
    // Если container - строка, ищем элемент, иначе используем как есть
    this.container = (typeof container === 'string') 
      ? document.querySelector(container) 
      : container;
    
    if (!this.container) {
      console.error('ChartDynamicsComponent: container not found');
      return;
    }
    
    this._root = document.createElement('div');
    this._root.className = 'card dynamic';
    this._root.innerHTML = `<h3>Динамика</h3><div class="graph"><svg viewBox="0 0 100 60" preserveAspectRatio="none"></svg></div>`;
    this.container.appendChild(this._root);
    this._svg = this._root.querySelector('svg');
  }

  render(points) {
    // points: [{date, value}, ...] — упорядочены по дате
    this._svg.innerHTML = '';
    if (!points || points.length === 0) {
      this._svg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#999">Нет данных</text>`;
      return;
    }

    const max = Math.max(...points.map(p=>Math.abs(p.value))) || 1;
    // построим нормализованные точки
    const stepX = 100 / Math.max(1, points.length - 1);
    const coords = points.map((p, i) => {
      const x = i * stepX;
      // нормализация: середина (30..50..)
      const y = 55 - ( (p.value / max) * 40 );
      return `${x},${y}`;
    });

    // оси
    this._svg.innerHTML += `<line x1="0" y1="55" x2="100" y2="55" stroke="#ccc" stroke-width="0.8" />
                            <polyline points="${coords.join(' ')}" fill="none" stroke="#6c5ce7" stroke-width="1.5"/>`;
  }
}