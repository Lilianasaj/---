export default class BudgetListComponent {
  constructor(container) {
    this.container = (typeof container === 'string') 
      ? document.querySelector(container) 
      : container;
    
    this._card = document.createElement('div');
    this._card.className = 'card';
    this._card.innerHTML = `
      <div class="budget-header">
        <h3>Бюджеты</h3>
    
      </div>
      <div class="budget-total">
        <div class="total-info">
          <span class="total-label">Все расходы</span>
          <span class="total-amount">0 / 0 ₽</span>
        </div>
        <div class="total-bar">
          <div class="total-progress" style="width: 0%"></div>
        </div>
      </div>
      <div class="budgets-grid"></div>
    `;
    
    if (this.container) {
      this.container.appendChild(this._card);
    }
    
    this._grid = this._card.querySelector('.budgets-grid');
    this._totalAmount = this._card.querySelector('.total-amount');
    this._totalProgress = this._card.querySelector('.total-progress');
    this._onAdd = null;
  }

  bindAdd(fn) { this._onAdd = fn; }

  render(budgets) {
    this._grid.innerHTML = '';
    
    // Цвета как в круговой диаграмме
    const colors = [
      '#6c5ce7', '#00b894', '#e84393', '#0984e3', 
      '#fdcb6e', '#00cec9', '#a29bfe', '#fd79a8',
      '#55efc4', '#74b9ff', '#ffeaa7', '#dfe6e9'
    ];

    // Рассчитываем общие суммы
    const totalSpent = budgets.reduce((acc, budget) => acc + budget.spent, 0);
    const totalLimit = budgets.reduce((acc, budget) => acc + budget.limit, 0);
    const totalPercentage = totalLimit > 0 ? Math.min(100, (totalSpent / totalLimit) * 100) : 0;

    // Обновляем общую информацию
    this._totalAmount.textContent = `${this._formatNumber(totalSpent)} / ${this._formatNumber(totalLimit)} ₽`;
    this._totalProgress.style.width = `${totalPercentage}%`;

    // Сортируем бюджеты по убыванию потраченной суммы
    const sortedBudgets = budgets.slice().sort((a, b) => b.spent - a.spent);

    // Создаем элементы бюджетов
    sortedBudgets.forEach((budget, index) => {
      const budgetElement = document.createElement('div');
      budgetElement.className = 'budget-item';
      
      const percentage = budget.limit > 0 ? Math.min(100, (budget.spent / budget.limit) * 100) : 0;
      const color = colors[index % colors.length];
      
      budgetElement.innerHTML = `
        <div class="budget-info">
          <span class="budget-name">${budget.name}</span>
          <span class="budget-amount">${this._formatNumber(budget.spent)} / ${this._formatNumber(budget.limit)} ₽</span>
        </div>
        <div class="budget-bar">
          <div class="budget-progress" style="width: ${percentage}%; background: ${color}"></div>
        </div>
      `;
      
      this._grid.appendChild(budgetElement);
    });

    // Если нет бюджетов, показываем сообщение
    if (budgets.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'budget-empty';
      emptyMessage.textContent = 'Бюджеты не установлены';
      this._grid.appendChild(emptyMessage);
    }
  }

  _formatNumber(number) {
    return new Intl.NumberFormat('ru-RU').format(number);
  }
}