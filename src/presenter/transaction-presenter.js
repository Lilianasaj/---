// src/presenter/transaction-presenter.js
export default class TransactionPresenter {
  constructor({model, view, chartPresenter, filterPresenter}) {
    this.model = model;
    this.view = view;
    this.chartPresenter = chartPresenter;
    this.filterPresenter = filterPresenter;

    // Привязка контекста
    this._onModelChange = this._onModelChange.bind(this);
    this._onViewAdd = this._onViewAdd.bind(this);
    this._onViewDelete = this._onViewDelete.bind(this);
    
    // Подписка на изменения в модели
    this.model.subscribe(this._onModelChange);
    
    // Подписка на события представления
    this.view.bindAdd(this._onViewAdd);
    this.view.bindDelete(this._onViewDelete);
    
    // Подписка на изменения фильтра
    if (this.filterPresenter) {
      this.filterPresenter.subscribe(() => {
        console.log('TransactionPresenter: получено изменение фильтра');
        this._render();
      });
    }
    
    console.log('TransactionPresenter: инициализирован с фильтром', !!filterPresenter);
  }

  init() {
    console.log('TransactionPresenter: инициализация');
    this._render();
  }

  _onModelChange(type, payload) {
    console.log('TransactionPresenter: изменение в модели', type);
    
    // Обновляем представление при любых изменениях данных
    this._render();
  }

  _onViewAdd(data) {
    console.log('TransactionPresenter: добавление новой транзакции', data);
    
    // Валидация
    data.amount = Number(data.amount);
    
    // Убеждаемся, что дата в правильном формате
    if (data.date) {
      // Преобразуем дату в формат YYYY-MM-DD для корректной фильтрации
      const dateObj = new Date(data.date);
      if (!isNaN(dateObj.getTime())) {
        data.date = dateObj.toISOString().split('T')[0];
      }
    }
    
    this.model.add(data);
  }

  _onViewDelete(id) {
    console.log('TransactionPresenter: удаление транзакции', id);
    
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
      this.model.remove(id);
    }
  }

  _render() {
    console.log('TransactionPresenter: рендеринг данных');
    
    // Получаем все транзакции
    const allTransactions = this.model.getAll();
    console.log('TransactionPresenter: всего транзакций', allTransactions.length);
    
    // Применяем фильтр если есть
    let displayTransactions = allTransactions;
    if (this.filterPresenter) {
      const currentFilter = this.filterPresenter.getFilter();
      console.log('TransactionPresenter: текущий фильтр', currentFilter);
      
      displayTransactions = this.filterPresenter.apply(allTransactions);
      console.log('TransactionPresenter: отфильтровано транзакций', displayTransactions.length);
    }
    
    // Рендерим список
    this.view.renderList(displayTransactions);
    
    // Обновляем графики
    if (this.chartPresenter) {
      this.chartPresenter.update(allTransactions);
    }
  }
  
  // Публичный метод для обновления представления
  refresh() {
    this._render();
  }
}