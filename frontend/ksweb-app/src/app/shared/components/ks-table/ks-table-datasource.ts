import { Observable, Subscription } from 'rxjs';
import { IDatasource } from 'ag-grid-community';

export type KsPageLoader = (page: number, pageSize: number) => Observable<{ items: any[]; total: number }>;

export function createKsDatasource(loadPage: KsPageLoader, onError: () => void): IDatasource {
  const requests = new Subscription();
  return {
    getRows: (params) => {
      const pageSize = params.endRow - params.startRow;
      requests.add(loadPage(Math.floor(params.startRow / pageSize) + 1, pageSize).subscribe({
        next: (response) => params.successCallback(response.items ?? [], response.total),
        error: () => {
          params.failCallback();
          onError();
        },
      }));
    },
    destroy: () => requests.unsubscribe(),
  };
}
