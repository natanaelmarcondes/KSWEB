import { Component, Directive, Input, Output, EventEmitter, TemplateRef, ContentChildren, QueryList, AfterContentInit } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { AgGridAngular, ICellRendererAngularComp } from 'ag-grid-angular';
import { RowStyleModule, ClientSideRowModelModule, TextFilterModule, NumberFilterModule, DateFilterModule, ColDef, ICellRendererParams, themeQuartz, CellKeyDownEvent, FullWidthCellKeyDownEvent, RowClassParams, RowClickedEvent } from 'ag-grid-community';

@Directive({ selector: 'ng-template[ksColumn]', standalone: true })
export class KsColumnDirective {
  @Input() ksColumn = '';
  @Input() field = '';
  @Input() minWidth = 120;
  constructor(readonly template: TemplateRef<unknown>) {}
}
@Component({ selector: 'app-ks-cell', standalone: true, imports: [NgTemplateOutlet],
  template: '<ng-container *ngTemplateOutlet="params.template; context: { $implicit: params.data }" />' })
export class KsCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams & { template: TemplateRef<unknown> };
  agInit(params: typeof this.params): void { this.params = params; }
  refresh(params: typeof this.params): boolean { this.params = params; return true; }
}
@Component({ selector: 'app-ks-table', standalone: true, imports: [AgGridAngular],
  templateUrl: './ks-table.component.html', styleUrl: './ks-table.component.css' })
export class KsTableComponent implements AfterContentInit {
  @Input() rows: any[] = [];
  @Input() emptyMessage = 'Nenhum registro encontrado.';
  @Output() rowAction = new EventEmitter<any>();
  @ContentChildren(KsColumnDirective) columns!: QueryList<KsColumnDirective>;
  readonly modules = [RowStyleModule, ClientSideRowModelModule, TextFilterModule, NumberFilterModule, DateFilterModule];
  readonly theme = themeQuartz.withParams({ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 12, headerFontSize: 12, rowHeight: 38, headerHeight: 36, backgroundColor: '#ffffff', headerBackgroundColor: '#edf5fc', foregroundColor: '#263b50', accentColor: '#0784c4', borderColor: '#d4e1ed', borderRadius: 0, wrapperBorderRadius: 0, oddRowBackgroundColor: '#f8fbff' });
  readonly defaultColDef: ColDef = { flex: 1, resizable: true, sortable: true, filter: true };
  readonly localeText = { noRowsToShow: 'Nenhum registro encontrado.', equals: 'Igual a', notEqual: 'Diferente de', contains: 'Contém', notContains: 'Não contém', startsWith: 'Começa com', endsWith: 'Termina com', blank: 'Em branco', notBlank: 'Preenchido', filterOoo: 'Filtrar...', andCondition: 'E', orCondition: 'OU', lessThan: 'Menor que', greaterThan: 'Maior que', inRange: 'Entre', applyFilter: 'Aplicar', resetFilter: 'Limpar' };
  readonly getRowClass = (params: RowClassParams) => params.data?.lida === false ? 'nao-lida' : '';
  columnDefs: ColDef[] = [];
  get height(): number { return Math.min(440, Math.max(180, this.rows.length * 38 + 54)); }
  onRowClicked(event: RowClickedEvent): void {
    if (event.event?.target instanceof Element && event.event.target.closest('button, a, input, select')) return;
    this.rowAction.emit(event.data);
  }
  ngAfterContentInit(): void {
    this.columnDefs = this.columns.map((column, index) => ({
      colId: String(index), headerName: column.ksColumn, field: column.field || undefined,
      minWidth: column.minWidth, sortable: !!column.field, filter: !!column.field,
      cellRenderer: KsCellComponent, cellRendererParams: { template: column.template }
    }));
  }
  onKeyDown(event: CellKeyDownEvent | FullWidthCellKeyDownEvent): void {
    if ((event.event as KeyboardEvent)?.key === 'Enter' && event.event?.target instanceof HTMLElement && event.event.target.classList.contains('ag-cell')) this.rowAction.emit(event.data);
  }
}
