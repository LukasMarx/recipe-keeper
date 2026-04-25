import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';

import { AuthService } from './auth.service';
import { RecipeService } from './recipe.service';

describe('RecipeService', () => {
  let service: RecipeService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RecipeService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            accessToken$: of(null),
          },
        },
        {
          provide: TranslocoService,
          useValue: {
            getActiveLang: () => 'de',
          },
        },
      ],
    });

    service = TestBed.inject(RecipeService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('requests recipe details with the current locale', () => {
    let result: any;

    service.getRecipe(7, true).subscribe((recipe) => {
      result = recipe;
    });

    const request = httpTestingController.expectOne(
      (req) => req.url === 'recipe/7' && req.params.get('locale') === 'de'
    );

    request.flush({
      id: 7,
      title: 'Kartoffelsuppe',
      description: '',
      userId: 1,
      imageUrl: '',
      ingredients: [],
      instructions: [],
      recipeYield: 2,
      createDate: '2026-04-17T00:00:00.000Z',
      updateDate: '2026-04-17T00:00:00.000Z',
      keywords: [],
      ingredientsList: [],
      status: 'READY',
    });

    expect(result.id).toBe(7);
  });

  it('requests recipe details with the selected portions and locale', () => {
    let result: any;

    service.getRecipe(7, true, 4).subscribe((recipe) => {
      result = recipe;
    });

    const request = httpTestingController.expectOne(
      (req) =>
        req.url === 'recipe/7' &&
        req.params.get('locale') === 'de' &&
        req.params.get('portions') === '4'
    );

    request.flush({
      id: 7,
      title: 'Kartoffelsuppe',
      description: '',
      userId: 1,
      imageUrl: '',
      ingredients: [],
      instructions: [],
      recipeYield: 2,
      portions: 4,
      createDate: '2026-04-17T00:00:00.000Z',
      updateDate: '2026-04-17T00:00:00.000Z',
      keywords: [],
      ingredientsList: [],
      status: 'READY',
    });

    expect(result.portions).toBe(4);
  });
});