// Простой фильтр по месяцу/дню
export default class FilterPresenter {
  constructor({view}) {
    this.view = view;
    this._filter = {month: null, day: null};
    this.view.bindChange(this._onViewChange.bind(this));
  }

  _onViewChange(filter) {
    this._filter = filter;
    // уведомление ведётся через презентера транзакций — он спросит filterPresenter.apply()
    // Здесь ничего не делаем дополнительно.
  }

  apply(transactions) {
    let res = transactions.slice();
    if (this._filter.month) {
      res = res.filter(t => {
        const m = new Date(t.date).getMonth() + 1;
        return String(m) === String(this._filter.month);
      });
    }
    if (this._filter.day) {
      res = res.filter(t => {
        const d = new Date(t.date).getDate();
        return String(d) === String(this._filter.day);
      });
    }
    return res;
  }
}
