import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-signal-forms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<h1>Signal-Forms</h1>`,
})
export class SignalFormsComponent {}
