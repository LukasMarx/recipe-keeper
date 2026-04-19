import {
  createScheduleRecipeDto,
  ScheduleRecipeRequest,
} from './schedule.service';

describe('createScheduleRecipeDto', () => {
  function createRequest(
    overrides: Partial<ScheduleRecipeRequest> = {}
  ): ScheduleRecipeRequest {
    return {
      recipeId: 42,
      scheduleDate: '2026-04-19T00:00:00.000Z',
      householdId: 0,
      mealType: 'DINNER',
      groceryListMode: 'AUTO',
      ...overrides,
    };
  }

  it('omits groceryListId for automatic assignment', () => {
    const payload = createScheduleRecipeDto(createRequest());

    expect(Object.prototype.hasOwnProperty.call(payload, 'groceryListId')).toBeFalse();
  });

  it('sends groceryListId as null when ingredients should not be added to a shopping list', () => {
    const payload = createScheduleRecipeDto(
      createRequest({ groceryListMode: 'NONE', groceryListId: 123 })
    );

    expect(payload.groceryListId).toBeNull();
  });

  it('sends the selected shopping list id for explicit assignment', () => {
    const payload = createScheduleRecipeDto(
      createRequest({ groceryListMode: 'EXISTING', groceryListId: 77 })
    );

    expect(payload.groceryListId).toBe(77);
  });

  it('rejects invalid shopping list ids for explicit assignment', () => {
    expect(() =>
      createScheduleRecipeDto(
        createRequest({ groceryListMode: 'EXISTING', groceryListId: 0 })
      )
    ).toThrowError('A valid shopping list must be selected.');
  });
});