import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Instruction } from '../../interfaces/instruction';
import { InstructionListItemComponent } from './instruction-list-item/instruction-list-item.component';

@Component({
  selector: 'app-instruction-list',
  standalone: true,
  imports: [CommonModule, InstructionListItemComponent],
  templateUrl: './instruction-list.component.html',
  styleUrl: './instruction-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructionListComponent {
  public instructions = input<Instruction[]>();
}
