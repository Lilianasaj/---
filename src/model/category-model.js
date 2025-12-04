export default class CategoryModel {
  constructor(initial = []) {
    this._cats = Array.from(initial);
  }

  getAll() {
    return this._cats.slice();
  }

  add(cat) {
    if (!this._cats.includes(cat)) {
      this._cats.push(cat);
    }
  }
}
