import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeaderComponent } from './components/header/header.component';
import { RecipeService } from './services/recipe.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly router = inject(Router);

  constructor() {
    inject(RecipeService);
  }

  hideNavbar = signal(false);
  title = signal('Cookbook');

  modify(event: any) {
    const currentUrl = this.router.url.split('?')[0];

    this.title.set('Cookbook');

    if (currentUrl === '/recipes') {
      this.hideNavbar.set(false);
    } else if (currentUrl === '/new-recipe') {
      this.hideNavbar.set(true);
    } else if (
      currentUrl === '/login' ||
      currentUrl === '/register'
    ) {
      this.hideNavbar.set(true);
    } else if (currentUrl.includes('recipe/')) {
      this.hideNavbar.set(true);
    } else if (currentUrl.includes('schedule')) {
      this.title.set('Schedule');
      this.hideNavbar.set(false);
    } else if (currentUrl.includes('grocery-list')) {
      this.title.set('Grocery list');
      this.hideNavbar.set(false);
    } else if (currentUrl.includes('account')) {
      this.hideNavbar.set(false);
    } else if (currentUrl.includes('household')) {
      this.hideNavbar.set(true);
    } else {
      this.hideNavbar.set(false);
    }
  }
}
