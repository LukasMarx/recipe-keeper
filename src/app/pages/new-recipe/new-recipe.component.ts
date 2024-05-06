import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatIconModule } from '@angular/material/icon';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { RecipeService } from '../../services/recipe.service';

import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-new-recipe',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    CdkTextareaAutosize,
    ReactiveFormsModule,
    MatListModule,
  ],
  templateUrl: './new-recipe.component.html',
  styleUrl: './new-recipe.component.scss',
})
export class NewRecipeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);
  private readonly snackbar = inject(MatSnackBar);

  public form = new FormGroup({
    title: new FormControl('', Validators.required),
    description: new FormControl(''),
    imageUrl: new FormControl(''),
    keywords: new FormControl([]),
    recipeYield: new FormControl(1),
    calories: new FormControl(),
    ingredients: new FormControl([]),
    instructions: new FormControl<any[]>([]),
    prepTime: new FormControl(),
    cookTime: new FormControl(),
    totalTime: new FormControl(),
    videoThumbnailUrl: new FormControl(),
    videoUrl: new FormControl(),
    sourceUrl: new FormControl(),
  });

  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const recipeJSON = params.get('recipe');
      if (recipeJSON) {
        const recipe = JSON.parse(recipeJSON);
        console.log(recipe);
        this.form.patchValue(recipe);
      }
    });
  }

  removeKeyword(keyword: string) {
    // const index = this.keywords.indexOf(keyword);
    // if (index >= 0) {
    //   this.keywords.splice(index, 1);
    //   this.announcer.announce(`removed ${keyword}`);
    // }
  }

  addKeyword(event: MatChipInputEvent): void {
    // const value = (event.value || '').trim();
    // // Add our keyword
    // if (value) {
    //   this.keywords.push(value);
    // }
    // // Clear the input value
    // event.chipInput!.clear();
  }

  onSave() {
    if (this.form.valid)
      this.recipeService.postRecipe(this.form.value).subscribe(() => {
        this.snackbar.open('Recipe saved sucessfully', undefined, {
          verticalPosition: 'top',
          duration: 3000,
        });
        this.router.navigate(['']);
      });
  }
}
