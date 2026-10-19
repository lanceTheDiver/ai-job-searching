"server-only";

import {
  cancelBossApplication,
  confirmBossApplication,
  continueBossApplication,
  prepareBossApplication,
} from "@/lib/boss/application-automation";
import {
  cancelLinkedInApplication,
  confirmLinkedInApplication,
  continueLinkedInApplication,
  prepareLinkedInApplication,
} from "@/lib/linkedin/application-automation";
import type { JobSource } from "@/schemas/job-search";

export function prepareApplicationAutomation(
  source: JobSource,
  input: {
    applicationId: string;
    jobUrl: string;
    resumeFileId: string;
    resumeText: string;
  },
) {
  return source === "boss"
    ? prepareBossApplication(input)
    : prepareLinkedInApplication(input);
}

export function continueApplicationAutomation(source: JobSource, id: string) {
  return source === "boss"
    ? continueBossApplication(id)
    : continueLinkedInApplication(id);
}

export function confirmApplicationAutomation(source: JobSource, id: string) {
  return source === "boss"
    ? confirmBossApplication(id)
    : confirmLinkedInApplication(id);
}

export function cancelApplicationAutomation(source: JobSource, id: string) {
  return source === "boss"
    ? cancelBossApplication(id)
    : cancelLinkedInApplication(id);
}
