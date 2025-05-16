import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IAcrScheduleViewerProps {
  excelFileUrl: string;
  refreshInterval: number;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext;
}
