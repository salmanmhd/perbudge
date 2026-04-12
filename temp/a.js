function Employee(baseSalary, overtime, rate) {
    this.baseSalary = baseSalary
    this.overtime = overtime
    this.rate = rate

    let calculateBonus = () => baseSalary * 0.1

    this.getWage = () => this.baseSalary + (this.overtime * this.rate) + calculateBonus()
}

const Manish = new Employee(12000, 12, 100)

console.log('Manish: ', Manish);
console.log('Manish salary: ', Manish.getWage());
