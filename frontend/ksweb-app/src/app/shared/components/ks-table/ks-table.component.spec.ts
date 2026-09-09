import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AgGridAngular } from 'ag-grid-angular';
import { GridApi } from 'ag-grid-community';
import { of, Subject } from 'rxjs';
import { KsColumnDirective, KsTableComponent } from './ks-table.component';
import { createKsDatasource, KsPageLoader } from './ks-table-datasource';

@Component({
  imports: [KsTableComponent, KsColumnDirective],
  template: `<app-ks-table [rows]="rows" [loadPage]="loadPage" [storageKey]="storageKey">
    <ng-template ksColumn="Numero" field="numero" let-row>{{ row.numero }}</ng-template>
    <ng-template ksColumn="Outra" field="outra" let-row>{{ row.numero }}</ng-template>
  </app-ks-table>`,
})
class TableHost {
  rows = Array.from({ length: 61 }, (_, index) => ({ numero: index + 1 }));
  loadPage?: KsPageLoader;
  storageKey = '';
}

describe('KsTable native pagination', () => {
  let fixture: ComponentFixture<TableHost>;
  const settle = async () => {
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 150));
    fixture.detectChanges();
  };
  const grid = () => fixture.debugElement.query(By.directive(AgGridAngular)).componentInstance as AgGridAngular;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TableHost] }).compileComponents();
    fixture = TestBed.createComponent(TableHost);
  });

  afterEach(() => {
    localStorage.removeItem('ksweb_grid_columns_v1:test-layout');
    localStorage.removeItem('ksweb_grid_columns_v1:test-other-layout');
  });

  it('restores resized columns and their order after reopening, separately for each grid', async () => {
    fixture.componentInstance.storageKey = 'test-layout';
    await settle();
    grid().api.setColumnWidths([{ key: 'numero', newWidth: 60 }], true, 'uiColumnResized');
    grid().api.moveColumns(['outra'], 0);
    await settle();
    const saved = JSON.parse(localStorage.getItem('ksweb_grid_columns_v1:test-layout')!);
    expect(saved.map((column: any) => column.colId)).toEqual(['outra', 'numero']);
    expect(saved.find((column: any) => column.colId === 'numero').width).toBe(60);
    fixture.destroy();
    fixture = TestBed.createComponent(TableHost);
    fixture.componentInstance.storageKey = 'test-layout';
    await settle();
    const restored = grid().api.getColumnState();
    expect(restored.map(column => column.colId)).toEqual(['outra', 'numero']);
    expect(restored.find(column => column.colId === 'numero')?.width).toBe(60);
    fixture.destroy();
    fixture = TestBed.createComponent(TableHost);
    fixture.componentInstance.storageKey = 'test-other-layout';
    await settle();
    expect(grid().api.getColumnState().map(column => column.colId)).toEqual(['numero', 'outra']);
  });

  it('ignores corrupt saved layouts and keeps working when storage is blocked', async () => {
    localStorage.setItem('ksweb_grid_columns_v1:test-layout', '{invalid');
    fixture.componentInstance.storageKey = 'test-layout';
    await settle();
    expect(grid().api.getColumnState().map(column => column.colId)).toEqual(['numero', 'outra']);
    spyOn(Storage.prototype, 'setItem').and.throwError('Storage blocked');
    grid().api.setColumnWidths([{ key: 'numero', newWidth: 275 }], true, 'uiColumnResized');
    await settle();
    expect(grid().api.getColumnState().find(column => column.colId === 'numero')?.width).toBe(275);
  });

  it('uses the native footer to navigate all local rows and change page size', async () => {
    await settle();
    const api = grid().api;
    expect(api.paginationGetPageSize()).toBe(25);
    expect(api.paginationGetTotalPages()).toBe(3);
    const footer = fixture.nativeElement.querySelector('.ag-paging-panel') as HTMLElement;
    expect(footer.textContent).toContain('Linhas:');
    (footer.querySelector('[data-ref="btNext"]') as HTMLElement).click();
    await settle();
    expect(api.paginationGetCurrentPage()).toBe(1);
    api.setGridOption('paginationPageSize', 50);
    await settle();
    expect(api.paginationGetTotalPages()).toBe(2);
    api.paginationGoToLastPage();
    await settle();
    expect(api.paginationGetCurrentPage()).toBe(1);
    expect(fixture.nativeElement.querySelector('[row-index="60"] .ag-cell')?.textContent).toContain('61');
    fixture.componentInstance.rows = [];
    await settle();
    expect(api.paginationGetRowCount()).toBe(0);
  });

  it('uses the available viewport height so the grid reaches the bottom of the screen', () => {
    spyOnProperty(window, 'innerHeight').and.returnValue(820);
    const table = new KsTableComponent();
    expect(table.height).toBeGreaterThan(440);
  });

  it('loads remote blocks through native navigation and resets on a new search', async () => {
    const rows = Array.from({ length: 237 }, (_, index) => ({ numero: index + 1 }));
    const loader = jasmine.createSpy('loader').and.callFake((page: number, pageSize: number) =>
      of({ items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length }));
    fixture.componentInstance.loadPage = loader;
    await settle();
    const api = grid().api;
    expect(loader).toHaveBeenCalledWith(1, 100);
    expect(api.paginationGetTotalPages()).toBe(10);
    api.paginationGoToLastPage();
    await settle();
    expect(loader).toHaveBeenCalledWith(3, 100);
    expect(fixture.nativeElement.querySelector('[row-index="236"] .ag-cell')?.textContent).toContain('237');
    fixture.componentInstance.loadPage = () => of({ items: [{ numero: 999 }], total: 1 });
    await settle();
    expect(api.paginationGetCurrentPage()).toBe(0);
    expect(api.paginationGetRowCount()).toBe(1);
    expect(fixture.nativeElement.querySelector('[row-index="0"] .ag-cell')?.textContent).toContain('999');
  });

  it('shows loading while fetching and removes it on success and error', async () => {
    const pending = new Subject<{ items: any[]; total: number }>();
    fixture.componentInstance.loadPage = () => pending;
    await settle();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('Carregando dados');
    pending.next({ items: [{ numero: 1 }], total: 1 });
    pending.complete();
    await settle();
    expect(fixture.nativeElement.querySelector('.grid-loading')).toBeNull();
    const failed = new Subject<{ items: any[]; total: number }>();
    fixture.componentInstance.loadPage = () => failed;
    await settle();
    expect(fixture.nativeElement.querySelector('.grid-loading')).not.toBeNull();
    failed.error(new Error('API unavailable'));
    await settle();
    expect(fixture.nativeElement.querySelector('.grid-loading')).toBeNull();
  });

  it('keeps loading until all pending requests finish and clears it on cancellation', () => {
    const first = new Subject<{ items: any[]; total: number }>();
    const second = new Subject<{ items: any[]; total: number }>();
    const loading = jasmine.createSpy('loading');
    const source = createKsDatasource(page => page === 1 ? first : second, () => {}, loading);
    const request = { startRow: 0, endRow: 100, successCallback: () => {}, failCallback: () => {}, sortModel: [], filterModel: {}, context: {}, api: {} as GridApi };
    source.getRows(request);
    source.getRows({ ...request, startRow: 100, endRow: 200 });
    first.complete();
    expect(loading.calls.mostRecent().args).toEqual([true]);
    source.destroy?.();
    expect(loading.calls.mostRecent().args).toEqual([false]);
  });

  it('cancels obsolete API requests and reports failures to the grid', () => {
    const pending = new Subject<{ items: any[]; total: number }>();
    const error = jasmine.createSpy('error');
    const successCallback = jasmine.createSpy('success');
    const failCallback = jasmine.createSpy('fail');
    const source = createKsDatasource(() => pending, error);
    const request = { startRow: 100, endRow: 200, successCallback, failCallback, sortModel: [], filterModel: {}, context: {}, api: {} as GridApi };
    source.getRows(request);
    pending.error(new Error('API unavailable'));
    expect(failCallback).toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
    const next = new Subject<{ items: any[]; total: number }>();
    const obsolete = createKsDatasource(() => next, error);
    obsolete.getRows(request);
    obsolete.destroy?.();
    next.next({ items: [], total: 0 });
    expect(successCallback).not.toHaveBeenCalled();
  });
});
