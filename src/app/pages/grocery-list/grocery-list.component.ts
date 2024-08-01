import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { GroceryListItem } from '../../interfaces/grocery-list-item';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DialogModule } from '@angular/cdk/dialog';
import { MatDialog } from '@angular/material/dialog';
import { EditGroceryListModalComponent } from '../../components/modals/edit-grocery-list-modal/edit-grocery-list-modal.component';
import {
  GroceryList,
  GroceryListService,
} from '../../services/grocery-list.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { groupBy } from 'lodash';

@Component({
  selector: 'app-grocery-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatRippleModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    DialogModule,
    ReactiveFormsModule,
  ],
  templateUrl: './grocery-list.component.html',
  styleUrl: './grocery-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroceryListComponent {
  private readonly dialog = inject(MatDialog);
  public readonly groceryListService = inject(GroceryListService);
  public footer = viewChild<ElementRef>('footer');
  public lists = signal<GroceryList[]>([]);
  public suggestions = signal<string[]>([]);

  public isFooterActive = signal(false);

  public searchControl = new FormControl('');

  public listItems = computed(() => {
    return groupBy(
      this.lists().at(0)?.items || [],
      (x) => x.recipeIngredient.ingredient.category
    );
  });

  public groups = computed(() => {
    return Object.keys(this.listItems());
  });

  constructor() {
    this.groceryListService.getLists().subscribe((lists) => {
      this.lists.set(lists);
    });

    this.searchControl.valueChanges.subscribe((value) => {
      if (value && value.length > 2) {
        const newSuggestions: string[] = [...this.suggestions()];
        newSuggestions[0] = value;
        newSuggestions[1] = value;
        newSuggestions[2] = value;
        this.suggestions.set(newSuggestions);
      } else {
        this.suggestions.set([]);
      }
    });
  }

  public onCancel(event: MouseEvent) {
    event.stopPropagation();
    this.isFooterActive.set(false);
    this.suggestions.set([]);
  }

  public onAddList() {
    this.dialog.open(EditGroceryListModalComponent);
  }

  public onSuggestionClick(_t58: string) {
    throw new Error('Method not implemented.');
  }
}
