import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideLocalStorageTodoService } from './todo-local-storage.service';

@Component({
  selector: 'app-todo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideLocalStorageTodoService()],
  template: `<h1>ToDo with Signals</h1>`,
})
export class TodoComponent {}
