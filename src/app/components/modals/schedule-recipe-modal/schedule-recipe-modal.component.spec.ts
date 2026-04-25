import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ScheduleRecipeModalComponent } from './schedule-recipe-modal.component';
import { HouseholdService } from '../../../services/household.service';
import { ScheduleService } from '../../../services/schedule.service';
import { UserService } from '../../../services/user.service';

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

  const userServiceMock = {
    get: jasmine.createSpy('get').and.returnValue(
      of({ id: 1, displayName: 'Taylor', activeHouseholdId: 14 })
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

  it('defaults addToGroceryList to true', () => {
    const fixture = TestBed.createComponent(ScheduleRecipeModalComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({
      date: new Date(2026, 3, 19),
      mealType: 'DINNER',
      addToGroceryList: true,
    });
    component.onSubmit();

    const payload = scheduleServiceMock.scheduleRecipe.calls.mostRecent().args[0];
    expect(component.form.controls.addToGroceryList.value).toBeTrue();
    expect(payload.householdId).toBe(14);
    expect(payload.addToGroceryList).toBeTrue();
  });

  it('sends addToGroceryList as false when the user opts out of grocery list updates', () => {
    const fixture = TestBed.createComponent(ScheduleRecipeModalComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({
      date: new Date(2026, 3, 19),
      mealType: 'DINNER',
      addToGroceryList: false,
    });
    component.onSubmit();

    const payload = scheduleServiceMock.scheduleRecipe.calls.mostRecent().args[0];
    expect(payload.addToGroceryList).toBeFalse();
  });
});