export interface StatusListItem {
  statusId: number;
  statusName: string;
  isPending: boolean;
  statusStopClock: boolean;
  statusDescription: string;
  isDeleted: boolean;
  internalName: string;
}

export interface StatusForm {
  statusName: string;
  isPending: boolean;
  statusStopClock: boolean;
  statusDescription: string;
  internalName: string;
}

export interface StatusFiltro {
  page: number;
  pageSize: number;
  termo: string;
}
