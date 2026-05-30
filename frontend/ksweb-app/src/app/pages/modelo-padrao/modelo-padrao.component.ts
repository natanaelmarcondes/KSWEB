import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { KsButtonComponent } from '../../shared/components/ks-button/ks-button.component';
import { KsCardComponent } from '../../shared/components/ks-card/ks-card.component';
import { KsGridComponent } from '../../shared/components/ks-grid/ks-grid.component';
import { KsInputComponent } from '../../shared/components/ks-input/ks-input.component';
import { KsStatusComponent } from '../../shared/components/ks-status/ks-status.component';
import { KsToolbarComponent } from '../../shared/components/ks-toolbar/ks-toolbar.component';

interface ClienteModelo {
  cliId: number;
  cliNome: string;
  cliCpfCnpj: string;
  cliEmail: string;
  cliTelefone: string;
  cliCidade: string;
  cliUf: string;
  cliAtivo: boolean;
}

@Component({
  selector: 'app-modelo-padrao',
  imports: [
    ReactiveFormsModule,
    KsButtonComponent,
    KsCardComponent,
    KsGridComponent,
    KsInputComponent,
    KsStatusComponent,
    KsToolbarComponent,
  ],
  templateUrl: './modelo-padrao.component.html',
  styleUrl: './modelo-padrao.component.css',
})
export class ModeloPadraoComponent {
  private readonly formBuilder = inject(FormBuilder);

  clienteSelecionadoId: number | null = null;
  carregando = false;
  mensagem = '';

  readonly form = this.formBuilder.nonNullable.group({
    cliNome: ['Keysystems Informatica', Validators.required],
    cliCpfCnpj: ['12.345.678/0001-90'],
    cliEmail: ['contato@keysystems.com.br', Validators.email],
    cliTelefone: ['(11) 3000-0000'],
    cliCidade: ['Sao Paulo'],
    cliUf: ['SP'],
    cliAtivo: [true],
  });

  readonly clientes: ClienteModelo[] = [
    {
      cliId: 1001,
      cliNome: 'Keysystems Informatica',
      cliCpfCnpj: '12.345.678/0001-90',
      cliEmail: 'contato@keysystems.com.br',
      cliTelefone: '(11) 3000-0000',
      cliCidade: 'Sao Paulo',
      cliUf: 'SP',
      cliAtivo: true,
    },
    {
      cliId: 1002,
      cliNome: 'Cliente Modelo Norte',
      cliCpfCnpj: '123.456.789-00',
      cliEmail: 'norte@cliente.com.br',
      cliTelefone: '(21) 98888-1002',
      cliCidade: 'Rio de Janeiro',
      cliUf: 'RJ',
      cliAtivo: true,
    },
    {
      cliId: 1003,
      cliNome: 'Cliente Modelo Sul',
      cliCpfCnpj: '98.765.432/0001-10',
      cliEmail: 'sul@cliente.com.br',
      cliTelefone: '(51) 3222-1003',
      cliCidade: 'Porto Alegre',
      cliUf: 'RS',
      cliAtivo: false,
    },
    {
      cliId: 1004,
      cliNome: 'Cliente Modelo Centro',
      cliCpfCnpj: '11.222.333/0001-44',
      cliEmail: 'centro@cliente.com.br',
      cliTelefone: '(62) 3222-1004',
      cliCidade: 'Goiania',
      cliUf: 'GO',
      cliAtivo: true,
    },
  ];

  salvar(): void {
    this.form.markAllAsTouched();
    this.mensagem = this.clienteSelecionadoId === null ? 'Cliente incluido no modelo.' : 'Cliente alterado no modelo.';
  }

  limparFormulario(): void {
    this.clienteSelecionadoId = null;
    this.mensagem = '';
    this.form.reset({
      cliNome: '',
      cliCpfCnpj: '',
      cliEmail: '',
      cliTelefone: '',
      cliCidade: '',
      cliUf: '',
      cliAtivo: true,
    });
  }

  editar(cliente: ClienteModelo): void {
    this.clienteSelecionadoId = cliente.cliId;
    this.mensagem = '';
    this.form.setValue({
      cliNome: cliente.cliNome,
      cliCpfCnpj: cliente.cliCpfCnpj,
      cliEmail: cliente.cliEmail,
      cliTelefone: cliente.cliTelefone,
      cliCidade: cliente.cliCidade,
      cliUf: cliente.cliUf,
      cliAtivo: cliente.cliAtivo,
    });
  }

  excluir(cliente: ClienteModelo): void {
    this.mensagem = `Exclusao modelo: ${cliente.cliNome}.`;
  }
}
