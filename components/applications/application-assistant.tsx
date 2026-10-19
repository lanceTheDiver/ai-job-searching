"use client";

import { useState } from "react";
import {
  ExternalLink,
  FileCheck2,
  LoaderCircle,
  Send,
  ShieldCheck,
} from "lucide-react";

import {
  performApplicationAction,
  prepareApplication,
} from "@/lib/services/application-service";
import type { ApplicationRecord } from "@/schemas/application";
import type { JobMatch } from "@/schemas/job-search";
import { useCandidateProfileStore } from "@/stores/candidate-profile-store";

const statusLabels: Record<ApplicationRecord["status"], string> = {
  preparing: "准备中",
  awaiting_login: "等待登录",
  needs_attention: "需要处理",
  awaiting_confirmation: "等待确认",
  submitted: "已投递",
  failed: "失败",
  cancelled: "已取消",
};

export function ApplicationAssistant({ job }: { job: JobMatch }) {
  const resumeText = useCandidateProfileStore((state) => state.resumeText);
  const resumeFileId = useCandidateProfileStore((state) => state.resumeFileId);
  const resumeFileName = useCandidateProfileStore(
    (state) => state.resumeFileName,
  );
  const [record, setRecord] = useState<ApplicationRecord | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");

  async function startApplication() {
    if (!resumeFileId) return;
    setError("");
    setIsWorking(true);
    try {
      setRecord(
        await prepareApplication({
          job: {
            id: job.id,
            source: job.source,
            title: job.title,
            company: job.company,
            location: job.location,
            postedAt: job.postedAt,
            salary: job.salary,
            url: job.url,
            matchScore: job.matchScore,
          },
          resumeFileId,
          resumeFileName,
          resumeText,
        }),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "辅助投递启动失败",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function runAction(action: "continue" | "confirm" | "cancel") {
    if (!record) return;
    setError("");
    setIsWorking(true);
    try {
      setRecord(await performApplicationAction({ id: record.id, action }));
      setIsConfirming(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "投递操作失败",
      );
    } finally {
      setIsWorking(false);
    }
  }

  if (!record) {
    return (
      <div className="mt-4">
        <button
          type="button"
          disabled={!resumeFileId || isWorking}
          onClick={startApplication}
          className="flex items-center gap-2 rounded-[9px] bg-[#172033] px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#253149] disabled:cursor-not-allowed disabled:opacity-40"
          title={!resumeFileId ? "请先上传 PDF 简历" : undefined}
        >
          {isWorking ? (
            <LoaderCircle className="size-3 animate-spin" />
          ) : (
            <Send className="size-3" />
          )}
          {isWorking ? "正在打开浏览器" : "OpenCLI 辅助投递"}
        </button>
        {!resumeFileId && (
          <p className="mt-2 text-[10px] text-[#9d5148]">
            请先上传 PDF 简历，才能自动填写申请。
          </p>
        )}
        {error && <p className="mt-2 text-[10px] text-[#9d5148]">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-[12px] border border-[#172033]/8 bg-[#f7f8f6] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-[#172033]/72">
            <FileCheck2 className="size-3 text-[#1f7565]" />
            {statusLabels[record.status]}
          </p>
          <p className="mt-1 max-w-xl text-[10px] leading-5 text-[#172033]/48">
            {record.statusMessage}
          </p>
        </div>
        <a
          href="/applications"
          className="flex items-center gap-1 text-[10px] text-[#1f7565] hover:underline"
        >
          查看记录 <ExternalLink className="size-2.5" />
        </a>
      </div>

      {error && <p className="mt-2 text-[10px] text-[#9d5148]">{error}</p>}

      {record.status === "awaiting_confirmation" && !isConfirming && (
        <button
          type="button"
          disabled={isWorking}
          onClick={() => setIsConfirming(true)}
          className="mt-3 flex items-center gap-2 rounded-[8px] bg-[#1f7565] px-3 py-2 text-[10px] font-semibold text-white"
        >
          <ShieldCheck className="size-3" /> 检查并准备确认
        </button>
      )}

      {record.status === "awaiting_confirmation" && isConfirming && (
        <div className="mt-3 rounded-[9px] border border-[#c08335]/20 bg-[#fffaf1] p-3">
          <p className="text-[10px] leading-5 text-[#835c28]">
            请先在 Chrome
            中核对公司、岗位、简历和所有回答。点击后会真正提交申请，不能自动撤回。
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isWorking}
              onClick={() => runAction("confirm")}
              className="rounded-[7px] bg-[#9d5148] px-3 py-1.5 text-[10px] font-semibold text-white disabled:opacity-40"
            >
              {isWorking ? "正在提交" : "确认并提交申请"}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              className="rounded-[7px] px-3 py-1.5 text-[10px] text-[#172033]/55"
            >
              返回检查
            </button>
          </div>
        </div>
      )}

      {(record.status === "awaiting_login" ||
        record.status === "needs_attention") && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isWorking}
            onClick={() => runAction("continue")}
            className="rounded-[8px] bg-[#1f7565] px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-40"
          >
            {isWorking ? "继续处理中" : "继续自动填写"}
          </button>
          <button
            type="button"
            disabled={isWorking}
            onClick={() => runAction("cancel")}
            className="rounded-[8px] border border-[#172033]/10 px-3 py-2 text-[10px] text-[#172033]/55"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}
