import { ApiService } from '../api.js';

export default class BudgetModel {
  constructor() {
    this._budgets = [];
    this._observers = [];
    this._loadBudgets(); 
  }

  async _loadBudgets() {
    try {
      const budgets = await ApiService.getBudgets();
      this._budgets = budgets;
      this._notify('load', this._budgets);
    } catch (error) {
      console.error('BudgetModel: Ошибка загрузки:', error);
      this._budgets = [
        { id: 'b1', name: 'Еда', limit: 10000, spent: 6000 },
        { id: 'b2', name: 'Образование', limit: 30000, spent: 21000 },
        { id: 'b3', name: 'Автомобиль', limit: 20000, spent: 4000 }
      ];
      this._notify('load', this._budgets);
    }
  }

  getAll() {
    return this._budgets.slice();
  }

  async add(b) { 
    try {
      const savedBudget = await ApiService.addBudget(b);
      this._budgets.push(savedBudget);
      this._notify('add', savedBudget);
      return savedBudget;
    } catch (error) {
      console.error('Ошибка добавления бюджета:', error);
      const nb = { id: 'b' + Date.now(), ...b };
      this._budgets.push(nb);
      this._notify('add', nb);
      return nb;
    }
  }

  async updateOrAdd(budgetData) { 
    try {
      const existingIndex = this._budgets.findIndex(b => b.name === budgetData.name);
      
      if (existingIndex >= 0) {
        const existingSpent = this._budgets[existingIndex].spent || 0;
        const updatedBudget = { 
          ...this._budgets[existingIndex], 
          limit: budgetData.limit,
          spent: existingSpent
        };

        await ApiService.updateBudget(this._budgets[existingIndex].id, { limit: budgetData.limit });
        
        this._budgets[existingIndex] = updatedBudget;
        this._notify('update', updatedBudget);
        return updatedBudget;
      } else {
        return await this.add(budgetData);
      }
    } catch (error) {
      console.error('Ошибка updateOrAdd:', error);
      const existingIndex = this._budgets.findIndex(b => b.name === budgetData.name);
      
      if (existingIndex >= 0) {
        const existingSpent = this._budgets[existingIndex].spent || 0;
        const updatedBudget = { 
          ...this._budgets[existingIndex], 
          limit: budgetData.limit,
          spent: existingSpent
        };
        this._budgets[existingIndex] = updatedBudget;
        this._notify('update', updatedBudget);
        return updatedBudget;
      } else {
        const nb = { id: 'b' + Date.now(), ...budgetData };
        this._budgets.push(nb);
        this._notify('add', nb);
        return nb;
      }
    }
  }

  async update(id, patch) { 
    try {
      await ApiService.updateBudget(id, patch);
      const b = this._budgets.find(x => x.id === id);
      if (b) {
        Object.assign(b, patch);
        this._notify('update', b);
      }
    } catch (error) {
      console.error('Ошибка обновления бюджета:', error);
      const b = this._budgets.find(x => x.id === id);
      if (b) {
        Object.assign(b, patch);
        this._notify('update', b);
      }
    }
  }

  subscribe(fn) {
    this._observers.push(fn);
  }

  _notify(type, payload) {
    this._observers.forEach(fn => fn(type, payload));
  }
}