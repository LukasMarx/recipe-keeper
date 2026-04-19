import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ScheduleRecipeModalComponent } from './schedule-recipe-modal.component';
import { GroceryListService } from '../../../services/grocery-list.service';
import { HouseholdService } from '../../../services/household.service';
import { ScheduleService } from '../../../services/schedule.service';

describe('ScheduleRecipeModalComponent', () => {
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ScheduleRecipeModalComponent],
      providers: [
        { provide: DIALOG_DATA, useValue: { recipeId: 9 } },
        { provide: MatDialogRef, useValue: dialogRefMock },
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

  it('defaults to automatic shopping list assignment and omits groceryListId', () => {
    const fixture = TestBed.createComponent(ScheduleRecipeModalComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({
      date: new Date(2026, 3, 19),
      mealType: 'DINNER',
      groceryListMode: 'AUTO',
    });
    component.onSubmit();

    const payload = scheduleServiceMock.scheduleRecipe.calls.mostRecent().args[0];
    expect(component.form.controls.groceryListMode.value).toBe('AUTO');
    expect(Object.prototype.hasOwnProperty.call(payload, 'groceryListId')).toBeFalse();
  });

  it('blocks submit when a specific shopping list should be selected but none is chosen', () => {
    const fixture = TestBed.createComponent(ScheduleRecipeModalComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({
      date: new Date(2026, 3, 19),
      mealType: 'DINNER',
      groceryListMode: 'EXISTING',
      groceryListId: null,
    });
    component.onSubmit();

    expect(component.form.hasError('groceryListRequired')).toBeTrue();
    expect(scheduleServiceMock.scheduleRecipe).not.toHaveBeenCalled();
  });
});