import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GroceryListService } from '../../../services/grocery-list.service';
import { DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'app-edit-grocery-list-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
  ],
  templateUrl: './edit-grocery-list-modal.component.html',
  styleUrl: './edit-grocery-list-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditGroceryListModalComponent {
  private readonly groyceryListService = inject(GroceryListService);
  private readonly dialogRef = inject(DialogRef);

  public form = new FormGroup({
    name: new FormControl('', Validators.required),
    plannedDate: new FormControl(new Date(), Validators.required),
  });

  public onSubmit() {
    if (this.form.valid) {
      this.groyceryListService
        .createList({
          name: this.form.value.name,
          plannedDate: new Date(
            new Date(this.form.value.plannedDate || new Date()).toDateString()
          ),
          householdId: 1,
        })
        .subscribe(() => {
          this.dialogRef.close();
        });
    }
  }
}
