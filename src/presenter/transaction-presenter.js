// Отвечает за связи Model <-> View для операций
export default class TransactionPresenter {
  constructor({model, view, chartPresenter, filterPresenter}) {
    this.model = model;
    this.view = view;
    this.chartPresenter = chartPresenter;
    this.filterPresenter = filterPresenter;

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

  _onModelChange(type /*, payload */) {
    this._render();
  }

  _onViewAdd(data) {
    // data: {date, desc, category, amount}
    // убедимся, что amount — число
    data.amount = Number(data.amount);
    this.model.add(data);
  }

  _onViewDelete(id) {
    this.model.remove(id);
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
