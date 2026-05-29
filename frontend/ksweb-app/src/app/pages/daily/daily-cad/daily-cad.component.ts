import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { KsButtonComponent } from '../../../shared/components/ks-button/ks-button.component';
import { DailyForm, DailyRegistro, DailyRegistroForm } from '../daily.models';
import { DailyService } from '../daily.service';

@Component({
  selector: 'app-daily-cad',
  imports: [FormsModule, KsButtonComponent],
  templateUrl: './daily-cad.component.html',
  styleUrl: './daily-cad.component.css',
})
export class DailyCadComponent {
  daily: DailyForm | null = null;
  registros: DailyRegistro[] = [];
  form: DailyRegistroForm = this.criarRegistroForm();
  registroEditandoId: number | null = null;

  carregando = true;
  salvando = false;
  excluindoId: number | null = null;
  erro = '';

  private readonly dailyId: number;

  constructor(
    private readonly dailyService: DailyService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.dailyId = Number(this.route.snapshot.paramMap.get('dailyId'));
    this.carregar();
  }

  get titulo(): string {
    return `Daily Nº ${this.daily?.dailyNumero ?? this.dailyId}`;
  }

  get modoEdicao(): boolean {
    return this.registroEditandoId !== null;
  }

  carregar(): void {
    if (!this.dailyId || Number.isNaN(this.dailyId)) {
      this.erro = 'Daily invalida.';
      this.carregando = false;
      return;
    }

    this.carregando = true;
    this.erro = '';

    this.dailyService.obter(this.dailyId).subscribe({
      next: (daily) => {
        this.daily = daily;
      },
      error: () => {
        this.daily = null;
      },
    });

    this.dailyService.listarRegistros(this.dailyId).subscribe({
      next: (response) => {
        this.registros = response.items ?? [];
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Nao foi possivel carregar os itens da daily.';
        this.registros = [];
        this.carregando = false;
      },
    });
  }

  salvarRegistro(): void {
    if (!this.form.regData || !this.form.regCliente?.trim() || !this.form.regDescricao?.trim() || !this.form.regStatus?.trim()) {
      this.erro = 'Informe data, cliente, descricao e status.';
      return;
    }

    this.salvando = true;
    this.erro = '';

    const request = this.modoEdicao && this.registroEditandoId
      ? this.dailyService.alterarRegistro(this.dailyId, this.registroEditandoId, this.form)
      : this.dailyService.adicionarRegistro(this.dailyId, this.form);

    request.subscribe({
      next: () => {
        this.salvando = false;
        this.cancelarEdicao();
        this.carregarRegistros();
      },
      error: () => {
        this.erro = this.modoEdicao
          ? 'Nao foi possivel alterar o item.'
          : 'Nao foi possivel adicionar o item.';
        this.salvando = false;
      },
    });
  }

  editarRegistro(registro: DailyRegistro): void {
    this.registroEditandoId = registro.regId;
    this.form = {
      regData: this.paraInputDate(registro.regData),
      osId: registro.osId,
      regCliente: registro.regCliente ?? '',
      regDescricao: registro.regDescricao ?? '',
      regStatus: registro.regStatus ?? '',
    };
  }

  excluirRegistro(registro: DailyRegistro): void {
    const confirmar = window.confirm('Excluir este item da daily?');

    if (!confirmar) {
      return;
    }

    this.excluindoId = registro.regId;
    this.erro = '';

    this.dailyService.excluirRegistro(this.dailyId, registro.regId).subscribe({
      next: () => {
        this.excluindoId = null;

        if (this.registroEditandoId === registro.regId) {
          this.cancelarEdicao();
        }

        this.carregarRegistros();
      },
      error: () => {
        this.erro = 'Nao foi possivel excluir o item.';
        this.excluindoId = null;
      },
    });
  }

  cancelarEdicao(): void {
    this.registroEditandoId = null;
    this.form = this.criarRegistroForm();
  }

  voltar(): void {
    void this.router.navigate(['/daily']);
  }

  formatarData(valor: string | null | undefined): string {
    const data = this.criarData(valor);

    if (!data) {
      return '-';
    }

    return new Intl.DateTimeFormat('pt-BR').format(data);
  }

  private carregarRegistros(): void {
    this.dailyService.listarRegistros(this.dailyId).subscribe({
      next: (response) => {
        this.registros = response.items ?? [];
      },
      error: () => {
        this.erro = 'Nao foi possivel atualizar os itens da daily.';
        this.registros = [];
      },
    });
  }

  private criarRegistroForm(): DailyRegistroForm {
    return {
      regData: this.paraInputDate(new Date().toISOString()),
      osId: null,
      regCliente: '',
      regDescricao: '',
      regStatus: '',
    };
  }

  private paraInputDate(valor: string | null | undefined): string {
    const data = this.criarData(valor);

    if (!data) {
      return '';
    }

    const offset = data.getTimezoneOffset();
    const local = new Date(data.getTime() - offset * 60000);

    return local.toISOString().slice(0, 10);
  }

  private criarData(valor: string | null | undefined): Date | null {
    if (!valor) {
      return null;
    }

    const data = new Date(valor.length === 10 ? `${valor}T00:00:00` : valor);

    if (Number.isNaN(data.getTime())) {
      return null;
    }

    return data;
  }
}
