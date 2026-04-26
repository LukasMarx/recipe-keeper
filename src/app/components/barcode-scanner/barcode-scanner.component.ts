import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
  output,
  signal,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library';

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  templateUrl: './barcode-scanner.component.html',
  styleUrl: './barcode-scanner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarcodeScannerComponent implements AfterViewInit, OnDestroy {
  readonly barcodeDetected = output<string>();

  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;

  protected readonly isStarting = signal(true);
  protected readonly permissionDenied = signal(false);
  protected readonly cameraError = signal(false);
  protected readonly cameraErrorMsg = signal('');
  protected readonly scanSuccess = signal(false);

  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  private reader: BrowserMultiFormatReader | null = null;
  private lastCode = '';
  private lastCodeTime = 0;

  ngAfterViewInit(): void {
    this.startScanner();
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  private startScanner(): void {
    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    this.reader = new BrowserMultiFormatReader(hints);

    this.reader
      .decodeFromConstraints(
        { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
        this.videoRef.nativeElement,
        (result, err) => {
          if (result) {
            this.handleResult(result.getText());
          } else if (err && !(err instanceof NotFoundException)) {
            // NotFoundException is a normal "no barcode yet" – ignore it
          }
        },
      )
      .then(() => {
        this.ngZone.run(() => {
          this.isStarting.set(false);
          this.cdr.markForCheck();
        });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.ngZone.run(() => {
          this.isStarting.set(false);
          if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
            this.permissionDenied.set(true);
          } else {
            this.cameraErrorMsg.set(msg);
            this.cameraError.set(true);
          }
          this.cdr.markForCheck();
        });
      });
  }

  private handleResult(code: string): void {
    const now = Date.now();
    if (code === this.lastCode && now - this.lastCodeTime < 3000) return;
    this.lastCode = code;
    this.lastCodeTime = now;
    this.ngZone.run(() => {
      this.scanSuccess.set(true);
      setTimeout(() => this.scanSuccess.set(false), 1000);
      this.barcodeDetected.emit(code);
    });
  }

  private stopScanner(): void {
    if (this.reader) {
      BrowserMultiFormatReader.releaseAllStreams();
      this.reader = null;
    }
  }
}

