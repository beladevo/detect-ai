import type {
  DetectionResponse,
  UsageStatusPayload,
  PageSummary,
} from "./index";

export type RequestDetectionMessage = {
  type: "REQUEST_DETECTION";
  imageUrl: string;
  badgeId: string;
  pageUrl: string;
};

export type UsageStatusMessage = {
  type: "REQUEST_USAGE_STATUS";
};

export type PageSummaryRequestMessage = {
  type: "REQUEST_PAGE_SUMMARY";
};

export type PageSummaryResponseMessage = {
  type: "PAGE_SUMMARY_RESPONSE";
  summary: PageSummary;
};

export type ContextMenuDetectMessage = {
  type: "CONTEXT_MENU_DETECT";
  imageUrl: string;
  tabId: number;
};

export type ContextMenuResultMessage = {
  type: "CONTEXT_MENU_RESULT";
  imageUrl: string;
  result: DetectionResponse;
};

export type ExtensionMessage =
  | RequestDetectionMessage
  | UsageStatusMessage
  | PageSummaryRequestMessage
  | PageSummaryResponseMessage
  | ContextMenuDetectMessage
  | ContextMenuResultMessage;

export type UsageStatusResponse = {
  success: boolean;
  usage?: UsageStatusPayload;
  error?: string;
};

export const MESSAGE_TYPES = {
  REQUEST_DETECTION: "REQUEST_DETECTION",
  REQUEST_USAGE_STATUS: "REQUEST_USAGE_STATUS",
  REQUEST_PAGE_SUMMARY: "REQUEST_PAGE_SUMMARY",
  PAGE_SUMMARY_RESPONSE: "PAGE_SUMMARY_RESPONSE",
  CONTEXT_MENU_DETECT: "CONTEXT_MENU_DETECT",
  CONTEXT_MENU_RESULT: "CONTEXT_MENU_RESULT",
} as const;
