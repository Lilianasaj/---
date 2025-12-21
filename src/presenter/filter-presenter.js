// src/presenter/filter-presenter.js
export default class FilterPresenter {
  constructor({view}) {
    this.view = view;
    this._filter = { month: null, day: null };
    
    console.log('FilterPresenter: инициализация');
    
    // Подписываемся на изменения в представлении
    this.view.bindChange(this._onViewChange.bind(this));
  }

  _onViewChange(filter) {
    console.log('FilterPresenter: получены новые значения фильтра', filter);
    
    // Обновляем внутреннее состояние
    this._filter = filter;
    
    // Уведомляем о изменении фильтра (если есть подписчики)
    if (this._onFilterChange) {
      this._onFilterChange(this._filter);
    }
  }

  // Метод для применения фильтра к данным
  apply(transactions) {
    if (!transactions || !Array.isArray(transactions)) {
      console.log('FilterPresenter: нет данных для фильтрации');
      return [];
    }

    console.log('FilterPresenter: применение фильтра', this._filter);
    console.log('FilterPresenter: всего транзакций до фильтрации', transactions.length);
    
    let filtered = [...transactions];
    
    // Фильтрация по месяцу
    if (this._filter.month) {
      const targetMonth = parseInt(this._filter.month);
      console.log('FilterPresenter: фильтрация по месяцу', targetMonth);
      
      filtered = filtered.filter(transaction => {
        try {
          // Парсим дату из транзакции
          const transactionDate = new Date(transaction.date);
          if (isNaN(transactionDate.getTime())) {
            console.warn('FilterPresenter: некорректная дата у транзакции', transaction);
            return false;
          }
          
          // Получаем месяц (1-12)
          const transactionMonth = transactionDate.getMonth() + 1;
          return transactionMonth === targetMonth;
        } catch (error) {
          console.error('FilterPresenter: ошибка при обработке даты', error, transaction);
          return false;
        }
      });
      
      console.log('FilterPresenter: после фильтрации по месяцу осталось', filtered.length);
    }
    
    // Фильтрация по дню (работает только если выбран месяц)
    if (this._filter.day && this._filter.month) {
      const targetDay = parseInt(this._filter.day);
      console.log('FilterPresenter: фильтрация по дню', targetDay);
      
      filtered = filtered.filter(transaction => {
        try {
          const transactionDate = new Date(transaction.date);
          if (isNaN(transactionDate.getTime())) {
            return false;
          }
          
          const transactionDay = transactionDate.getDate();
          return transactionDay === targetDay;
        } catch (error) {
          console.error('FilterPresenter: ошибка при обработке дня', error, transaction);
          return false;
        }
      });
      
      console.log('FilterPresenter: после фильтрации по дню осталось', filtered.length);
    }
    
    console.log('FilterPresenter: возвращаю отфильтрованные данные', filtered.length);
    return filtered;
  }

  // Метод для получения текущего фильтра
  getFilter() {
    return { ...this._filter };
  }

  // Метод для сброса фильтра
  reset() {
    this._filter = { month: null, day: null };
    console.log('FilterPresenter: фильтр сброшен');
  }

  // Метод для подписки на изменения фильтра
  subscribe(fn) {
    this._onFilterChange = fn;
  }
}