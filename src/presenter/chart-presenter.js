// src/presenter/chart-presenter.js
export default class ChartPresenter {
  constructor({pieView, dynamicsView}) {
    this.pieView = pieView;
    this.dynamicsView = dynamicsView;
    this.budgetModel = null; // Инициализируем свойство
  }

  // Добавляем метод для установки модели бюджета
  setBudgetModel(budgetModel) {
    this.budgetModel = budgetModel;
  }

  update(transactions) {
    // Группируем по категориям
    const byCategory = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    // Передаем данные в круговую диаграмму
    if (this.pieView) this.pieView.render(byCategory);

    // Получаем данные бюджета для диаграммы динамики
    let totalLimit = 0;
    if (this.budgetModel) {
      const budgets = this.budgetModel.getAll();
      const totalBudget = budgets.find(b => b.name === 'Все расходы');
      if (totalBudget && this.dynamicsView) {
        totalLimit = totalBudget.limit || 0;
        this.dynamicsView.setTotalLimit(totalLimit);
      }
    }

    // Подготавливаем данные для диаграммы динамики
    // Нужно преобразовать данные в формат, который ожидает ChartDynamicsComponent
    const byDate = {};
    transactions.forEach(t => {
      if (t.amount < 0) { // только расходы
        if (!byDate[t.date]) {
          byDate[t.date] = { value: 0, category: t.category };
        }
        byDate[t.date].value += Math.abs(t.amount); // считаем положительное значение
      }
    });

    // Преобразуем в массив точек
    const points = Object.keys(byDate)
      .sort()
      .map(date => ({ 
        date, 
        value: byDate[date].value,
        category: byDate[date].category 
      }));

    // Рендерим диаграмму динамики
    if (this.dynamicsView) this.dynamicsView.render(points);
  }
}