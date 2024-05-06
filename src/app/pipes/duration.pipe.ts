import { Pipe, PipeTransform } from '@angular/core';
import { formatDistanceStrict } from 'date-fns';

@Pipe({
  name: 'duration',
  standalone: true,
})
export class DurationPipe implements PipeTransform {
  transform(value: number, ...args: unknown[]): string {
    const duration = (s: number) => formatDistanceStrict(0, s * 1000);
    return duration(value);
  }
}
