import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  title = input<string>('Cookbook');
  eyebrow = input<string | null>(null);
  subtitle = input<string | null>(null);
  actionLabel = input<string | null>(null);
  actionIcon = input<string | null>(null);
  actionAriaLabel = input<string | null>(null);
  actionDisabled = input(false);
  sticky = input(false);
  showLogo = input(false);
  logoSrc = input('logo_small.png');
  logoAlt = input('');

  actionTriggered = output<void>();

  onActionTriggered() {
    this.actionTriggered.emit();
  }
}
