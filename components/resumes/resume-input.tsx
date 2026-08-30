"use client";

import { useState, type ChangeEvent } from "react";
import { FileCheck2, FileText, LoaderCircle, Upload } from "lucide-react";

import { requestResumeParsing } from "@/lib/services/job-service";
import { useCandidateProfileStore } from "@/stores/candidate-profile-store";

type ResumeInputProps = {
  disabled?: boolean;
  onError: (message: string) => void;
  onUploadingChange?: (isUploading: boolean) => void;
};

export function ResumeInput({
  disabled = false,
  onError,
  onUploadingChange,
}: ResumeInputProps) {
  const resumeText = useCandidateProfileStore((state) => state.resumeText);
  const resumeFileName = useCandidateProfileStore(
    (state) => state.resumeFileName,
  );
  const resumeFileId = useCandidateProfileStore((state) => state.resumeFileId);
  const setResumeText = useCandidateProfileStore(
    (state) => state.setResumeText,
  );
  const setParsedResume = useCandidateProfileStore(
    (state) => state.setParsedResume,
  );
  const [isUploading, setIsUploading] = useState(false);

  async function handleResumeUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    onError("");
    setIsUploading(true);
    onUploadingChange?.(true);
    try {
      const parsedResume = await requestResumeParsing(file);
      setParsedResume(parsedResume.text, {
        id: parsedResume.fileId,
        name: `${parsedResume.fileName} · ${parsedResume.pageCount} 页`,
        size: parsedResume.fileSize,
        uploadedAt: parsedResume.uploadedAt,
      });
    } catch (caughtError) {
      onError(
        caughtError instanceof Error ? caughtError.message : "PDF 简历解析失败",
      );
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
    }
  }

  return (
    <div className="block border-b border-[#172033]/8 px-5 py-5 last:border-b-0 sm:px-6">
      <span className="flex items-center justify-between gap-3">
        <label
          htmlFor="resume-text"
          className="flex items-center gap-2 text-xs font-semibold"
        >
          <FileText className="size-3.5 text-[#1f7565]" />
          候选人简历
        </label>
        <span className="flex items-center gap-2">
          {resumeFileName && !isUploading && (
            <span className="flex items-center gap-1.5">
              {resumeFileId && <FileCheck2 className="size-3 text-[#1f7565]" />}
              <span
                className="max-w-32 truncate text-[9px] text-[#172033]/35"
                title={`${resumeFileName}${resumeFileId ? " · 原始 PDF 已保留，可用于自动投递" : ""}`}
              >
                {resumeFileName}
              </span>
            </span>
          )}
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md bg-[#edf3ef] px-2 py-1.5 text-[10px] font-medium text-[#1f7565] transition-colors hover:bg-[#e1ece6] focus-within:ring-3 focus-within:ring-[#1f8a70]/18">
            {isUploading ? (
              <LoaderCircle className="size-3 animate-spin" />
            ) : (
              <Upload className="size-3" />
            )}
            {isUploading ? "正在解析并保存" : "上传 PDF"}
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={disabled || isUploading}
              onChange={handleResumeUpload}
            />
          </label>
          <span className="font-mono text-[9px] text-[#172033]/30">
            CV / {resumeText.length.toLocaleString()}
          </span>
        </span>
      </span>
      <textarea
        id="resume-text"
        value={resumeText}
        onChange={(event) => setResumeText(event.target.value)}
        placeholder="粘贴纯文本简历，AI 会逐项寻找证据…"
        className="mt-3 min-h-48 w-full resize-y bg-transparent text-[13px] leading-6 text-[#172033]/72 outline-none placeholder:text-[#172033]/24 sm:min-h-52"
      />
    </div>
  );
}
