// src/model/budget-model.js
import { ApiService } from '../api.js';

export default class BudgetModel {
  constructor(transactionModel = null) {
    this._budgets = [];
    this._observers = [];
    this._isNotifying = false;
    this._transactionModel = transactionModel;
    this._totalExpensesBudgetName = 'Все расходы';
    this._isUpdatingTotal = false; // Флаг для предотвращения рекурсии
  }

  // Установить ссылку на модель транзакций
  setTransactionModel(transactionModel) {
    this._transactionModel = transactionModel;
  }

  async load() {
    try {
      console.log('BudgetModel: Начинаю быструю загрузку...');
      const budgets = await ApiService.getBudgets();
      
      this._budgets = budgets.map((b, index) => ({
        ...b,
        id: b.id || `b${Date.now()}_${index}`,
        spent: Number(b.spent || 0),
        limit: Number(b.limit || 0)
      }));
      
      console.log('BudgetModel: Загружено бюджетов:', this._budgets.length);
      
      // Проверяем, есть ли уже бюджет "Все расходы"
      const hasTotalBudget = this._budgets.some(b => b.name === this._totalExpensesBudgetName);
      
      if (!hasTotalBudget) {
        // Создаем бюджет "Все расходы" только если его нет
        await this._updateTotalExpensesBudget();
      }
      
      // Обновляем spent из транзакций для других категорий
      if (this._transactionModel) {
        this._updateBudgetsFromTransactions();
      }
      
      this._notify('load', this._budgets);
      
    } catch (error) {
      console.error('BudgetModel: Ошибка загрузки:', error);
      this._budgets = [];
      this._notify('load', []);
    }
  }

  getAll() {
    return this._budgets.slice();
  }

  // НОВЫЙ МЕТОД: Обновление бюджета "Все расходы"
  async _updateTotalExpensesBudget() {
    if (this._isUpdatingTotal) return;
    this._isUpdatingTotal = true;
    
    try {
      let totalExpenses = 0;
      
      if (!this._transactionModel) {
        // Если нет модели транзакций, запрашиваем с сервера
        totalExpenses = await ApiService.calculateTotalExpenses();
      } else {
        // Используем локальные транзакции для расчета
        const transactions = this._transactionModel.getAll();
        totalExpenses = transactions.reduce((total, t) => {
          if (t.amount < 0) {
            return total + Math.abs(t.amount);
          }
          return total;
        }, 0);
      }
      
      await this._updateOrCreateTotalBudget(totalExpenses);
    } catch (error) {
      console.error('BudgetModel: Ошибка обновления бюджета "Все расходы":', error);
    } finally {
      this._isUpdatingTotal = false;
    }
  }

  // НОВЫЙ МЕТОД: Обновление или создание бюджета "Все расходы"
  async _updateOrCreateTotalBudget(totalExpenses) {
    const existingTotalBudget = this._budgets.find(b => b.name === this._totalExpensesBudgetName);
    
    if (existingTotalBudget) {
      // Обновляем существующий бюджет
      existingTotalBudget.spent = totalExpenses;
      
      // Уведомляем об обновлении
      this._notify('update', existingTotalBudget);
      
      // Синхронизируем с сервером
      if (!existingTotalBudget.id.startsWith('local_') && !existingTotalBudget.id.startsWith('auto_')) {
        setTimeout(async () => {
          try {
            await ApiService.updateBudget(existingTotalBudget.id, { spent: totalExpenses });
          } catch (error) {
            console.log('BudgetModel: Не удалось обновить бюджет "Все расходы" на сервере');
          }
        }, 0);
      }
    } else {
      // Создаем новый бюджет "Все расходы" только если его действительно нет
      const totalBudget = {
        id: 'total_expenses_' + Date.now(),
        name: this._totalExpensesBudgetName,
        limit: 0,
        spent: totalExpenses,
        isTotal: true
      };
      
      this._budgets.push(totalBudget);
      this._notify('add', totalBudget);
      
      // Синхронизируем с сервером
      setTimeout(async () => {
        try {
          const saved = await ApiService.addBudget({
            name: totalBudget.name,
            limit: totalBudget.limit,
            spent: totalBudget.spent
          });
          
          if (saved.id) {
            totalBudget.id = saved.id;
            this._notify('update', totalBudget);
          }
        } catch (error) {
          console.warn('BudgetModel: Не удалось синхронизировать бюджет "Все расходы" с сервером');
        }
      }, 0);
    }
    
    console.log('BudgetModel: Бюджет "Все расходы" обновлен:', totalExpenses);
  }

