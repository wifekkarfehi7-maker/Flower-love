export interface AnalyticsSummary {
  viewsToday: number;
  viewsWeek: number;
  viewsMonth: number;
  viewsTotal: number;
  scansToday: number;
  scansWeek: number;
  scansMonth: number;
  scansTotal: number;
  uniqueVisitorsMonth: number;
}

export interface TimeseriesPoint {
  day: string;
  views: number;
  scans: number;
}

export interface RankedItem {
  id: string;
  name_ar: string | null;
  name_fr: string | null;
  name_en: string | null;
  views: number;
}

export interface TableActivityRow {
  tableId: string;
  tableName: string;
  scans: number;
  lastScan: string | null;
}

export interface AnalyticsBundle {
  summary: AnalyticsSummary;
  timeseries: TimeseriesPoint[];
  topProducts: RankedItem[];
  topCategories: RankedItem[];
  tableActivity: TableActivityRow[];
}

export const EMPTY_ANALYTICS: AnalyticsBundle = {
  summary: {
    viewsToday: 0,
    viewsWeek: 0,
    viewsMonth: 0,
    viewsTotal: 0,
    scansToday: 0,
    scansWeek: 0,
    scansMonth: 0,
    scansTotal: 0,
    uniqueVisitorsMonth: 0,
  },
  timeseries: [],
  topProducts: [],
  topCategories: [],
  tableActivity: [],
};
