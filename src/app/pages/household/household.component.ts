import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { Household, HouseholdService } from '../../services/household.service';
import { MatDialog } from '@angular/material/dialog';
import { EditHouseholdModalComponent } from '../../components/modals/edit-household-modal/edit-household-modal.component';
import { UserService } from '../../services/user.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { InviteModalComponent } from '../../components/modals/invite-modal/invite-modal.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  standalone: true,
  imports: [
    TranslocoPipe,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
    MatMenuModule,
    MatSnackBarModule,
  ],
  selector: 'app-household',
  templateUrl: './household.component.html',
  styleUrls: ['./household.component.scss'],
})
export class HouseholdComponent implements OnInit {
  private readonly location = inject(Location);
  private readonly dialogService = inject(MatDialog);
  private readonly householdService = inject(HouseholdService);
  private readonly userService = inject(UserService);
  private readonly snackbar = inject(MatSnackBar);

  public households = signal<Household[] | undefined>(undefined);

  public selectedHouseholdId = signal<number | undefined>(undefined);

  public household = computed(() =>
    this.households()?.find(
      (household) => household.id === this.selectedHouseholdId()
    )
  );

  constructor() {}

  ngOnInit() {
    this.householdService.getAll().subscribe((households) => {
      this.households.set(households);
    });
    this.userService.get().subscribe((user) => {
      this.selectedHouseholdId.set(user.activeHouseholdId);
    });
  }

  onAdd() {
    this.dialogService.open(EditHouseholdModalComponent);
  }

  onBack() {
    this.location.back();
  }

  onSelectionChange(selection: MatSelectionListChange) {
    this.userService.setHouseholdId(selection.options[0].value).subscribe();
    this.selectedHouseholdId.set(selection.options[0].value);
  }

  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onInvite() {
    const ref = this.dialogService.open(InviteModalComponent, {
      data: {
        householdId: this.household()?.id,
      },
    });
    ref.afterClosed().subscribe((householdInviteId) => {
      const ref = this.snackbar.open(`Code: ${householdInviteId}`, 'Copy');
      ref.onAction().subscribe(() => {
        window.navigator.clipboard.writeText(householdInviteId);
      });
    });
  }
}
