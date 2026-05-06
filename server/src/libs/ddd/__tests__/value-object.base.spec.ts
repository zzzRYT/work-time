import { ValueObject } from '../value-object.base';

interface Money { amount: number; currency: string; }

class MoneyVO extends ValueObject<Money> {
  static create(amount: number, currency: string): MoneyVO {
    return new MoneyVO({ amount, currency });
  }
  get amount() { return this.props.amount; }
  get currency() { return this.props.currency; }
}

describe('ValueObject', () => {
  it('동일 props면 equals가 true', () => {
    const a = MoneyVO.create(100, 'KRW');
    const b = MoneyVO.create(100, 'KRW');
    expect(a.equals(b)).toBe(true);
  });

  it('하나라도 다르면 equals가 false', () => {
    const a = MoneyVO.create(100, 'KRW');
    const b = MoneyVO.create(100, 'USD');
    expect(a.equals(b)).toBe(false);
  });

  it('null/undefined와의 비교는 false', () => {
    const a = MoneyVO.create(100, 'KRW');
    expect(a.equals(null as unknown as MoneyVO)).toBe(false);
    expect(a.equals(undefined as unknown as MoneyVO)).toBe(false);
  });

  it('props는 동결되어 변경 불가', () => {
    const a = MoneyVO.create(100, 'KRW');
    expect(() => { (a as unknown as { props: Money }).props.amount = 200; })
      .toThrow();
  });
});
