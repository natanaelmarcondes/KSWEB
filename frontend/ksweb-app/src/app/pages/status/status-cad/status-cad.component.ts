import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { KsButtonComponent } from '../../../shared/components/ks-button/ks-button.component';
import { StatusForm, StatusListItem } from '../status.models';
import { StatusService } from '../status.service';

@Component({
  selector: 'app-status-cad',
  imports: [FormsModule, KsButtonComponent],
  templateUrl: './status-cad.component.html',
  styleUrl: './status-cad.component.css',
})
export class StatusCadComponent {
  form: StatusForm = this.criarForm();

  carregando = false;
  salvando = false;
  erro = '';

  private readonly statusIdParam: string | null;
  private readonly statusState: StatusListItem | null;

  constructor(
    private readonly statusService: StatusService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.statusIdParam = this.route.snapshot.paramMap.get('statusId');
    this.statusState = this.router.getCurrentNavigation()?.extras.state?.['status'] ?? history.state?.status ?? null;
    this.carregar();
  }

  get statusId(): number | null {
    if (!this.statusIdParam || this.statusIdParam === 'novo') {
      return null;
    }

    const statusId = Number(this.statusIdParam);

    return Number.isNaN(statusId) ? null : statusId;
  }

  get modoEdicao(): boolean {
    return this.statusId !== null;
  }

  get titulo(): string {
    return this.modoEdicao ? 'Alterar status' : 'Novo status';
  }

  carregar(): void {
    if (!this.modoEdicao) {
      return;
    }

    if (this.statusState?.statusId === this.statusId) {
      this.preencherForm(this.statusState);
      return;
    }

    this.carregando = true;
    this.erro = '';

    this.statusService.listar().subscribe({
      next: (response) => {
        const status = (response ?? []).find((item) => item.statusId === this.statusId);

        if (!status) {
          this.erro = 'Status nao encontrado.';
          this.carregando = false;
          return;
        }

        this.preencherForm(status);
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Nao foi possivel carregar o status.';
        this.carregando = false;
      },
    });
  }

  salvar(): void {
    if (!this.form.statusName.trim() || !this.form.internalName.trim()) {
      this.erro = 'Informe o nome do status e o nome interno.';
      return;
    }

    this.salvando = true;
    this.erro = '';

    const request = this.modoEdicao && this.statusId
      ? this.statusService.alterar(this.statusId, this.form)
      : this.statusService.criar(this.form);

    request.subscribe({
      next: () => {
        this.salvando = false;
        void this.router.navigate(['/status']);
      },
      error: () => {
        this.erro = this.modoEdicao
          ? 'Nao foi possivel alterar o status.'
          : 'Nao foi possivel cadastrar o status.';
        this.salvando = false;
      },
    });
  }

  voltar(): void {
    void this.router.navigate(['/status']);
  }

  private criarForm(): StatusForm {
    return {
      statusName: '',
      isPending: false,
      statusStopClock: false,
      statusDescription: '',
      internalName: '',
    };
  }

  private preencherForm(status: StatusListItem): void {
    this.form = {
      statusName: status.statusName ?? '',
      isPending: Boolean(status.isPending),
      statusStopClock: Boolean(status.statusStopClock),
      statusDescription: status.statusDescription ?? '',
      internalName: status.internalName ?? '',
    };
  }
}
