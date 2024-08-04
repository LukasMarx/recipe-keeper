import { Component, inject, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { HouseholdService } from '../../../services/household.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInput,
    MatFormFieldModule,
    MatDialogModule,
    MatButtonModule,
  ],
  selector: 'app-edit-household-modal',
  templateUrl: './edit-household-modal.component.html',
  styleUrls: ['./edit-household-modal.component.scss'],
})
export class EditHouseholdModalComponent implements OnInit {
  private readonly householdService = inject(HouseholdService);
  private readonly dialogRef = inject(MatDialogRef);

  public form = new FormGroup({
    name: new FormControl('', Validators.required),
  });

  constructor() {}

  ngOnInit() {}

  onSubmit() {
    if (this.form.valid) {
      this.householdService
        .add({ name: this.form.value.name! })
        .subscribe(() => {
          this.dialogRef.close();
        });
    }
  }
}
