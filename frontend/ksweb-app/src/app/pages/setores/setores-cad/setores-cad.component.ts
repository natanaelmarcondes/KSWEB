import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { KsButtonComponent } from '../../../shared/components/ks-button/ks-button.component';
import { SetorForm, SetorListItem } from '../setores.models';
import { SetoresService } from '../setores.service';

@Component({
  selector: 'app-setores-cad',
  imports: [FormsModule, KsButtonComponent],
  templateUrl: './setores-cad.component.html',
  styleUrl: './setores-cad.component.css',
})
export class SetoresCadComponent {
  setores: SetorListItem[] = [];
  form: SetorForm = {
    queueName: '',
  };

  carregando = false;
  salvando = false;
  erro = '';

  private readonly queueIdParam: string | null;

  constructor(
    private readonly setoresService: SetoresService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.queueIdParam = this.route.snapshot.paramMap.get('queueId');
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

    this.carregando = true;
    this.erro = '';

    this.setoresService.listar().subscribe({
      next: (response) => {
        this.setores = response ?? [];
        const setor = this.setores.find((item) => item.queueId === this.queueId);

        if (!setor) {
          this.erro = 'Setor nao encontrado.';
          this.carregando = false;
          return;
        }

        this.form = {
          queueName: setor.queueName ?? '',
        };
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Nao foi possivel carregar o setor.';
        this.carregando = false;
      },
    });
  }

  salvar(): void {
    if (!this.form.queueName?.trim()) {
      this.erro = 'Informe o nome do setor.';
      return;
    }

    this.salvando = true;
    this.erro = '';

    const request = this.modoEdicao && this.queueId
      ? this.setoresService.alterar(this.queueId, this.form)
      : this.setoresService.criar(this.form);

    request.subscribe({
      next: () => {
        this.salvando = false;
        void this.router.navigate(['/setores']);
      },
      error: () => {
        this.erro = this.modoEdicao
          ? 'Nao foi possivel alterar o setor.'
          : 'Nao foi possivel cadastrar o setor.';
        this.salvando = false;
      },
    });
  }

  voltar(): void {
    void this.router.navigate(['/setores']);
  }

}
