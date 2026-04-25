import {
  createScheduleRecipeDto,
  ScheduleService,
  ScheduleRecipeRequest,
} from './schedule.service';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TranslocoService } from '@jsverse/transloco';

describe('createScheduleRecipeDto', () => {
  function createRequest(
    overrides: Partial<ScheduleRecipeRequest> = {}
  ): ScheduleRecipeRequest {
    return {
      recipeId: 42,
      scheduleDate: '2026-04-19T00:00:00.000Z',
      portionCount: 3,
      householdId: 7,
      mealType: 'DINNER',
      addToGroceryList: true,
      ...overrides,
    };
  }

  it('defaults addToGroceryList to true', () => {
    const payload = createScheduleRecipeDto(
      createRequest({ addToGroceryList: undefined })
    );

    expect(payload.addToGroceryList).toBeTrue();
  });

  it('sends addToGroceryList as true when explicitly enabled', () => {
    const payload = createScheduleRecipeDto(createRequest());

    expect(payload.addToGroceryList).toBeTrue();
  });

  it('sends addToGroceryList as false when ingredients should not be added', () => {
    const payload = createScheduleRecipeDto(createRequest({ addToGroceryList: false }));

    expect(payload.addToGroceryList).toBeFalse();
  });

  it('allows scheduling without an explicit household id', () => {
    const payload = createScheduleRecipeDto(createRequest({ householdId: undefined }));

    expect(Object.prototype.hasOwnProperty.call(payload, 'householdId')).toBeFalse();
  });

  it('includes a positive portion count when provided', () => {
    const payload = createScheduleRecipeDto(createRequest({ portionCount: 4 }));

    expect(payload.portionCount).toBe(4);
  });
});

describe('ScheduleService', () => {
  let service: ScheduleService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ScheduleService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: TranslocoService,
          useValue: {
            getActiveLang: () => 'de',
          },
        },
      ],
    });

    service = TestBed.inject(ScheduleService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('sends the current locale when scheduling a recipe', () => {
    service
      .scheduleRecipe(
        createScheduleRecipeDto({
          recipeId: 42,
          scheduleDate: '2026-04-19T00:00:00.000Z',
          householdId: 7,
          mealType: 'DINNER',
          addToGroceryList: true,
        })
      )
      .subscribe();

    const request = httpTestingController.expectOne(
      (req) => req.url === 'schedule' && req.params.get('locale') === 'de'
    );

    request.flush({});
  });
});