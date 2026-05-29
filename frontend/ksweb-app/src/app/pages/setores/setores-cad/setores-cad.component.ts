import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { KsButtonComponent } from '../../../shared/components/ks-button/ks-button.component';
import { SetorForm, SetorListItem } from '../setores.models';

@Component({
  selector: 'app-setores-cad',
  imports: [FormsModule, KsButtonComponent],
  templateUrl: './setores-cad.component.html',
  styleUrl: './setores-cad.component.css',
})
export class SetoresCadComponent {
  form: SetorForm = {
    queueName: '',
  };

  carregando = false;
  salvando = false;
  erro = '';

  private readonly queueIdParam: string | null;
  private readonly setorState: SetorListItem | null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.queueIdParam = this.route.snapshot.paramMap.get('queueId');
    this.setorState = this.router.getCurrentNavigation()?.extras.state?.['setor'] ?? history.state?.setor ?? null;
    this.carregar();
  }

  get modoEdicao(): boolean {
    return this.queueId !== null;
  }

  get queueId(): number | null {
    if (!this.queueIdParam || this.queueIdParam === 'novo') {
      return null;
    }

    const queueId = Number(this.queueIdParam);

    return Number.isNaN(queueId) ? null : queueId;
  }

  get titulo(): string {
    return this.modoEdicao ? 'Alterar setor' : 'Novo setor';
  }

  carregar(): void {
    if (!this.modoEdicao) {
      return;
    }

    this.erro = '';
    this.carregando = false;

    if (this.setorState?.queueId === this.queueId) {
      this.form = {
        queueName: this.setorState.queueName ?? '',
      };
    }
  }

  salvar(): void {
    if (!this.form.queueName?.trim()) {
      this.erro = 'Informe o nome do setor.';
      return;
    }

    this.salvando = true;
    this.erro = '';
    this.salvando = false;
    void this.router.navigate(['/setores']);
  }

  voltar(): void {
    void this.router.navigate(['/setores']);
  }

}
