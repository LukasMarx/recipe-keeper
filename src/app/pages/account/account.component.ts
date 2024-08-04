import { Component, inject, OnInit, signal } from '@angular/core';
import { UserService } from '../../services/user.service';
import { HouseholdService } from '../../services/household.service';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  imports: [
    TranslocoPipe,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatRippleModule,
    RouterModule,
  ],
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly householdService = inject(HouseholdService);
  public user = signal<any>(undefined);
  public households = signal<any>(undefined);

  constructor() {}

  ngOnInit() {
    this.userService.get().subscribe((user) => {
      this.user.set(user);
    });
    this.householdService.getAll().subscribe((household) => {
      this.households.set(household);
    });
  }
}
