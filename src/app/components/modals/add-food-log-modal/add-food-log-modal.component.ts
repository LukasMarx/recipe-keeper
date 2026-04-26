import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TitleCasePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import { format } from 'date-fns';
import {
  FoodLogService,
  FoodProduct,
  FoodLogMealType,
  FoodProductImageUpdatedEvent,
} from '../../../services/food-log.service';
import { BarcodeScannerComponent } from '../../barcode-scanner/barcode-scanner.component';

@Component({
  selector: 'app-add-food-log-modal',
  standalone: true,
  imports: [
    FormsModule,
    TitleCasePipe,
    DecimalPipe,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    BarcodeScannerComponent,
  ],
  templateUrl: './add-food-log-modal.component.html',
  styleUrl: './add-food-log-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFoodLogModalComponent {
  private readonly dialogRef = inject(MatDialogRef<AddFoodLogModalComponent>);
  private readonly foodLogService = inject(FoodLogService);

  protected readonly mealTypes: FoodLogMealType[] = [
    'BREAKFAST',
    'LUNCH',
    'DINNER',
    'SNACK',
    'OTHER',
  ];

  protected readonly searchMode = signal<'name' | 'barcode'>('name');
  protected readonly searchQuery = signal('');
  protected readonly searchResults = signal<FoodProduct[]>([]);
  protected readonly selectedProduct = signal<FoodProduct | null>(null);
  protected readonly isSearching = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly amountInGrams = signal(100);
  protected readonly mealType = signal<FoodLogMealType>('SNACK');
  protected readonly scannerActive = computed(
    () => this.searchMode() === 'barcode' && !this.selectedProduct(),
  );

  private lastScannedCode = '';

  protected readonly calculatedCalories = computed(() => {
    const product = this.selectedProduct();
    if (!product?.nutrition?.calories) return 0;
    return Math.round((product.nutrition.calories / 100) * this.amountInGrams());
  });

  private readonly nameSearch$ = new Subject<string>();

  constructor() {
    this.nameSearch$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((q) => {
          if (!q.trim()) {
            this.searchResults.set([]);
            this.isSearching.set(false);
            return of([]);
          }
          this.isSearching.set(true);
          return this.foodLogService.searchProducts(q).pipe(catchError(() => of([])));
        }),
        takeUntilDestroyed(),
      )
      .subscribe((results) => {
        this.searchResults.set(results);
        this.isSearching.set(false);
      });

    this.foodLogService.foodProductImageUpdated$
      .pipe(takeUntilDestroyed())
      .subscribe((event: FoodProductImageUpdatedEvent) => {
        const current = this.selectedProduct();
        if (current && current.id === event.foodProductId) {
          this.selectedProduct.set({ ...current, imageUrl: event.imageUrl });
        }
      });
  }

  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.nameSearch$.next(value);
  }

  protected onBarcodeScan(code: string): void {
    if (this.isSearching() || code === this.lastScannedCode) return;
    this.lastScannedCode = code;
    this.isSearching.set(true);
    this.error.set(null);
    this.foodLogService.getProductByBarcode(code).subscribe({
      next: (product) => {
        this.selectProduct(product);
        this.isSearching.set(false);
      },
      error: () => {
        this.error.set('Product not found for this barcode.');
        this.isSearching.set(false);
        this.lastScannedCode = '';
      },
    });
  }

  protected selectProduct(product: FoodProduct): void {
    this.selectedProduct.set(product);
    const serving = product.servingSize > 0 ? product.servingSize : 100;
    this.amountInGrams.set(serving);
    this.searchResults.set([]);
    this.searchQuery.set('');
    this.error.set(null);
  }

  protected clearProduct(): void {
    this.selectedProduct.set(null);
    this.amountInGrams.set(100);
    this.lastScannedCode = '';
  }

  protected save(): void {
    const product = this.selectedProduct();
    const amount = this.amountInGrams();
    if (!product || amount < 0.1) return;

    this.isSaving.set(true);
    this.error.set(null);

    this.foodLogService
      .createFoodLog({
        foodProductId: product.id,
        date: format(new Date(), 'yyyy-MM-dd'),
        mealType: this.mealType(),
        amountInGrams: amount,
      })
      .subscribe({
        next: (log) => this.dialogRef.close(log),
        error: () => {
          this.error.set('Could not save. Please try again.');
          this.isSaving.set(false);
        },
      });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
