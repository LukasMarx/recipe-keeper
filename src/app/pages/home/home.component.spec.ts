import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { HomeComponent } from './home.component';
import { Recipe } from '../../interfaces/recipe';
import { RecipeService } from '../../services/recipe.service';

describe('HomeComponent', () => {
  const recipeServiceMock = {
    getMyRecipes: jasmine.createSpy().and.returnValue(of([])),
  };

  const dialogMock = {
    open: jasmine.createSpy(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: RecipeService, useValue: recipeServiceMock },
        { provide: MatDialog, useValue: dialogMock },
      ],
    }).compileComponents();
  });

  function createRecipe(overrides: Partial<Recipe>): Recipe {
    return {
      id: 1,
      title: 'Paprika-Sahne-Hähnchen von Sister',
      description: 'A creamy weeknight dish',
      userId: 1,
      imageUrl: 'https://example.com/recipe.jpg',
      ingredients: [],
      instructions: [],
      recipeYield: 2,
      createDate: new Date('2026-04-17T00:00:00.000Z'),
      updateDate: new Date('2026-04-17T00:00:00.000Z'),
      keywords: [],
      ingredientsList: [],
      status: 'READY',
      ...overrides,
    };
  }

  it('removes imported author suffixes from the visible title', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    const recipe = createRecipe({});

    expect(component.getDisplayTitle(recipe)).toBe('Paprika-Sahne-Hähnchen');
  });

  it('shows the imported author as card metadata when present', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    const recipe = createRecipe({
      sourceUrl: 'https://www.chefkoch.de/rezepte/example.html',
    });

    expect(component.getRecipeMeta(recipe)).toBe('by Sister');
  });

  it('truncates long cleaned titles at word boundaries', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    const recipe = createRecipe({
      title: 'Rinderhüftsteak kross gebraten mit Portweinsauce von Rubinchen2',
    });

    expect(component.getDisplayTitle(recipe)).toBe(
      'Rinderhüftsteak kross gebraten mit…'
    );
  });

  it('falls back to the source host when no imported author exists', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    const recipe = createRecipe({
      title: 'Avocado Bowl',
      sourceUrl: 'https://www.chefkoch.de/rezepte/example.html',
    });

    expect(component.getRecipeMeta(recipe)).toBe('by Chefkoch');
  });
});