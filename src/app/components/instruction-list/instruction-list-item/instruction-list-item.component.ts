import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Instruction } from '../../../interfaces/instruction';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-instruction-list-item',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  templateUrl: './instruction-list-item.component.html',
  styleUrl: './instruction-list-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructionListItemComponent {
  public stepIndex = input<number>();
  public instruction = input<Instruction>();
}
