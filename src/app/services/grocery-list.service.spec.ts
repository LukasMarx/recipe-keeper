import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';

import { GroceryListService } from './grocery-list.service';

describe('GroceryListService', () => {
  let service: GroceryListService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GroceryListService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: TranslocoService,
          useValue: {
            getActiveLang: () => 'de',
            selectTranslate: () => of(''),
          },
        },
      ],
    });

    service = TestBed.inject(GroceryListService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  function createRawItem(
    id: number,
    amount: number,
    unit: string,
    checked = false
  ) {
    return {
      id,
      name: 'Kartoffeln',
      amount,
      unit,
      checked,
      recipeIngredient: {
        id: id + 100,
        originalName: 'Kartoffel',
        originalNamePlural: 'Kartoffeln',
        amount,
        unit,
        ingredient: {
          id: 'potato',
          plural: 'Kartoffeln',
          category: 'vegetable',
          imageUrl: 'https://example.com/potato.jpg',
        },
        createdDate: new Date('2026-04-19T00:00:00.000Z'),
      },
    };
  }

  function createListResponse(overrides: Record<string, unknown> = {}) {
    return {
      id: 7,
      householdId: 3,
      name: 'Weekly groceries',
      createDate: '2026-04-19T00:00:00.000Z',
      updateDate: '2026-04-19T00:00:00.000Z',
      items: [
        createRawItem(10, 0.5, 'kg', true),
        createRawItem(11, 1, 'kg', true),
        createRawItem(12, 2, 'pcs', false),
      ],
      ...overrides,
    };
  }

  it('keeps aggregatedItems from the API response as the primary display data', () => {
    let result:
      | ReturnType<GroceryListService['getActiveList']> extends infer _T
        ? any
        : never;

    service.getActiveList(3).subscribe((list) => {
      result = list;
    });

    const request = httpTestingController.expectOne(
      (req) =>
        req.url === 'grocery-list' &&
        req.params.get('householdId') === '3' &&
        req.params.get('locale') === 'de'
    );

    request.flush(
      createListResponse({
        aggregatedItems: [
          {
            id: 501,
            name: 'Kartoffeln',
            ingredientId: 'potato',
            ingredient: {
              id: 'potato',
              plural: 'Kartoffeln',
              displayName: 'Kartoffel lokalisiert',
              displayPlural: 'Kartoffeln lokalisiert',
              category: 'vegetable',
              imageUrl: 'https://example.com/potato.jpg',
            },
            checked: false,
            partiallyChecked: true,
            itemCount: 3,
            itemIds: [10, 11, 12],
            scheduledRecipeIds: [801],
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
      })
    );

    expect(result.aggregatedItems).toHaveSize(1);
    expect(result.aggregatedItems[0].quantityLabel).toBe('1.5 kg + 2 pcs');
    expect(result.aggregatedItems[0].partiallyChecked).toBeTrue();
    expect(result.aggregatedItems[0].itemIds).toEqual([10, 11, 12]);
    expect(result.aggregatedItems[0].ingredient?.category).toBe('vegetable');
  });

  it('creates fallback aggregatedItems from raw items when the response has no aggregatedItems', () => {
    let result:
      | ReturnType<GroceryListService['getActiveList']> extends infer _T
        ? any
        : never;

    service.getActiveList(3).subscribe((list) => {
      result = list;
    });

    const request = httpTestingController.expectOne(
      (req) =>
        req.url === 'grocery-list' &&
        req.params.get('householdId') === '3' &&
        req.params.get('locale') === 'de'
    );

    request.flush(createListResponse() as any);

    expect(result.aggregatedItems).toHaveSize(3);
    expect(result.aggregatedItems[0]).toEqual(
      jasmine.objectContaining({
        id: 10,
        itemIds: [10],
        itemCount: 1,
        quantityLabel: '0.5 kg',
        partiallyChecked: false,
      })
    );
  });

  it('sends locale when loading archived grocery lists', () => {
    service.getArchivedLists({ householdId: 3, limit: 5, offset: 10 }).subscribe();

    const request = httpTestingController.expectOne(
      (req) =>
        req.url === 'grocery-list/archive' &&
        req.params.get('householdId') === '3' &&
        req.params.get('limit') === '5' &&
        req.params.get('offset') === '10' &&
        req.params.get('locale') === 'de'
    );

    request.flush([]);
  });
});