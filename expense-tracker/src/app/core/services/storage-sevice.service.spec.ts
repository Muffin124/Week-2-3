import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage-sevice.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StorageService]
    });
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem(key: string) { return data.get(key) ?? null; },
      setItem(key: string, value: string) { data.set(key, value); },
      removeItem(key: string) { data.delete(key); },
      clear() { data.clear(); }
    });
    localStorage.clear();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
    service = TestBed.inject(StorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('adds a receipt and creates a matching expense transaction', () => {
    service.addExpense({
      merchantName: 'Local Store',
      date: '2026-09-03',
      totalAmount: 25,
      items: [{
        name: 'Milk',
        price: 25,
        category: 'Food',
        quantity: 1
      }]
    });

    expect(service.expenses()).toHaveLength(1);
    expect(service.expenses()[0].merchantName).toBe('Local Store');
    expect(service.transactions()).toEqual([
      expect.objectContaining({
        id: '00000000-0000-4000-8000-000000000001',
        type: 'expense',
        amount: 25,
        category: 'Zakupy',
        description: 'Local Store'
      })
    ]);
  });

  it('adds and removes an income transaction', () => {
    service.addTransaction({
      type: 'income',
      amount: 4000,
      category: 'Salary',
      description: 'September salary',
      date: '2026-09-01'
    });

    const transactionId = service.transactions()[0].id;
    expect(service.transactions()[0]).toEqual(expect.objectContaining({
      type: 'income',
      amount: 4000,
      category: 'Salary'
    }));

    service.deleteTransaction(transactionId);
    expect(service.transactions()).toHaveLength(0);
  });

  it('removes the transaction linked to a deleted receipt', () => {
    service.addExpense({
      merchantName: 'Market',
      date: '2026-09-03',
      totalAmount: 12,
      items: [{
        name: 'Bread',
        price: 12,
        category: 'Food',
        quantity: 1
      }]
    });

    service.deleteExpense('00000000-0000-4000-8000-000000000001');

    expect(service.expenses()).toHaveLength(0);
    expect(service.transactions()).toHaveLength(0);
  });
});
