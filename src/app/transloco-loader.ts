import { inject, Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { from, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  getTranslation(lang: string) {
    return from(fetch(`/assets/i18n/${lang}.json`).then((x) => x.json())).pipe(
      shareReplay(1)
    );
  }
}
