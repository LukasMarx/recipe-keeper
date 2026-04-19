import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { RecipeDetailComponent } from './recipe-detail.component';
import { Recipe, RecipeImportTask } from '../../interfaces/recipe';
import { RecipeService } from '../../services/recipe.service';

describe('RecipeDetailComponent', () => {
  const dialogMock = {
    open: jasmine.createSpy(),
  };

  function createRecipe(overrides: Partial<Recipe>): Recipe {
    return {
      id: 1,
      title: 'Paprika-Sahne-Haehnchen von Sister',
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

  function createTask(
    overrides: Partial<RecipeImportTask> = {}
  ): RecipeImportTask {
    return {
      taskId: 'task-1',
      type: 'PARSE_INGREDIENTS',
      status: 'COMPLETED',
      recipeId: 1,
      ...overrides,
    };
  }

  async function configureTestingModule(recipe: Recipe) {
    const recipeServiceMock = {
      getRecipe: jasmine.createSpy().and.returnValue(of(recipe)),
      deleteRecipe: jasmine.createSpy().and.returnValue(of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [RecipeDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { params: of({ id: recipe.id }) } },
        { provide: RecipeService, useValue: recipeServiceMock },
        { provide: MatDialog, useValue: dialogMock },
      ],
    }).compileComponents();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    dialogMock.open.calls.reset();
  });

  it('hides the import status panel for ready recipes', async () => {
    await configureTestingModule(
      createRecipe({
        importTasks: [createTask()],
      })
    );

    const fixture = TestBed.createComponent(RecipeDetailComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.status-panel')).toBeNull();
  });

  it('shows the import status panel while a recipe is still importing', async () => {
    await configureTestingModule(
      createRecipe({
        status: 'IMPORTING',
        importTasks: [
          createTask({
            status: 'PROCESSING',
          }),
        ],
      })
    );

    const fixture = TestBed.createComponent(RecipeDetailComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.status-panel')).not.toBeNull();
  });
});