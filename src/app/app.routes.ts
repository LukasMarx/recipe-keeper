import { Routes } from '@angular/router';
import { NewRecipeComponent } from './pages/new-recipe/new-recipe.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { RecipeDetailComponent } from './pages/recipe-detail/recipe-detail.component';
import { ScheduleComponent } from './pages/schedule/schedule.component';
import { GroceryListComponent } from './pages/grocery-list/grocery-list.component';
import { AccountComponent } from './pages/account/account.component';
import { HouseholdComponent } from './pages/household/household.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/recipes',
    pathMatch: 'full',
  },
  {
    path: 'recipes',
    component: HomeComponent,
  },
  {
    path: 'schedule',
    component: ScheduleComponent,
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'recipe/:id',
    component: RecipeDetailComponent,
  },
  {
    path: 'new-recipe',
    component: NewRecipeComponent,
  },
  {
    path: 'edit-recipe/:id',
    component: NewRecipeComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'grocery-list',
    component: GroceryListComponent,
  },
  {
    path: 'account',
    component: AccountComponent,
  },
  {
    path: 'household',
    component: HouseholdComponent,
  },
];
