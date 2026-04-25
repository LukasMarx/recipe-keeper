import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TranslocoService } from '@jsverse/transloco';

import { IngredientService } from './ingredient.service';

describe('IngredientService', () => {
  let service: IngredientService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        IngredientService,
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

    service = TestBed.inject(IngredientService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('sends the current locale when searching ingredients', () => {
    let result: unknown[] | undefined;

    service.search('kart', 5).subscribe((ingredients) => {
      result = ingredients;
    });

    const request = httpTestingController.expectOne(
      (req) =>
        req.url === 'ingredient/search' &&
        req.params.get('query') === 'kart' &&
        req.params.get('limit') === '5' &&
        req.params.get('locale') === 'de'
    );

    request.flush([]);

    expect(result).toEqual([]);
  });
});