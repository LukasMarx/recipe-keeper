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
      householdId: 7,
      mealType: 'DINNER',
      groceryListMode: 'ACTIVE',
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

  it('allows scheduling without an explicit household id', () => {
    const payload = createScheduleRecipeDto(createRequest({ householdId: undefined }));

    expect(Object.prototype.hasOwnProperty.call(payload, 'householdId')).toBeFalse();
  });
});