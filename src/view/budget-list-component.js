// src/view/budget-list-component.js
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
        <span class="budget-pro">PRO</span>
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
    
    const uniqueBudgets = [];
    const seenIds = new Set();
    const seenNames = new Set();
    
    budgets.forEach(budget => {
      if (budget.name === 'Все расходы') {
        return;
      }
      
      if (budget.id && seenIds.has(budget.id)) {
        return;
      }
      
      if (seenNames.has(budget.name)) {
        return;
      }
      
      seenIds.add(budget.id);
      seenNames.add(budget.name);
      uniqueBudgets.push(budget);
    });
      
    const colors = [
      '#6c5ce7', '#00b894', '#e84393', '#0984e3', 
      '#fdcb6e', '#00cec9', '#a29bfe', '#fd79a8',
      '#55efc4', '#74b9ff', '#ffeaa7', '#dfe6e9'
    ];

    const activeBudgets = uniqueBudgets.filter(budget => budget.spent > 0 || budget.limit > 0);
    const totalExpensesBudget = budgets.find(b => b.name === 'Все расходы');
    
    let totalSpent = 0;
    let totalLimit = 0;
    
    if (totalExpensesBudget) {
      totalSpent = totalExpensesBudget.spent || 0;
      totalLimit = totalExpensesBudget.limit || 0;
    } else {
      totalSpent = activeBudgets.reduce((acc, budget) => acc + (budget.spent || 0), 0);
      totalLimit = activeBudgets
        .filter(b => b.limit > 0)
        .reduce((acc, budget) => acc + budget.limit, 0);
    }
    
    const totalPercentage = totalLimit > 0 ? Math.min(100, (totalSpent / totalLimit) * 100) : 0;
    
    this._totalAmount.textContent = `${this._formatNumber(totalSpent)} / ${totalLimit > 0 ? this._formatNumber(totalLimit) + ' ₽' : 'Без лимита'}`;
    this._totalProgress.style.width = `${totalPercentage}%`;
    
    if (activeBudgets.length > 0) {
      const sortedBudgets = [...activeBudgets].sort((a, b) => b.spent - a.spent);
      
      const finalBudgets = [];
      const finalNames = new Set();
      
      sortedBudgets.forEach(budget => {
        if (!finalNames.has(budget.name)) {
          finalNames.add(budget.name);
          finalBudgets.push(budget);
        }
      });
      
      finalBudgets.forEach((budget, index) => {
        const color = colors[index % colors.length];
        
        const budgetElement = this._createBudgetElement(budget, color);
        this._grid.appendChild(budgetElement);
      });
    } else {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'budget-empty';
      emptyMessage.innerHTML = `
        <p>Бюджеты не установлены</p>
        <p class="empty-hint">Добавьте расходы чтобы автоматически создать бюджеты</p>
      `;
      this._grid.appendChild(emptyMessage);
    }
  }

  _createBudgetElement(budget, color) {
    const budgetElement = document.createElement('div');
    budgetElement.className = 'budget-item';
    
    let limitText;
    let limitClass = '';
    
    if (budget.limit === 0) {
      limitText = 'Без лимита';
      limitClass = 'no-limit';
    } else {
      limitText = `${this._formatNumber(budget.limit)} ₽`;
    }
    
    const percentage = budget.limit > 0 ? Math.min(100, (budget.spent / budget.limit) * 100) : 0;
    
    let progressBarStyle = `width: ${percentage}%; background: ${color}`;
    if (budget.limit === 0 && budget.spent > 0) {
      const visualPercentage = Math.min(50, (budget.spent / 10000) * 100);
      progressBarStyle = `width: ${visualPercentage}%; background: ${color}; opacity: 0.7`;
    }
    
    budgetElement.innerHTML = `
      <div class="budget-info">
        <span class="budget-name">
          ${budget.name}
          ${budget.isAuto ? '<span class="auto-badge">АВТО</span>' : ''}
        </span>
        <span class="budget-amount ${limitClass}">
          ${this._formatNumber(budget.spent)} / ${limitText}
        </span>
      </div>
      <div class="budget-bar">
        <div class="budget-progress" style="${progressBarStyle}"></div>
      </div>
    `;
    
    return budgetElement;
  }

  _formatNumber(number) {
    return new Intl.NumberFormat('ru-RU').format(number);
  }
}