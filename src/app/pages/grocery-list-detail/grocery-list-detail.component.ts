import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-grocery-list-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grocery-list-detail.component.html',
  styleUrl: './grocery-list-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroceryListDetailComponent {}
