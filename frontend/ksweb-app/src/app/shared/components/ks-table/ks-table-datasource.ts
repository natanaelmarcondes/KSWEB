import { defer, finalize, Observable, Subscription } from 'rxjs';
import { IDatasource } from 'ag-grid-community';

export type KsPageLoader = (page: number, pageSize: number) => Observable<{ items: any[]; total: number }>;

export function createKsDatasource(loadPage: KsPageLoader, onError: () => void, onLoading: (loading: boolean) => void = () => {}): IDatasource {
  const requests = new Subscription();
  let pending = 0;
  return {
    getRows: (params) => {
      const pageSize = params.endRow - params.startRow;
      if (requests.closed) return;
      pending++;
      onLoading(true);
      requests.add(defer(() => loadPage(Math.floor(params.startRow / pageSize) + 1, pageSize)).pipe(
        finalize(() => onLoading(--pending > 0)),
      ).subscribe({
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
