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
  title = signal('Cookbook');

  modify(event: any) {
    const currentUrl = this.router.url.split('?')[0];

    this.title.set('Cookbook');

    if (currentUrl === '/recipes') {
      this.hideHeader.set(true);
      this.hideNavbar.set(false);
    } else if (currentUrl === '/new-recipe') {
      this.hideHeader.set(true);
      this.hideNavbar.set(true);
    } else if (
      currentUrl === '/login' ||
      currentUrl === '/register'
    ) {
      this.hideHeader.set(true);
      this.hideNavbar.set(true);
    } else if (currentUrl.includes('recipe/')) {
      this.hideHeader.set(true);
      this.hideNavbar.set(true);
    } else if (currentUrl.includes('schedule')) {
      this.title.set('Schedule');
      this.hideHeader.set(true);
      this.hideNavbar.set(false);
    } else if (currentUrl.includes('grocery-list')) {
      this.title.set('Grocery list');
      this.hideHeader.set(true);
      this.hideNavbar.set(false);
    } else if (currentUrl.includes('account')) {
      this.hideHeader.set(true);
      this.hideNavbar.set(false);
    } else if (currentUrl.includes('household')) {
      this.hideHeader.set(true);
      this.hideNavbar.set(true);
    } else {
      this.hideHeader.set(false);
      this.hideNavbar.set(false);
    }
  }
}
