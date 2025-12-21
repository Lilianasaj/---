export default class BudgetItemComponent {
  constructor(budget) { this.budget = budget; }
  render() {
    const d = document.createElement('div');
    d.className = 'budget-item';
    d.innerHTML = `<span>${this.budget.name}</span>
                   <div class="bar"><i style="width:${this.budget.percent || 0}%"></i></div>
                   <div class="amount">${this.budget.limit}₽</div>`;
    return d;
  }
}