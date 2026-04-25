import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GroceryListService } from '../../../../../services/grocery-list.service';
import { QuickAddSuggestion } from '../grocery-quick-add.models';

@Component({
  selector: 'app-quick-add-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './quick-add-detail.component.html',
  styleUrl: './quick-add-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickAddDetailComponent {
  public readonly groceryListService = inject(GroceryListService);

  public readonly suggestion = input.required<QuickAddSuggestion>();
  public readonly form = input.required<FormGroup>();
  public readonly isAddingItem = input.required<boolean>();

  public readonly backRequested = output<void>();
  public readonly increaseAmountRequested = output<void>();
  public readonly decreaseAmountRequested = output<void>();

  public requestBack() {
    this.backRequested.emit();
  }

  public requestIncreaseAmount() {
    this.increaseAmountRequested.emit();
  }

  public requestDecreaseAmount() {
    this.decreaseAmountRequested.emit();
  }
}