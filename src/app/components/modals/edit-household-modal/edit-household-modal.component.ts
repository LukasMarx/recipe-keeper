import { Component, inject, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { HouseholdService } from '../../../services/household.service';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInput,
    MatFormFieldModule,
    MatDialogModule,
    MatButtonModule,
    TranslocoPipe,
  ],
  selector: 'app-edit-household-modal',
  templateUrl: './edit-household-modal.component.html',
  styleUrls: ['./edit-household-modal.component.scss'],
})
export class EditHouseholdModalComponent implements OnInit {
  private readonly householdService = inject(HouseholdService);
  private readonly dialogRef = inject(MatDialogRef);
  private readonly data = inject<{ id: number; name: string }>(
    MAT_DIALOG_DATA,
    { optional: true }
  );

  public form = new FormGroup({
    name: new FormControl('', Validators.required),
  });

  public get isEditMode(): boolean {
    return !!this.data;
  }

  constructor() {}

  ngOnInit() {
    if (this.data) {
      this.form.patchValue({ name: this.data.name });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      if (this.data) {
        this.householdService
          .edit({ id: this.data.id, name: this.form.value.name! })
          .subscribe(() => {
            this.dialogRef.close();
          });
      } else {
        this.householdService
          .add({ name: this.form.value.name! })
          .subscribe(() => {
            this.dialogRef.close();
          });
      }
    }
  }
}
