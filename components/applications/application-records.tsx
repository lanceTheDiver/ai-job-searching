"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import {
  applicationStatusView,
  formatApplicationDateTime,
} from "@/components/applications/application-record-view";
import {
  fetchApplicationRecords,
  performApplicationAction,
} from "@/lib/services/application-service";
import type { ApplicationRecord } from "@/schemas/application";

export function ApplicationRecords() {
  const [records, setRecords] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [confirmingId, setConfirmingId] = useState("");
  const [error, setError] = useState("");

  async function loadRecords() {
    setError("");
    setIsLoading(true);
    try {
      setRecords(await fetchApplicationRecords());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "读取失败");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;
    void fetchApplicationRecords()
      .then((data) => {
        if (isActive) setRecords(data);
      })
      .catch((caughtError: unknown) => {
        if (isActive) {
          setError(
            caughtError instanceof Error ? caughtError.message : "读取失败",
          );
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  async function runAction(
    record: ApplicationRecord,
    action: "continue" | "confirm" | "cancel",
  ) {
    setWorkingId(record.id);
    setError("");
    try {
      const updated = await performApplicationAction({ id: record.id, action });
      setRecords((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setConfirmingId("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "操作失败");
    } finally {
      setWorkingId("");
    }
  }

  if (isLoading) {
    return (
      <div className="grid min-h-56 place-items-center text-xs text-[#172033]/45">
        <span className="flex items-center gap-2">
          <LoaderCircle className="size-4 animate-spin" /> 正在读取投递记录
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[#172033]/9 pb-6">
        <div>
          <p className="font-mono text-[10px] tracking-[0.15em] text-[#1f7565] uppercase">
            Application ledger / Local
          </p>
          <h1
            id="applications-title"
            className="mt-2 text-4xl font-semibold tracking-[-0.055em]"
          >
            投递记录
          </h1>
          <p className="mt-3 text-xs leading-6 text-[#172033]/48">
            记录保存在当前设备，包含辅助填写、人工确认和最终提交状态。
          </p>
        </div>
        <button
          type="button"
          onClick={loadRecords}
          className="flex items-center gap-2 rounded-[9px] border border-[#172033]/10 bg-white px-3 py-2 text-[11px]"
        >
          <RefreshCw className="size-3" /> 刷新
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-[#fff8f6] p-3 text-xs text-[#9d5148]"
        >
          {error}
        </p>
      )}

      {records.length === 0 ? (
        <div className="grid min-h-64 place-items-center rounded-[20px] border border-dashed border-[#172033]/12 bg-white/55 text-center">
          <div>
            <BriefcaseBusiness className="mx-auto size-6 text-[#172033]/25" />
            <p className="mt-3 text-sm font-semibold">还没有投递记录</p>
            <p className="mt-1 text-xs text-[#172033]/40">
              从岗位搜索结果发起 OpenCLI 辅助投递后会显示在这里。
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {records.map((record) => {
            const view = applicationStatusView[record.status];
            const isWorking = workingId === record.id;
            return (
              <article
                key={record.id}
                className="rounded-[18px] bg-white p-5 shadow-[0_12px_38px_rgba(23,32,51,0.04)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold tracking-[-0.03em]">
                        {record.jobTitle}
                      </h2>
                      <span
                        className={`rounded-full px-2 py-1 font-mono text-[8px] ${view.className}`}
                      >
                        {view.label}
                      </span>
                      <span className="font-mono text-[10px] text-[#1f7565]">
                        MATCH {record.matchScore}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#172033]/48">
                      {[
                        record.source === "boss" ? "Boss 直聘" : "LinkedIn",
                        record.company,
                        record.location,
                        record.salary,
                        record.postedAt && `发布于 ${record.postedAt}`,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "公司信息未提供"}
                    </p>
                  </div>
                  <a
                    href={record.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-[#1f7565]"
                  >
                    查看岗位 <ArrowUpRight className="size-3" />
                  </a>
                </div>

                <p className="mt-4 rounded-[10px] bg-[#f7f8f6] px-3 py-2 text-[11px] leading-5 text-[#172033]/58">
                  {record.statusMessage}
                </p>

                <dl className="mt-4 grid gap-3 text-[10px] sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-[#172033]/35">开始时间</dt>
                    <dd className="mt-1">
                      {formatApplicationDateTime(record.startedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#172033]/35">最后更新</dt>
                    <dd className="mt-1">
                      {formatApplicationDateTime(record.updatedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#172033]/35">实际提交</dt>
                    <dd className="mt-1">
                      {record.submittedAt
                        ? formatApplicationDateTime(record.submittedAt)
                        : "尚未提交"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#172033]/35">使用简历</dt>
                    <dd className="mt-1 truncate" title={record.resumeFileName}>
                      {record.resumeFileName}
                    </dd>
                  </div>
                </dl>

                {(record.status === "preparing" ||
                  record.status === "awaiting_login" ||
                  record.status === "needs_attention") && (
                  <div className="mt-4 flex gap-2">
                    {record.status !== "preparing" && (
                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={() => runAction(record, "continue")}
                        className="rounded-[8px] bg-[#1f7565] px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-40"
                      >
                        {isWorking ? "处理中" : "继续自动填写"}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isWorking}
                      onClick={() => runAction(record, "cancel")}
                      className="rounded-[8px] border border-[#172033]/10 px-3 py-2 text-[10px] text-[#172033]/55"
                    >
                      取消
                    </button>
                  </div>
                )}

                {record.status === "awaiting_confirmation" &&
                  confirmingId !== record.id && (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(record.id)}
                      className="mt-4 rounded-[8px] bg-[#1f7565] px-3 py-2 text-[10px] font-semibold text-white"
                    >
                      检查并准备确认
                    </button>
                  )}
                {record.status === "awaiting_confirmation" &&
                  confirmingId === record.id && (
                    <div className="mt-4 rounded-[10px] border border-[#c08335]/20 bg-[#fffaf1] p-3">
                      <p className="text-[10px] leading-5 text-[#835c28]">
                        请在 Chrome
                        中完成最后检查。确认后会真正提交，无法自动撤回。
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => runAction(record, "confirm")}
                          className="rounded-[7px] bg-[#9d5148] px-3 py-1.5 text-[10px] font-semibold text-white disabled:opacity-40"
                        >
                          {isWorking ? "正在提交" : "确认并提交申请"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId("")}
                          className="px-3 py-1.5 text-[10px] text-[#172033]/55"
                        >
                          返回检查
                        </button>
                      </div>
                    </div>
                  )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