  // Метод для обновления бюджетов на основе транзакций
    _updateBudgetsFromTransactions() {
    if (!this._transactionModel) return;
    
    const transactions = this._transactionModel.getAll();
    
    // Рассчитываем расходы по категориям
    const spentByCategory = transactions.reduce((acc, t) => {
        if (t.amount < 0) { // Только расходы
        const category = t.category || 'Без категории';
        acc[category] = (acc[category] || 0) + Math.abs(t.amount);
        }
        return acc;
    }, {});
    
    // Рассчитываем общие расходы
    const totalExpenses = Object.values(spentByCategory).reduce((sum, amount) => sum + amount, 0);
    
    // Обновляем бюджет "Все расходы" если он есть
    const totalBudget = this._budgets.find(b => b.name === this._totalExpensesBudgetName);
    if (totalBudget) {
        totalBudget.spent = totalExpenses;
        this._notify('update', totalBudget);
    }
    
    // Обновляем существующие бюджеты (кроме "Все расходы")
    this._budgets.forEach(budget => {
        if (budget.name === this._totalExpensesBudgetName) return; // Пропускаем "Все расходы"
        
        const spent = spentByCategory[budget.name] || 0;
        if (budget.spent !== spent) {
        budget.spent = spent;
        this._notify('update', budget);
        }
    });
    
    // Создаем автоматические бюджеты для категорий с расходами
    Object.entries(spentByCategory).forEach(([category, spent]) => {
        if (category === 'Доход' || category === this._totalExpensesBudgetName) return;
        
        const existing = this._budgets.find(b => b.name === category);
        if (!existing && spent > 0) {
        const newBudget = {
            id: 'auto_b_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: category,
            limit: 0, // Автоматический бюджет без лимита
            spent: spent,
            isAuto: true
        };
        
        this._budgets.push(newBudget);
        this._notify('add', newBudget);
        }
    });
    
    // Удаляем пустые автоматические бюджеты
    this._budgets = this._budgets.filter(budget => {
        if (budget.isAuto && budget.spent === 0 && budget.limit === 0 && budget.name !== this._totalExpensesBudgetName) {
        this._notify('remove', budget);
        return false;
        }
        return true;
    });
    }

  async updateOrAdd(budgetData) {
    console.log('BudgetModel: Обновление/добавление бюджета:', budgetData.name);
    
    // Пропускаем автоматическое обновление бюджета "Все расходы"
    if (budgetData.name === this._totalExpensesBudgetName) {
      console.log('BudgetModel: Пропускаю обновление бюджета "Все расходы"');
      return null;
    }
    
    const existing = this._budgets.find(b => b.name === budgetData.name);
    
    if (existing) {
      Object.assign(existing, {
        ...budgetData,
        spent: Number(budgetData.spent || existing.spent),
        limit: Number(budgetData.limit || existing.limit)
      });
      
      this._notify('update', existing);
      
      if (!existing.id.startsWith('local_') && !existing.id.startsWith('auto_')) {
        setTimeout(async () => {
          try {
            await ApiService.updateBudget(existing.id, {
              limit: existing.limit,
              spent: existing.spent
            });
          } catch (error) {
            console.log('BudgetModel: Не удалось обновить на сервере');
          }
        }, 0);
      }
      
      return existing;
    } else {
      const localBudget = { 
        ...budgetData, 
        id: 'local_b_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        spent: Number(budgetData.spent || 0),
        limit: Number(budgetData.limit || 0)
      };
      
      this._budgets.push(localBudget);
      this._notify('add', localBudget);
      
      setTimeout(async () => {
        try {
          const saved = await ApiService.addBudget({
            name: localBudget.name,
            limit: localBudget.limit,
            spent: localBudget.spent
          });
          
          if (saved.id) {
            const index = this._budgets.findIndex(b => b.id === localBudget.id);
            if (index !== -1) {
              this._budgets[index].id = saved.id;
              this._notify('update', this._budgets[index]);
            }
          }
        } catch (error) {
          console.warn('BudgetModel: Не удалось синхронизировать с сервером');
        }
      }, 0);
      
      return localBudget;
    }
  }

