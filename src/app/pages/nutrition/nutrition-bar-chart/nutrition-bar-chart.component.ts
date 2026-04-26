import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface BarChartEntry {
  value: number;
  date: string;
  isToday: boolean;
}

const SVG_WIDTH = 320;
const SVG_HEIGHT = 80;
const BAR_AREA_TOP = 4;
const BAR_AREA_HEIGHT = 72;

@Component({
  selector: 'app-nutrition-bar-chart',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './nutrition-bar-chart.component.html',
  styleUrl: './nutrition-bar-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NutritionBarChartComponent {
  readonly title = input.required<string>();
  readonly entries = input.required<BarChartEntry[]>();
  readonly average = input.required<number>();
  readonly unit = input<string>('g');

  protected readonly viewBox = `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`;

  protected readonly maxValue = computed(() => {
    const vals = this.entries().map((e) => e.value);
    return Math.max(...vals, 1);
  });

  protected readonly bars = computed(() => {
    const entries = this.entries();
    const max = this.maxValue();
    const count = entries.length;
    if (count === 0) return [];

    const pitch = SVG_WIDTH / count;
    const barWidth = Math.max(pitch * 0.65, 1);
    const barGap = (pitch - barWidth) / 2;

    return entries.map((entry, i) => {
      const barHeight =
        entry.value > 0
          ? Math.max((entry.value / max) * BAR_AREA_HEIGHT, 2)
          : 0;
      return {
        x: i * pitch + barGap,
        y: BAR_AREA_TOP + (BAR_AREA_HEIGHT - barHeight),
        width: barWidth,
        height: barHeight,
        isToday: entry.isToday,
        date: entry.date,
      };
    });
  });

  protected readonly averageLineY = computed(() => {
    const avg = this.average();
    const max = this.maxValue();
    if (max <= 0) return BAR_AREA_TOP + BAR_AREA_HEIGHT;
    return BAR_AREA_TOP + BAR_AREA_HEIGHT - (avg / max) * BAR_AREA_HEIGHT;
  });
}
