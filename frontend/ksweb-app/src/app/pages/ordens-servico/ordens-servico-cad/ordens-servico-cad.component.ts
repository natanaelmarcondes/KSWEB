import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { KsButtonComponent } from '../../../shared/components/ks-button/ks-button.component';

@Component({
  selector: 'app-ordens-servico-cad',
  imports: [KsButtonComponent],
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

