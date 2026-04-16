import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { IdentityService } from './services/identity.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <app-header />
    <router-outlet />
  `,
})
export class App implements OnInit {
  private identity = inject(IdentityService);

  ngOnInit(): void {
    this.identity.initialize();
  }
}