  async update(id, patch) {
    const b = this._budgets.find(x => x.id === id);
    if (b) {
      // Проверяем, не пытаемся ли изменить spent у бюджета "Все расходы"
      if (b.name === this._totalExpensesBudgetName && patch.spent !== undefined) {
        console.log('BudgetModel: Пропускаю изменение spent у бюджета "Все расходы"');
        return;
      }
      
      Object.assign(b, patch);
      this._notify('update', b);
      
      if (!id.startsWith('local_') && !id.startsWith('auto_')) {
        setTimeout(async () => {
          try {
            await ApiService.updateBudget(id, patch);
          } catch (error) {
            console.log('BudgetModel: Не удалось обновить на сервере');
          }
        }, 0);
      }
    }
  }

  // Удалить бюджет
  async remove(id) {
    const index = this._budgets.findIndex(b => b.id === id);
    if (index >= 0) {
      const budget = this._budgets[index];
      
      // Не позволяем удалить бюджет "Все расходы"
      if (budget.name === this._totalExpensesBudgetName) {
        console.log('BudgetModel: Нельзя удалить бюджет "Все расходы"');
        return;
      }
      
      const removed = this._budgets.splice(index, 1)[0];
      this._notify('remove', removed);
      
      if (!id.startsWith('local_') && !id.startsWith('auto_')) {
        setTimeout(async () => {
          try {
            await fetch(`${API_BASE_URL}/budgets/${id}`, {
              method: 'DELETE'
            });
          } catch (error) {
            console.log('BudgetModel: Не удалось удалить с сервера');
          }
        }, 0);
      }
    }
  }

  // Обновить бюджет при удалении транзакции
  updateOnTransactionDelete(transaction) {
    if (transaction.amount >= 0) return; // Только для расходов
    
    const category = transaction.category || 'Без категории';
    const amount = Math.abs(transaction.amount);
    
    // Обновляем бюджет для конкретной категории
    const categoryBudget = this._budgets.find(b => b.name === category);
    if (categoryBudget) {
      categoryBudget.spent = Math.max(0, categoryBudget.spent - amount);
      this._notify('update', categoryBudget);
      
      // Синхронизируем с сервером
      if (!categoryBudget.id.startsWith('local_') && !categoryBudget.id.startsWith('auto_')) {
        setTimeout(async () => {
          try {
            await ApiService.updateBudget(categoryBudget.id, { spent: categoryBudget.spent });
          } catch (error) {
            console.log('BudgetModel: Не удалось обновить бюджет на сервере');
          }
        }, 0);
      }
    }
    
    // Обновляем бюджет "Все расходы"
    const totalBudget = this._budgets.find(b => b.name === this._totalExpensesBudgetName);
    if (totalBudget) {
      totalBudget.spent = Math.max(0, totalBudget.spent - amount);
      this._notify('update', totalBudget);
      
      // Синхронизируем с сервером
      if (!totalBudget.id.startsWith('local_') && !totalBudget.id.startsWith('auto_')) {
        setTimeout(async () => {
          try {
            await ApiService.updateBudget(totalBudget.id, { spent: totalBudget.spent });
          } catch (error) {
            console.log('BudgetModel: Не удалось обновить бюджет "Все расходы" на сервере');
          }
        }, 0);
      }
    }
  }

  // Обновить бюджет при добавлении транзакции
  updateOnTransactionAdd(transaction) {
    if (transaction.amount >= 0) return; // Только для расходов
    
    const category = transaction.category || 'Без категории';
    const amount = Math.abs(transaction.amount);
    
    // Обновляем бюджет для конкретной категории
    const categoryBudget = this._budgets.find(b => b.name === category);
    if (categoryBudget) {
      categoryBudget.spent = (categoryBudget.spent || 0) + amount;
      this._notify('update', categoryBudget);
    } else {
      // Создаем автоматический бюджет для новой категории
      this.updateOrAdd({
        name: category,
        limit: 0,
        spent: amount,
        isAuto: true
      });
    }
    
    // Обновляем бюджет "Все расходы"
    const totalBudget = this._budgets.find(b => b.name === this._totalExpensesBudgetName);
    if (totalBudget) {
      totalBudget.spent = (totalBudget.spent || 0) + amount;
      this._notify('update', totalBudget);
    }
  }

  subscribe(fn) {
    this._observers.push(fn);
  }

  _notify(type, payload) {
    if (this._isNotifying) return;
    
    this._isNotifying = true;
    try {
      this._observers.forEach(fn => fn(type, payload));
    } finally {
      this._isNotifying = false;
    }
  }
  
  clear() {
    this._budgets = [];
    this._notify('clear', []);
  }
}