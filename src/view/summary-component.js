export default class SummaryComponent {
  constructor(container) {
    // Принимаем DOM-элемент напрямую
    this.container = container;
    
    if (!this.container) {
      console.error('SummaryComponent: container is null or undefined');
      return;
    }
    
    this._root = document.createElement('div');
    this._root.className = 'card';
    this._root.innerHTML = `<h3>Итог</h3><div class="summary-body"></div>`;
    this.container.appendChild(this._root);
    
    this._body = this._root.querySelector('.summary-body');
  }

  render(transactions) {
    if (!this._body) {
      console.error('SummaryComponent: body element not found');
      return;
    }
    
    const total = transactions.reduce((acc, t) => acc + Number(t.amount), 0);
    const incomes = transactions.filter(t => t.amount > 0).reduce((a,b)=>a+b.amount,0);
    const expenses = transactions.filter(t => t.amount < 0).reduce((a,b)=>a+b.amount,0);
    
    this._body.innerHTML = `<p>Баланс: <strong>${total}₽</strong></p>
                            <p>Доходы: <strong>${incomes}₽</strong></p>
                            <p>Расходы: <strong>${Math.abs(expenses)}₽</strong></p>`;
  }
}