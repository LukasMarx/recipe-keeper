import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  catchError,
  filter,
  finalize,
  map,
  tap,
} from 'rxjs';
import { io, Socket } from 'socket.io-client';
import {
  Recipe,
  RecipeImportTask,
  RecipeStatus,
  RecipeStatusEvent,
  RecipeTaskStatusEvent,
} from '../interfaces/recipe';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly translocoService = inject(TranslocoService);
  private readonly cache = new Map<number, Recipe>();
  private readonly recipeEntities = new BehaviorSubject<Map<number, Recipe>>(
    new Map<number, Recipe>()
  );
  private readonly pendingRecipeRequests = new Set<string>();
  private readonly refreshTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private socket?: Socket;
  private activeSocketToken: string | null = null;

  public myRecipes = new BehaviorSubject<undefined | Recipe[]>(undefined);

  constructor() {
    this.authService.accessToken$.subscribe((accessToken) => {
      this.syncSocketConnection(accessToken);
    });
  }

  public importRecipe(url: string) {
    return this.http.post<Recipe>('recipe/import', { url }).pipe(
      map((recipe) => this.normalizeRecipe(recipe, 'IMPORTING')),
      tap((recipe) => {
        this.upsertRecipe(recipe, true);
        this.scheduleRecipeRefresh(recipe.id, 250);
      })
    );
  }

  public getRecipeFromUrl(url: string) {
    return this.importRecipe(url);
  }

  public postRecipe(recipe: any) {
    return this.http.post<Recipe>('recipe', recipe).pipe(
      tap((createdRecipe) => {
        if (this.isRecipePayload(createdRecipe)) {
          this.upsertRecipe(this.normalizeRecipe(createdRecipe, 'READY'), true);
          return;
        }

        this.refreshRecipeList();
      })
    );
  }

  public putRecipe(recipe: any) {
    this.cache.delete(recipe.id);
    return this.http.put<Recipe>(`recipe/${recipe.id}`, recipe).pipe(
      tap((updatedRecipe) => {
        if (this.isRecipePayload(updatedRecipe)) {
          this.upsertRecipe(this.normalizeRecipe(updatedRecipe, 'READY'));
          return;
        }

        this.scheduleRecipeRefresh(Number(recipe.id), 0);
      })
    );
  }

  public deleteRecipe(id: number) {
    this.cache.delete(id);
    return this.http.delete(`recipe/${id}`).pipe(
      tap(() => {
        this.removeRecipe(id);
      })
    );
  }

  public getMyRecipes(force = false) {
    if (force || this.myRecipes.value === undefined) {
      this.refreshRecipeList();
    }

    return this.myRecipes.asObservable();
  }

  public getRecipe(id: number, force = false, portions?: number) {
    const recipeId = Number(id);
    const requestedPortions = this.normalizeRequestedPortions(portions);

    if (!Number.isFinite(recipeId)) {
      return EMPTY as Observable<Recipe>;
    }

    if (force || !this.matchesRequestedPortions(this.cache.get(recipeId), requestedPortions)) {
      this.requestRecipe(recipeId, true, requestedPortions);
    }

    return this.recipeEntities.asObservable().pipe(
      map((recipes) => recipes.get(recipeId)),
      filter(
        (recipe): recipe is Recipe =>
          this.matchesRequestedPortions(recipe, requestedPortions)
      )
    );
  }

  public applyRecipeStatusUpdate(event: RecipeStatusEvent) {
    const recipeId = Number(event.recipeId);

    if (!Number.isFinite(recipeId)) {
      return;
    }

    const currentRecipe =
      this.cache.get(recipeId) ?? this.createPlaceholderRecipe(recipeId, event.status);

    this.upsertRecipe(
      this.normalizeRecipe(
        {
          ...currentRecipe,
          status: event.status,
          importFailureMessage:
            event.status === 'FAILED'
              ? currentRecipe.importFailureMessage ??
                this.getFailedTaskMessage(currentRecipe.importTasks)
              : null,
        },
        event.status
      )
    );

    this.scheduleRecipeRefresh(recipeId, event.status === 'READY' ? 50 : 250);
  }

  public applyTaskStatusUpdate(event: RecipeTaskStatusEvent) {
    const recipeId = Number(event.recipeId);

    if (!Number.isFinite(recipeId)) {
      return;
    }

    const currentRecipe =
      this.cache.get(recipeId) ?? this.createPlaceholderRecipe(recipeId);
    const currentTasks = currentRecipe.importTasks ?? [];
    const nextTask = this.normalizeTask({ ...event, recipeId });
    const nextTasks = [...currentTasks];
    const currentTaskIndex = nextTasks.findIndex(
      (task) => `${task.taskId}` === `${nextTask.taskId}`
    );

    if (currentTaskIndex >= 0) {
      nextTasks[currentTaskIndex] = nextTask;
    } else {
      nextTasks.push(nextTask);
    }

    this.upsertRecipe(
      this.normalizeRecipe({
        ...currentRecipe,
        importTasks: nextTasks,
        importFailureMessage:
          nextTask.status === 'FAILED'
            ? nextTask.error ?? currentRecipe.importFailureMessage
            : currentRecipe.importFailureMessage,
      })
    );

    if (nextTask.status === 'COMPLETED' || nextTask.status === 'FAILED') {
      this.scheduleRecipeRefresh(recipeId, 150);
    }
  }

  private refreshRecipeList() {
    this.http
      .get<Recipe[]>('recipe')
      .pipe(
        tap((recipes) => {
          const normalizedRecipes = (recipes ?? []).map((recipe) =>
            this.normalizeRecipe(recipe)
          );

          normalizedRecipes.forEach((recipe) => this.storeRecipe(recipe));
          this.myRecipes.next(normalizedRecipes);
        }),
        catchError(() => {
          if (this.myRecipes.value === undefined) {
            this.myRecipes.next([]);
          }

          return EMPTY;
        })
      )
      .subscribe();
  }

  private requestRecipe(recipeId: number, force = false, portions?: number) {
    if (!Number.isFinite(recipeId)) {
      return;
    }

    const requestKey = this.getRecipeRequestKey(recipeId, portions);

    if (this.pendingRecipeRequests.has(requestKey)) {
      return;
    }

    if (!force && this.matchesRequestedPortions(this.cache.get(recipeId), portions)) {
      return;
    }

    this.pendingRecipeRequests.add(requestKey);
    this.http
      .get<Recipe>(`recipe/${recipeId}`, {
        params: this.buildRecipeParams(portions),
      })
      .pipe(
        tap((recipe) => {
          this.upsertRecipe(this.normalizeRecipe(recipe), false, portions === undefined);
        }),
        catchError(() => EMPTY),
        finalize(() => {
          this.pendingRecipeRequests.delete(requestKey);
        })
      )
      .subscribe();
  }

  private buildRecipeParams(portions?: number) {
    let params = this.buildLocaleParams();

    if (portions !== undefined) {
      params = params.set('portions', `${portions}`);
    }

    return params;
  }

  private buildLocaleParams() {
    let params = new HttpParams();
    const locale = this.translocoService.getActiveLang()?.trim();

    if (locale) {
      params = params.set('locale', locale);
    }

    return params;
  }

  private scheduleRecipeRefresh(recipeId: number, delay = 200) {
    const currentTimer = this.refreshTimers.get(recipeId);

    if (currentTimer) {
      clearTimeout(currentTimer);
    }

    const nextTimer = setTimeout(() => {
      this.refreshTimers.delete(recipeId);
      this.requestRecipe(recipeId, true);
    }, delay);

    this.refreshTimers.set(recipeId, nextTimer);
  }

  private syncSocketConnection(accessToken: string | null) {
    if (!accessToken) {
      this.disconnectSocket();
      return;
    }

    if (this.socket && this.activeSocketToken === accessToken) {
      if (!this.socket.connected) {
        this.socket.auth = { token: accessToken };
        this.socket.connect();
      }

      return;
    }

    this.disconnectSocket();
    this.activeSocketToken = accessToken;
    this.socket = io(this.getSocketOrigin(), {
      auth: {
        token: accessToken,
      },
      autoConnect: true,
    });

    this.socket.on('recipe:status', (event: RecipeStatusEvent) => {
      this.applyRecipeStatusUpdate(event);
    });

    this.socket.on('task:status', (event: RecipeTaskStatusEvent) => {
      this.applyTaskStatusUpdate(event);
    });
  }

  private disconnectSocket() {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = undefined;
    this.activeSocketToken = null;
  }

  private getSocketOrigin() {
    const originUrl = new URL(environment.origin);
    return originUrl.origin;
  }

  private upsertRecipe(recipe: Recipe, prepend = false, syncMyRecipes = true) {
    const storedRecipe = this.storeRecipe(recipe);
    const currentRecipes = this.myRecipes.value;

    if (!syncMyRecipes || !currentRecipes) {
      return storedRecipe;
    }

    const existingRecipeIndex = currentRecipes.findIndex(
      (currentRecipe) => currentRecipe.id === storedRecipe.id
    );

    if (existingRecipeIndex === -1) {
      this.myRecipes.next(
        prepend
          ? [storedRecipe, ...currentRecipes]
          : [...currentRecipes, storedRecipe]
      );
      return storedRecipe;
    }

    const nextRecipes = [...currentRecipes];
    nextRecipes[existingRecipeIndex] = storedRecipe;
    this.myRecipes.next(nextRecipes);

    return storedRecipe;
  }

  private storeRecipe(recipe: Recipe) {
    const nextRecipe = this.normalizeRecipe(recipe);
    this.cache.set(nextRecipe.id, nextRecipe);

    const nextEntities = new Map(this.recipeEntities.value);
    nextEntities.set(nextRecipe.id, nextRecipe);
    this.recipeEntities.next(nextEntities);

    return nextRecipe;
  }

  private removeRecipe(recipeId: number) {
    this.cache.delete(recipeId);

    const nextEntities = new Map(this.recipeEntities.value);
    nextEntities.delete(recipeId);
    this.recipeEntities.next(nextEntities);

    const currentRecipes = this.myRecipes.value;
    if (!currentRecipes) {
      return;
    }

    this.myRecipes.next(
      currentRecipes.filter((currentRecipe) => currentRecipe.id !== recipeId)
    );
  }

  private normalizeRecipe(
    recipe: Partial<Recipe> & { id: number },
    fallbackStatus: RecipeStatus = 'READY'
  ): Recipe {
    const currentRecipe = this.cache.get(recipe.id);
    const nextStatus = recipe.status ?? currentRecipe?.status ?? fallbackStatus;
    const nextTasks = Array.isArray(recipe.importTasks)
      ? recipe.importTasks.map((task) => this.normalizeTask(task))
      : currentRecipe?.importTasks ?? [];
    const failedTaskMessage = this.getFailedTaskMessage(nextTasks);
    const nextFailureMessage =
      nextStatus === 'FAILED'
        ? recipe.importFailureMessage ??
          currentRecipe?.importFailureMessage ??
          failedTaskMessage ??
          'The recipe import failed. Please review the task details below.'
        : failedTaskMessage ?? null;

    return {
      id: recipe.id,
      title: recipe.title ?? currentRecipe?.title ?? 'Imported recipe',
      description: recipe.description ?? currentRecipe?.description ?? '',
      userId: recipe.userId ?? currentRecipe?.userId ?? 0,
      imageUrl: recipe.imageUrl ?? currentRecipe?.imageUrl ?? '',
      ingredients: Array.isArray(recipe.ingredients)
        ? recipe.ingredients
        : currentRecipe?.ingredients ?? [],
      instructions: Array.isArray(recipe.instructions)
        ? recipe.instructions
        : currentRecipe?.instructions ?? [],
      prepTime: recipe.prepTime ?? currentRecipe?.prepTime ?? null,
      cookTime: recipe.cookTime ?? currentRecipe?.cookTime ?? null,
      totalTime: recipe.totalTime ?? currentRecipe?.totalTime ?? null,
      recipeYield: recipe.recipeYield ?? currentRecipe?.recipeYield ?? 1,
      portions: this.resolveRecipePortions(recipe, currentRecipe),
      sourceUrl: recipe.sourceUrl ?? currentRecipe?.sourceUrl ?? null,
      createDate: recipe.createDate ?? currentRecipe?.createDate,
      updateDate: recipe.updateDate ?? currentRecipe?.updateDate,
      videoUrl: recipe.videoUrl ?? currentRecipe?.videoUrl ?? null,
      videoThumbnailUrl:
        recipe.videoThumbnailUrl ?? currentRecipe?.videoThumbnailUrl ?? null,
      keywords: Array.isArray(recipe.keywords)
        ? recipe.keywords
        : currentRecipe?.keywords ?? [],
      calories: recipe.calories ?? currentRecipe?.calories ?? null,
      ingredientsList: Array.isArray(recipe.ingredientsList)
        ? recipe.ingredientsList
        : currentRecipe?.ingredientsList ?? [],
      status: nextStatus,
      importTasks: nextTasks,
      importFailureMessage: nextFailureMessage,
    };
  }

  private normalizeTask(task: RecipeImportTask): RecipeImportTask {
    return {
      ...task,
      recipeId: Number(task.recipeId),
      error: task.error ?? null,
    };
  }

  private createPlaceholderRecipe(
    recipeId: number,
    status: RecipeStatus = 'IMPORTING'
  ) {
    return this.normalizeRecipe(
      {
        id: recipeId,
        title: 'Imported recipe',
        description: '',
        userId: 0,
        imageUrl: '',
        ingredients: [],
        instructions: [],
        recipeYield: 1,
        keywords: [],
        ingredientsList: [],
        status,
      },
      status
    );
  }

  private getFailedTaskMessage(tasks?: RecipeImportTask[]) {
    return tasks?.find((task) => task.status === 'FAILED')?.error ?? null;
  }

  private isRecipePayload(payload: unknown): payload is Recipe {
    return !!payload && typeof payload === 'object' && 'id' in payload;
  }

  private normalizeRequestedPortions(portions?: number | null): number | undefined {
    const value = Number(portions);

    if (!Number.isFinite(value) || value < 1) {
      return undefined;
    }

    return Math.round(value);
  }

  private matchesRequestedPortions(recipe: Recipe | undefined, portions?: number): boolean {
    if (!recipe) {
      return false;
    }

    const effectiveRequestedPortions = portions ?? this.resolveDefaultRecipePortions(recipe);

    return this.resolveRecipePortions(recipe) === effectiveRequestedPortions;
  }

  private resolveRecipePortions(recipe: Partial<Recipe>, currentRecipe?: Recipe): number {
    const recipePortions = Number(recipe.portions);

    if (Number.isFinite(recipePortions) && recipePortions > 0) {
      return Math.round(recipePortions);
    }

    const recipeYield = Number(recipe.recipeYield);

    if (Number.isFinite(recipeYield) && recipeYield > 0) {
      return Math.round(recipeYield);
    }

    if (currentRecipe) {
      return this.resolveRecipePortions(currentRecipe);
    }

    return 1;
  }

  private resolveDefaultRecipePortions(recipe: Partial<Recipe>): number {
    const recipeYield = Number(recipe.recipeYield);

    if (Number.isFinite(recipeYield) && recipeYield > 0) {
      return Math.round(recipeYield);
    }

    return 1;
  }

  private getRecipeRequestKey(recipeId: number, portions?: number): string {
    return `${recipeId}:${portions ?? 'default'}`;
  }
}
