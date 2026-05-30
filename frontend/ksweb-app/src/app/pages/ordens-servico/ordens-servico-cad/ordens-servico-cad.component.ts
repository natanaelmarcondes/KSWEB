import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-ordens-servico-cad',
  imports: [ButtonComponent],
  templateUrl: './ordens-servico-cad.component.html',
  styleUrl: './ordens-servico-cad.component.css',
})
export class OrdensServicoCadComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly codigo = Number(this.route.snapshot.paramMap.get('codigo') ?? 0);

  voltar(): void {
    void this.router.navigate(['/ordens-servico']);
  }
}

