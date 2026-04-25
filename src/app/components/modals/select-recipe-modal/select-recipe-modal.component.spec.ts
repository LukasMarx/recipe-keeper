import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Recipe } from '../../../interfaces/recipe';
import { HouseholdService } from '../../../services/household.service';
import { ScheduleService } from '../../../services/schedule.service';
import { UserService } from '../../../services/user.service';
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

  const userServiceMock = {
    get: jasmine.createSpy('get').and.returnValue(
      of({ id: 1, displayName: 'Taylor', activeHouseholdId: 14 })
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
        { provide: UserService, useValue: userServiceMock },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    dialogRefMock.close.calls.reset();
    scheduleServiceMock.scheduleRecipe.calls.reset();
    householdServiceMock.getAll.calls.reset();
    userServiceMock.get.calls.reset();
    TestBed.resetTestingModule();
  });

  it('sends addToGroceryList as false when the user opts out of shopping lists', () => {
    const fixture = TestBed.createComponent(SelectRecipeModalComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.onRecipeClick(3);
    component.form.patchValue({
      addToGroceryList: false,
    });
    component.onSubmit();

    const payload = scheduleServiceMock.scheduleRecipe.calls.mostRecent().args[0];
    expect(payload.addToGroceryList).toBeFalse();
    expect(payload.portionCount).toBe(2);
  });

  it('defaults addToGroceryList to true when ingredients should be added', () => {
    const fixture = TestBed.createComponent(SelectRecipeModalComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.onRecipeClick(3);
    component.form.patchValue({
      addToGroceryList: true,
    });
    component.onSubmit();

    const payload = scheduleServiceMock.scheduleRecipe.calls.mostRecent().args[0];
    expect(payload.householdId).toBe(14);
    expect(payload.addToGroceryList).toBeTrue();
    expect(payload.portionCount).toBe(2);
  });
});