import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { HouseholdService } from '../../../services/household.service';
import { DIALOG_DATA } from '@angular/cdk/dialog';

@Component({
  selector: 'app-invite-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInput,
    MatFormFieldModule,
    MatDialogModule,
    MatButtonModule,
  ],
  templateUrl: './invite-modal.component.html',
  styleUrl: './invite-modal.component.scss',
})
export class InviteModalComponent {
  private readonly householdService = inject(HouseholdService);
  private readonly dialogRef = inject(MatDialogRef);
  private readonly data = inject(DIALOG_DATA);

  public form = new FormGroup({
    name: new FormControl('', Validators.required),
  });

  constructor() {}

  ngOnInit() {}

  onSubmit() {
    if (this.form.valid) {
      this.householdService
        .invite({
          recipientName: this.form.value.name!,
          householdId: this.data.householdId,
        })
        .subscribe((householdInvite: any) => {
          this.dialogRef.close(householdInvite.id);
        });
    }
  }
}
