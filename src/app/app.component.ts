import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly router = inject(Router);

  hideHeader = signal(false);
  hideNavbar = signal(false);

  modify() {
    if (this.router.url.split('?')[0] === '/new-recipe') {
      this.hideHeader.set(true);
      this.hideNavbar.set(true);
    } else if (
      this.router.url === '/login' ||
      this.router.url === '/register'
    ) {
      this.hideHeader.set(true);
      this.hideNavbar.set(true);
    } else if (this.router.url.includes('recipe/')) {
      this.hideHeader.set(true);
      this.hideNavbar.set(true);
    } else {
      this.hideHeader.set(false);
      this.hideNavbar.set(false);
    }
  }
}
