// Подготавливает данные для диаграмм
export default class ChartPresenter {
  constructor({pieView, dynamicsView}) {
    this.pieView = pieView;
    this.dynamicsView = dynamicsView;
  }

  update(transactions) {
    // Группируем по категориям
    const byCategory = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    // Передаем данные в круговую диаграмму
    if (this.pieView) this.pieView.render(byCategory);

    // Динамика (оставляем без изменений)
    const byDate = transactions.reduce((acc, t) => {
      acc[t.date] = (acc[t.date] || 0) + t.amount;
      return acc;
    }, {});
    const points = Object.keys(byDate).sort().map(date => ({date, value: byDate[date]}));
    if (this.dynamicsView) this.dynamicsView.render(points);
  }
}