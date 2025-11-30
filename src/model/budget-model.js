export default class BudgetModel {
  constructor(initial = []) {
    this._budgets = Array.from(initial);
    this._observers = [];
  }

  getAll() {
    return this._budgets.slice();
  }

  add(b) {
    const nb = { id: 'b' + Date.now(), ...b };
    this._budgets.push(nb);
    this._notify('add', nb);
    return nb;
  }

  // Новый метод: обновляет существующий бюджет или добавляет новый
  updateOrAdd(budgetData) {
    const existingIndex = this._budgets.findIndex(b => b.name === budgetData.name);
    
    if (existingIndex >= 0) {
      // Сохраняем существующую потраченную сумму при обновлении лимита
      const existingSpent = this._budgets[existingIndex].spent || 0;
      const updatedBudget = { 
        ...this._budgets[existingIndex], 
        limit: budgetData.limit,
        spent: existingSpent // Сохраняем потраченную сумму
      };
      this._budgets[existingIndex] = updatedBudget;
      this._notify('update', updatedBudget);
      return updatedBudget;
    } else {
      // Добавляем новый бюджет
      return this.add(budgetData);
    }
  }

  update(id, patch) {
    const b = this._budgets.find(x => x.id === id);
    if (b) {
      Object.assign(b, patch);
      this._notify('update', b);
    }
  }

  subscribe(fn) {
    this._observers.push(fn);
  }

  _notify(type, payload) {
    this._observers.forEach(fn => fn(type, payload));
  }
}