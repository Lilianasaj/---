export default class ChartPieComponent {
  constructor(container) {
    this.container = (typeof container === 'string') 
      ? document.querySelector(container) 
      : container;
    
    if (!this.container) {
      console.error('ChartPieComponent: container not found');
      return;
    }
    
    this._root = document.createElement('div');
    this._root.className = 'card categories';
    this._root.innerHTML = `
      <h3>Категории</h3>
      <div class="chart-type-switch">
        <button type="button" class="type-btn expenses-btn active" data-type="expenses">Расходы</button>
        <button type="button" class="type-btn incomes-btn" data-type="incomes">Доходы</button>
      </div>
      <div class="chart-container">
        <div class="pie-chart-wrapper">
          <svg viewBox="0 0 100 100" class="pie-chart">
            <!-- Секции будут добавляться динамически -->
          </svg>
        </div>
        <ul class="categories-legend"></ul>
      </div>
    `;
    this.container.appendChild(this._root);
    this._svg = this._root.querySelector('.pie-chart');
    this._legend = this._root.querySelector('.categories-legend');
    
    this._currentType = 'expenses'; // По умолчанию показываем расходы
    this._dataByCategory = {};
    
    // Обработчики переключателя
    this._setupSwitchHandlers();
  }

  _setupSwitchHandlers() {
    const expensesBtn = this._root.querySelector('.expenses-btn');
    const incomesBtn = this._root.querySelector('.incomes-btn');
    
    expensesBtn.addEventListener('click', () => this._setChartType('expenses'));
    incomesBtn.addEventListener('click', () => this._setChartType('incomes'));
  }

  _setChartType(type) {
    this._currentType = type;
    
    const expensesBtn = this._root.querySelector('.expenses-btn');
    const incomesBtn = this._root.querySelector('.incomes-btn');
    
    // Обновляем активную кнопку
    if (type === 'expenses') {
      expensesBtn.classList.add('active');
      incomesBtn.classList.remove('active');
    } else {
      incomesBtn.classList.add('active');
      expensesBtn.classList.remove('active');
    }
    
    // Перерисовываем диаграмму
    this._renderCurrentType();
  }

  render(dataByCategory) {
    // Сохраняем данные для перерисовки при переключении
    this._dataByCategory = dataByCategory;
    this._renderCurrentType();
  }

  _renderCurrentType() {
    // Фильтруем данные в зависимости от выбранного типа
    let filteredData = {};
    
    if (this._currentType === 'expenses') {
      // Только расходы (отрицательные значения)
      Object.entries(this._dataByCategory).forEach(([category, sum]) => {
        if (sum < 0) {
          filteredData[category] = Math.abs(sum);
        }
      });
    } else {
      // Только доходы (положительные значения)
      Object.entries(this._dataByCategory).forEach(([category, sum]) => {
        if (sum > 0) {
          filteredData[category] = sum;
        }
      });
    }

    this._renderPieChart(filteredData);
  }

  _renderPieChart(dataByCategory) {
    // Фильтруем только категории с ненулевыми суммами
    const entries = Object.entries(dataByCategory)
      .filter(([_, sum]) => Math.abs(sum) > 0)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

    // Очищаем предыдущие элементы
    this._svg.innerHTML = '';
    this._legend.innerHTML = '';

    if (entries.length === 0) {
      this._svg.innerHTML = `
        <circle cx="50" cy="50" r="45" fill="#f8f9fa" stroke="#e9ecef" stroke-width="2"/>
        <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" fill="#999" font-size="8">
          Нет данных
        </text>
      `;
      
      // Добавляем сообщение в легенду
      const noDataItem = document.createElement('li');
      noDataItem.className = 'legend-item no-data';
      noDataItem.innerHTML = `
        <span class="legend-name">Нет ${this._currentType === 'expenses' ? 'расходов' : 'доходов'}</span>
      `;
      this._legend.appendChild(noDataItem);
      return;
    }

    // Цвета для категорий
    const colors = [
      '#6c5ce7', '#00b894', '#e84393', '#0984e3', 
      '#fdcb6e', '#00cec9', '#a29bfe', '#fd79a8',
      '#55efc4', '#74b9ff', '#ffeaa7', '#dfe6e9'
    ];

    // Рассчитываем общую сумму
    const total = entries.reduce((acc, [_, sum]) => acc + sum, 0);

    let currentAngle = 0;

    // Создаем секции диаграммы
    entries.forEach(([category, sum], index) => {
      const percentage = (sum / total) * 100;

      if (percentage === 0) return;

      const angle = (percentage / 100) * 360;
      const largeArcFlag = angle > 180 ? 1 : 0;

      // Координаты для сектора
      const x1 = 50 + 45 * Math.cos(currentAngle * Math.PI / 180);
      const y1 = 50 + 45 * Math.sin(currentAngle * Math.PI / 180);
      const x2 = 50 + 45 * Math.cos((currentAngle + angle) * Math.PI / 180);
      const y2 = 50 + 45 * Math.sin((currentAngle + angle) * Math.PI / 180);

      const pathData = [
        `M 50 50`,
        `L ${x1} ${y1}`,
        `A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `Z`
      ].join(' ');

      // Создаем сектор
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('fill', colors[index % colors.length]);
      path.setAttribute('stroke', '#fff');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('class', `pie-slice ${this._currentType}`);
      path.setAttribute('data-category', category);
      
      this._svg.appendChild(path);

      // Добавляем элемент в легенду
      const legendItem = document.createElement('li');
      legendItem.className = 'legend-item';
      legendItem.innerHTML = `
        <span class="legend-color" style="background: ${colors[index % colors.length]}"></span>
        <span class="legend-name">${category}</span>
        <span class="legend-amount ${this._currentType}">
          ${sum}₽
        </span>
      `;
      this._legend.appendChild(legendItem);

      currentAngle += angle;
    });

    // Добавляем центральный круг для красоты
    const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerCircle.setAttribute('cx', '50');
    centerCircle.setAttribute('cy', '50');
    centerCircle.setAttribute('r', '20');
    centerCircle.setAttribute('fill', '#fff');
    this._svg.appendChild(centerCircle);

    // Добавляем общую сумму в центр
    const totalText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    totalText.setAttribute('x', '50');
    totalText.setAttribute('y', '50');
    totalText.setAttribute('text-anchor', 'middle');
    totalText.setAttribute('dominant-baseline', 'middle');
    totalText.setAttribute('fill', this._currentType === 'expenses' ? '#e84393' : '#00b894');
    totalText.setAttribute('font-size', '6');
    totalText.setAttribute('font-weight', 'bold');
    totalText.textContent = `${total}₽`;
    this._svg.appendChild(totalText);
  }
}