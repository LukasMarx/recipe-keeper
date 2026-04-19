import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Recipe } from '../../../interfaces/recipe';
import { GroceryListService } from '../../../services/grocery-list.service';
import { HouseholdService } from '../../../services/household.service';
import { ScheduleService } from '../../../services/schedule.service';
import { SelectRecipeModalComponent } from './select-recipe-modal.component';

describe('SelectRecipeModalComponent', () => {
  const dialogRefMock = {
    close: jasmine.createSpy('close'),
  };

  const scheduleServiceMock = {
    scheduleRecipe: jasmine.createSpy('scheduleRecipe').and.returnValue(of(void 0)),
  };

  const householdServiceMock = {
    getAll: jasmine.createSpy('getAll').and.returnValue(of([])),
  };

  const groceryListServiceMock = {
    getAvailableLists: jasmine.createSpy('getAvailableLists').and.returnValue(
      of([
        {
          createDate: '2026-04-19T00:00:00.000Z',
          householdId: 0,
          id: 12,
          name: 'Weekend Prep',
          plannedDate: '2026-04-20T00:00:00.000Z',
          updateDate: '2026-04-19T00:00:00.000Z',
          userId: 1,
          items: [],
        },
      ])
    ),
  };

  function createRecipe(overrides: Partial<Recipe> = {}): Recipe {
    return {
      id: 3,
      title: 'Tomato Pasta',
      description: 'Quick dinner',
      userId: 1,
      imageUrl: 'https://example.com/pasta.jpg',
      ingredients: [],
      instructions: [],
      recipeYield: 2,
      createDate: new Date('2026-04-17T00:00:00.000Z'),
      updateDate: new Date('2026-04-17T00:00:00.000Z'),
      keywords: ['pasta'],
      ingredientsList: [],
      status: 'READY',
      ...overrides,
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectRecipeModalComponent],
      providers: [
        {
          provide: DIALOG_DATA,
          useValue: {
            recipes: [createRecipe()],
            date: new Date(2026, 3, 19),
            mealType: 'DINNER',
          },
        },
        { provide: DialogRef, useValue: dialogRefMock },
        { provide: ScheduleService, useValue: scheduleServiceMock },
        { provide: HouseholdService, useValue: householdServiceMock },
        { provide: GroceryListService, useValue: groceryListServiceMock },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    dialogRefMock.close.calls.reset();
    scheduleServiceMock.scheduleRecipe.calls.reset();
    householdServiceMock.getAll.calls.reset();
    groceryListServiceMock.getAvailableLists.calls.reset();
    TestBed.resetTestingModule();
  });

  it('sends groceryListId as null when the user opts out of shopping lists', () => {
    const fixture = TestBed.createComponent(SelectRecipeModalComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectedRecipe.set(createRecipe());
    component.form.patchValue({
      groceryListMode: 'NONE',
      groceryListId: null,
    });
    component.onSubmit();

    const payload = scheduleServiceMock.scheduleRecipe.calls.mostRecent().args[0];
    expect(payload.groceryListId).toBeNull();
  });

  it('sends the selected shopping list id for explicit assignment', () => {
    const fixture = TestBed.createComponent(SelectRecipeModalComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectedRecipe.set(createRecipe());
    component.form.patchValue({
      groceryListMode: 'EXISTING',
      groceryListId: 12,
    });
    component.onSubmit();

    const payload = scheduleServiceMock.scheduleRecipe.calls.mostRecent().args[0];
    expect(payload.groceryListId).toBe(12);
  });
});