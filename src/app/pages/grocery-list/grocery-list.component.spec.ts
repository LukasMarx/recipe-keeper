import { MatSnackBar } from '@angular/material/snack-bar';
import { fakeAsync, tick, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { GroceryListComponent } from './grocery-list.component';
import { GroceryListService } from '../../services/grocery-list.service';
import { IngredientService } from '../../services/ingredient.service';
import { UserService } from '../../services/user.service';

describe('GroceryListComponent', () => {
  const groceryListServiceMock = jasmine.createSpyObj<GroceryListService>(
    'GroceryListService',
    [
      'getActiveList',
      'getArchivedLists',
      'getListById',
      'updateItem',
      'deleteItem',
      'addManualItem',
      'completeActiveList',
      'deleteArchivedList',
      'getCatergoryLabel',
      'getCategoryIcon',
    ]
  );
  const userServiceMock = {
    get: jasmine.createSpy(),
  };
  const ingredientServiceMock = {
    search: jasmine.createSpy(),
  };
  const snackBarMock = {
    open: jasmine.createSpy(),
  };

  function createActiveList() {
    return {
      id: 77,
      householdId: 5,
      name: 'Weekend groceries',
      createDate: '2026-04-19T00:00:00.000Z',
      updateDate: '2026-04-19T00:00:00.000Z',
      items: [
        {
          id: 10,
          name: 'Kartoffeln',
          amount: 0.5,
          unit: 'kg',
          checked: true,
          recipeIngredient: {
            id: 110,
            originalName: 'Kartoffel',
            originalNamePlural: 'Kartoffeln',
            amount: 0.5,
            unit: 'kg',
            ingredient: {
              id: 'potato',
              plural: 'Kartoffeln',
              displayName: 'Kartoffel lokalisiert',
              displayPlural: 'Kartoffeln lokalisiert',
              category: 'vegetable',
              imageUrl: 'https://example.com/potato.jpg',
            },
            createdDate: new Date('2026-04-19T00:00:00.000Z'),
          },
        },
        {
          id: 11,
          name: 'Kartoffeln',
          amount: 1,
          unit: 'kg',
          checked: true,
          recipeIngredient: {
            id: 111,
            originalName: 'Kartoffel',
            originalNamePlural: 'Kartoffeln',
            amount: 1,
            unit: 'kg',
            ingredient: {
              id: 'potato',
              plural: 'Kartoffeln',
              displayName: 'Kartoffel lokalisiert',
              displayPlural: 'Kartoffeln lokalisiert',
              category: 'vegetable',
              imageUrl: 'https://example.com/potato.jpg',
            },
            createdDate: new Date('2026-04-19T00:00:00.000Z'),
          },
        },
        {
          id: 12,
          name: 'Kartoffeln',
          amount: 2,
          unit: 'pcs',
          checked: false,
          recipeIngredient: {
            id: 112,
            originalName: 'Kartoffel',
            originalNamePlural: 'Kartoffeln',
            amount: 2,
            unit: 'pcs',
            ingredient: {
              id: 'potato',
              plural: 'Kartoffeln',
              displayName: 'Kartoffel lokalisiert',
              displayPlural: 'Kartoffeln lokalisiert',
              category: 'vegetable',
              imageUrl: 'https://example.com/potato.jpg',
            },
            createdDate: new Date('2026-04-19T00:00:00.000Z'),
          },
        },
      ],
      aggregatedItems: [
        {
          id: 501,
          name: 'Kartoffeln',
          ingredientId: 'potato',
          ingredient: {
            id: 'potato',
            plural: 'Kartoffeln',
            category: 'vegetable',
            imageUrl: 'https://example.com/potato.jpg',
          },
          checked: false,
          partiallyChecked: true,
          itemCount: 3,
          itemIds: [10, 11, 12],
          scheduledRecipeIds: [990],
          recipeIngredientIds: [110, 111, 112],
          quantities: [
            { amount: 1.5, unit: 'kg' },
            { amount: 2, unit: 'pcs' },
          ],
          quantityLabel: '1.5 kg + 2 pcs',
          amount: null,
          unit: null,
        },
      ],
    };
  }

  beforeEach(async () => {
    groceryListServiceMock.getActiveList.and.returnValue(of(createActiveList()));
    groceryListServiceMock.getArchivedLists.and.returnValue(of([]));
    groceryListServiceMock.getListById.and.returnValue(of(createActiveList()));
    groceryListServiceMock.updateItem.and.callFake((itemId: number, input) =>
      of({
        id: itemId,
        name: 'Kartoffeln',
        amount: 1,
        unit: 'kg',
        checked: input.checked ?? false,
      } as any)
    );
    groceryListServiceMock.deleteItem.and.returnValue(of(undefined));
    groceryListServiceMock.addManualItem.and.returnValue(of({} as any));
    groceryListServiceMock.completeActiveList.and.returnValue(
      of({
        activeList: createActiveList(),
        archivedList: createActiveList(),
      })
    );
    groceryListServiceMock.deleteArchivedList.and.returnValue(of(undefined));
    groceryListServiceMock.getCatergoryLabel.and.returnValue(of('Vegetables'));
    groceryListServiceMock.getCategoryIcon.and.returnValue('eco');
    ingredientServiceMock.search.and.returnValue(
      of([
        {
          id: 'potato',
          originalName: 'Kartoffel',
          plural: 'Kartoffeln',
          displayName: 'Kartoffel lokalisiert',
          displayPlural: 'Kartoffeln lokalisiert',
          category: 'vegetable',
          imageUrl: 'https://example.com/potato.jpg',
        },
      ])
    );
    userServiceMock.get.and.returnValue(of({ activeHouseholdId: 5 }));

    await TestBed.configureTestingModule({
      imports: [GroceryListComponent],
      providers: [
        { provide: GroceryListService, useValue: groceryListServiceMock },
        { provide: IngredientService, useValue: ingredientServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    groceryListServiceMock.getActiveList.calls.reset();
    groceryListServiceMock.getArchivedLists.calls.reset();
    groceryListServiceMock.getListById.calls.reset();
    groceryListServiceMock.updateItem.calls.reset();
    groceryListServiceMock.deleteItem.calls.reset();
    groceryListServiceMock.addManualItem.calls.reset();
    groceryListServiceMock.completeActiveList.calls.reset();
    groceryListServiceMock.deleteArchivedList.calls.reset();
    groceryListServiceMock.getCatergoryLabel.calls.reset();
    groceryListServiceMock.getCategoryIcon.calls.reset();
    ingredientServiceMock.search.calls.reset();
    userServiceMock.get.calls.reset();
    snackBarMock.open.calls.reset();
  });

  it('renders aggregated grocery items with quantityLabel and partial status', async () => {
    const fixture = TestBed.createComponent(GroceryListComponent);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const visibleNames = Array.from(compiled.querySelectorAll('.item-row .item-name')).map(
      (element) => element.textContent?.trim()
    );
    const aggregateToggle = compiled.querySelector('.item-toggle') as HTMLButtonElement;

    expect(visibleNames).toEqual(['Kartoffeln']);
    expect(compiled.querySelector('.item-meta')?.textContent).toContain('1.5 kg + 2 pcs');
    expect(aggregateToggle.getAttribute('aria-checked')).toBe('mixed');
  });

  it('exposes the raw source items behind an aggregated entry', async () => {
    const fixture = TestBed.createComponent(GroceryListComponent);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const expandButton = compiled.querySelector(
      '[aria-label="Show source items"]'
    ) as HTMLButtonElement;

    expandButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const sourceNames = Array.from(compiled.querySelectorAll('.source-name')).map(
      (element) => element.textContent?.trim()
    );

    expect(sourceNames).toHaveSize(3);
    expect(sourceNames.every((name) => name === 'Kartoffel lokalisiert')).toBeTrue();
  });

  it('updates every raw source item when an aggregated checkbox is toggled', async () => {
    const fixture = TestBed.createComponent(GroceryListComponent);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const aggregateToggle = fixture.nativeElement.querySelector(
      '.item-toggle'
    ) as HTMLButtonElement;

    aggregateToggle.click();
    await fixture.whenStable();

    expect(groceryListServiceMock.updateItem.calls.allArgs()).toEqual([
      [10, { checked: true }],
      [11, { checked: true }],
      [12, { checked: true }],
    ]);
  });

  it('opens the quick add detail view after selecting an ingredient suggestion', fakeAsync(() => {
    const fixture = TestBed.createComponent(GroceryListComponent);

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('.quick-add-input') as HTMLInputElement;

    input.dispatchEvent(new FocusEvent('focus'));
    input.value = 'Kart';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(250);
    fixture.detectChanges();

    const suggestion = compiled.querySelector('.quick-add-suggestion') as HTMLButtonElement;

    expect(ingredientServiceMock.search).toHaveBeenCalledWith('Kart', 8);
    expect(suggestion.textContent).toContain('Kartoffel lokalisiert');

    suggestion.click();
    fixture.detectChanges();

    const amountInput = compiled.querySelector(
      '.quick-add-amount__input'
    ) as HTMLInputElement;
    const unitInput = compiled.querySelector(
      '.quick-add-unit__input'
    ) as HTMLInputElement;

    expect(input.value).toBe('Kartoffel lokalisiert');
    expect(compiled.querySelector('.quick-add-detail')?.textContent).toContain(
      'Kartoffel lokalisiert'
    );
    expect(amountInput.value).toBe('1');
    expect(unitInput.value).toBe('');
    expect(compiled.querySelector('.quick-add-suggestions')).toBeNull();
  }));

  it('sends ingredientId when adding a selected autocomplete ingredient', fakeAsync(() => {
    const fixture = TestBed.createComponent(GroceryListComponent);

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('.quick-add-input') as HTMLInputElement;

    input.dispatchEvent(new FocusEvent('focus'));
    input.value = 'Kart';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(250);
    fixture.detectChanges();

    const suggestion = compiled.querySelector('.quick-add-suggestion') as HTMLButtonElement;
    suggestion.click();
    fixture.detectChanges();

    const form = compiled.querySelector('.quick-add-dock') as HTMLFormElement;
    const amountInput = compiled.querySelector('.quick-add-amount__input') as HTMLInputElement;
    const unitInput = compiled.querySelector('.quick-add-unit__input') as HTMLInputElement;

    amountInput.value = '2';
    amountInput.dispatchEvent(new Event('input'));
    unitInput.value = 'L';
    unitInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(groceryListServiceMock.addManualItem).toHaveBeenCalledWith({
      amount: 2,
      householdId: 5,
      ingredientId: 'potato',
      name: 'Kartoffel lokalisiert',
      unit: 'L',
    });
  }));
});