export interface DashboardStatusItem {
  statusId: number;
  status: string;
  total: number;
}

export interface DashboardResumo {
  totalOS: number;
  totalAbertas: number;
  totalComResolucao: number;
  totalSemResolucao: number;
  status: DashboardStatusItem[];
}
