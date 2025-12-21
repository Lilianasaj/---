// src/presenter/transaction-presenter.js
export default class TransactionPresenter {
  constructor({model, view, chartPresenter, filterPresenter, budgetModel}) {
    this.model = model;
    this.view = view;
    this.chartPresenter = chartPresenter;
    this.filterPresenter = filterPresenter;
    this.budgetModel = budgetModel;

    this._onModelChange = this._onModelChange.bind(this);
    this._onViewAdd = this._onViewAdd.bind(this);
    this._onViewDelete = this._onViewDelete.bind(this);

    this.model.subscribe(this._onModelChange);
    this.view.bindAdd(this._onViewAdd);
    this.view.bindDelete(this._onViewDelete);
  }

  init() {
    this._render();
  }

  _onModelChange(type, payload) {
    this._render();
    
    // При добавлении транзакции обновляем бюджет
    if (type === 'add' && this.budgetModel && payload.amount < 0) {
      this._updateBudgetOnTransactionAdd(payload);
    }
  }

  _onViewAdd(data) {
    data.amount = Number(data.amount);
    this.model.add(data);
  }

  _onViewDelete(id) {
    const transaction = this.model.getAll().find(t => t.id === id);
    if (transaction && transaction.amount < 0 && this.budgetModel) {
      // Сохраняем информацию о транзакции для обновления бюджета
      this._pendingDeleteTransaction = transaction;
    }
    this.model.remove(id);
  }

  // Обновить бюджет при добавлении расходной транзакции
  _updateBudgetOnTransactionAdd(transaction) {
    if (!this.budgetModel || transaction.amount >= 0) return;
    
    const category = transaction.category || 'Без категории';
    const amount = Math.abs(transaction.amount);
    
    const budgets = this.budgetModel.getAll();
    const budget = budgets.find(b => b.name === category);
    
    if (budget) {
      budget.spent = (budget.spent || 0) + amount;
      this.budgetModel.update(budget.id, { spent: budget.spent });
    } else {
      // Создаем автоматический бюджет
      this.budgetModel.updateOrAdd({
        name: category,
        limit: 0,
        spent: amount,
        isAuto: true
      });
    }
  }

  _render() {
    const all = this.model.getAll();
    const filtered = this.filterPresenter ? this.filterPresenter.apply(all) : all;
    this.view.renderList(filtered);
    if (this.chartPresenter) {
      this.chartPresenter.update(all);
    }
  }
}