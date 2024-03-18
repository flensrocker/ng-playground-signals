import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-paginator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatPaginatorModule],
  template: `<mat-paginator
    [pageSizeOptions]="pageSizeOptions()"
    [length]="length()"
    [pageIndex]="pageIndex()"
    [pageSize]="pageSize()"
    (page)="page($event)"
  />`,
})
export class PaginatorComponent {
  readonly pageSizeOptions = input<readonly number[]>([10, 20, 50, 100]);
  readonly length = input.required<number>();

  readonly pageIndex = model.required<number>();
  readonly pageSize = model.required<number>();

  page(pageEvent: PageEvent): void {
    this.pageIndex.set(pageEvent.pageIndex);
    this.pageSize.set(pageEvent.pageSize);
  }
}
