export default class BudgetPresenter {
  constructor({model, view, transactionModel}) { // Добавили transactionModel
    this.model = model;
    this.view = view;
    this.transactionModel = transactionModel; // Сохраняем ссылку

    this._onModelChange = this._onModelChange.bind(this);
    this._onViewAdd = this._onViewAdd.bind(this);

    this.model.subscribe(this._onModelChange);
    if (this.view) this.view.bindAdd(this._onViewAdd);
  }

  init() {
    this.view.render(this.model.getAll());
  }

  _onModelChange() {
    this.view.render(this.model.getAll());
  }

  _onViewAdd(data) {
    data.spent = Number(data.spent || 0);
    data.limit = Number(data.limit || 0);
    
    this.model.updateOrAdd(data);
  }
}