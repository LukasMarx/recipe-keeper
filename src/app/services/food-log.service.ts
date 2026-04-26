import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export type FoodLogMealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'OTHER';

export interface FoodProductImageUpdatedEvent {
  foodProductId: number;
  imageUrl: string;
}

export interface FoodProductNutrition {
  calories: number;
  protein: number | null;
  totalFat: number | null;
  totalCarbohydrates: number | null;
  sugars: number | null;
  saturatedFat: number | null;
  sodium: number | null;
}

export interface FoodProduct {
  id: number;
  barcode: string | null;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  imageSource: 'NONE' | 'OFF' | 'AI_GENERATED';
  servingSize: number;
  servingName: string | null;
  nutriScore: string | null;
  novaGroup: number | null;
  allergens: string[];
  ingredientsText: string | null;
  nutrition: FoodProductNutrition | null;
}

export interface FoodLog {
  id: number;
  foodProductId: number;
  foodProductName: string;
  brand: string | null;
  imageUrl: string | null;
  date: string;
  mealType: FoodLogMealType;
  amountInGrams: number;
  caloriesTotal: number;
  nutrition: {
    calories: number;
    protein: number | null;
    totalFat: number | null;
    totalCarbohydrates: number | null;
  };
}

export interface CreateFoodLogDto {
  foodProductId: number;
  date: string;
  mealType: FoodLogMealType;
  amountInGrams: number;
}

@Injectable({ providedIn: 'root' })
export class FoodLogService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private socket?: Socket;
  private activeSocketToken: string | null = null;

  private readonly _foodProductImageUpdated$ = new Subject<FoodProductImageUpdatedEvent>();
  public readonly foodProductImageUpdated$ = this._foodProductImageUpdated$.asObservable();

  constructor() {
    this.authService.accessToken$.subscribe((accessToken) => {
      this.syncSocketConnection(accessToken);
    });
  }

  private syncSocketConnection(accessToken: string | null): void {
    if (!accessToken) {
      this.disconnectSocket();
      return;
    }

    if (this.socket && this.activeSocketToken === accessToken) {
      if (!this.socket.connected) {
        this.socket.auth = { token: accessToken };
        this.socket.connect();
      }
      return;
    }

    this.disconnectSocket();
    this.activeSocketToken = accessToken;
    this.socket = io(this.getSocketOrigin(), {
      auth: { token: accessToken },
      autoConnect: true,
    });

    this.socket.on('food-product:image-updated', (event: FoodProductImageUpdatedEvent) => {
      this._foodProductImageUpdated$.next(event);
    });
  }

  private disconnectSocket(): void {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = undefined;
    this.activeSocketToken = null;
  }

  private getSocketOrigin(): string {
    const originUrl = new URL(environment.origin);
    return originUrl.origin;
  }

  searchProducts(q: string, limit = 10) {
    const params = new HttpParams().set('q', q).set('limit', limit.toString());
    return this.http.get<FoodProduct[]>('food-products/search', { params });
  }

  getProductByBarcode(barcode: string) {
    return this.http.get<FoodProduct>(`food-products/barcode/${encodeURIComponent(barcode)}`);
  }

  getFoodLogs(date?: string) {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<FoodLog[]>('food-logs', { params });
  }

  createFoodLog(dto: CreateFoodLogDto) {
    return this.http.post<FoodLog>('food-logs', dto);
  }

  deleteFoodLog(id: number) {
    return this.http.delete<void>(`food-logs/${id}`);
  }
}
