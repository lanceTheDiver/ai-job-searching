"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Check,
  FileText,
  LoaderCircle,
  RotateCcw,
  Upload,
} from "lucide-react";

import { JobAnalysisResult } from "@/components/jobs/job-analysis-result";
import {
  requestJobAnalysis,
  requestResumeParsing,
} from "@/lib/services/job-service";
import type { JobAnalysis } from "@/schemas/job";

const exampleJob = `Senior Frontend Engineer

我们正在寻找一名高级前端工程师，负责使用 React、TypeScript 和 Next.js 构建面向全球用户的产品。你将与设计师和后端工程师合作，推动从需求拆解到上线监控的完整交付。

要求：3 年以上前端经验；熟悉 React、TypeScript、Next.js App Router；有测试、性能优化和无障碍经验；能够使用英文进行技术沟通。熟悉 AI SDK、LLM 产品或结构化输出者优先。`;

const exampleResume = `Lance｜Frontend Engineer

4 年 Web 开发经验，主要技术栈为 React、TypeScript、Next.js 与 Tailwind CSS。负责过两个 SaaS 产品的前端架构和性能优化，将首屏加载时间降低 35%。与产品、设计和后端团队协作完成需求拆解、开发与上线。

近期独立学习 LLM 应用工程，使用 Next.js Route Handler、OpenAI API 和 Zod 开发结构化内容分析工具。熟悉 Vitest 和 Playwright，能够阅读英文技术文档并参与英文会议。`;

const pipeline = [
  ["01", "Next.js", "收集输入"],
  ["02", "Route", "保护密钥"],
  ["03", "LLM", "提取证据"],
  ["04", "Zod", "验证结构"],
  ["05", "UI", "生成行动"],
];

export function JobAnalyzer() {
  const [jobDescription, setJobDescription] = useState(exampleJob);
  const [resumeText, setResumeText] = useState(exampleResume);
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResumeUploading, setIsResumeUploading] = useState(false);
  const [resumeFileName, setResumeFileName] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analysis) resultRef.current?.focus();
  }, [analysis]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      setAnalysis(await requestJobAnalysis({ jobDescription, resumeText }));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "分析失败，请稍后再试",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResumeUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    setIsResumeUploading(true);
    try {
      const parsedResume = await requestResumeParsing(file);
      setResumeText(parsedResume.text);
      setResumeFileName(
        `${parsedResume.fileName} · ${parsedResume.pageCount} 页`,
      );
      setAnalysis(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "PDF 简历解析失败",
      );
    } finally {
      setIsResumeUploading(false);
    }
  }

  function resetForm() {
    setJobDescription("");
    setResumeText("");
    setAnalysis(null);
    setError("");
    setResumeFileName("");
  }

  const isReady =
    jobDescription.trim().length >= 80 && resumeText.trim().length >= 80;

  return (
    <form
      onSubmit={handleSubmit}
      className="grid items-start gap-5 xl:grid-cols-[minmax(22rem,0.72fr)_minmax(32rem,1.28fr)]"
      aria-busy={isLoading || isResumeUploading}
    >
      <section className="overflow-hidden rounded-[22px] bg-white shadow-[0_18px_55px_rgba(23,32,51,0.055)] xl:sticky xl:top-5">
        <div className="flex items-center justify-between border-b border-[#172033]/8 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold">分析材料</p>
            <p className="mt-1 text-[11px] text-[#172033]/38">
              保留完整职责、要求和量化经历
            </p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-[#172033]/40 transition-colors duration-200 hover:bg-[#f0f3f1] hover:text-[#172033] focus-visible:ring-3 focus-visible:ring-[#1f8a70]/18 focus-visible:outline-none active:translate-y-px"
          >
            <RotateCcw className="size-3.5" /> 清空
          </button>
        </div>

        <TextInput
          id="job-description"
          label="职位描述"
          code="JD"
          value={jobDescription}
          onChange={setJobDescription}
          placeholder="粘贴完整职位描述，包括职责、要求和加分项…"
        />
        <TextInput
          id="resume-text"
          label="候选人简历"
          code="CV"
          value={resumeText}
          onChange={setResumeText}
          placeholder="粘贴纯文本简历，AI 会逐项寻找证据…"
          action={
            <div className="flex min-w-0 items-center gap-2">
              {resumeFileName && !isResumeUploading && (
                <span
                  className="max-w-32 truncate text-[9px] text-[#172033]/35"
                  title={resumeFileName}
                >
                  {resumeFileName}
                </span>
              )}
              <label className="flex cursor-pointer items-center gap-1.5 rounded-md bg-[#edf3ef] px-2 py-1.5 text-[10px] font-medium text-[#1f7565] transition-colors hover:bg-[#e1ece6] focus-within:ring-3 focus-within:ring-[#1f8a70]/18">
                {isResumeUploading ? (
                  <LoaderCircle className="size-3 animate-spin" />
                ) : (
                  <Upload className="size-3" />
                )}
                {isResumeUploading ? "正在解析" : "上传 PDF"}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  disabled={isResumeUploading || isLoading}
                  onChange={handleResumeUpload}
                />
              </label>
            </div>
          }
        />

        <div className="border-t border-[#172033]/8 bg-[#fafbf9] px-5 py-4 sm:px-6">
          {error && (
            <div
              role="alert"
              className="mb-3 border-l-2 border-[#b6574d] pl-3 text-xs leading-5 text-[#9d443d]"
            >
              {error}
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <span
              className={`flex items-center gap-2 text-[11px] ${isReady ? "text-[#1f7565]" : "text-[#172033]/35"}`}
            >
              <span
                className={`grid size-4 place-items-center rounded-full ${isReady ? "bg-[#d9efe9]" : "bg-[#e9ece9]"}`}
              >
                {isReady && <Check className="size-2.5" />}
              </span>
              {isReady ? "材料已达到分析要求" : "每项至少输入 80 个字符"}
            </span>
            <button
              type="submit"
              disabled={isLoading || isResumeUploading || !isReady}
              className="flex h-10 items-center gap-3 rounded-[10px] bg-[#172033] px-4 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#24304a] hover:shadow-[0_8px_22px_rgba(23,32,51,0.18)] focus-visible:ring-4 focus-visible:ring-[#1f8a70]/18 focus-visible:outline-none active:translate-y-px disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isLoading ? "正在分析" : "生成匹配报告"}
              <ArrowRight
                className={`size-3.5 ${isLoading ? "animate-pulse" : ""}`}
              />
            </button>
          </div>
        </div>
      </section>

      <div
        ref={resultRef}
        tabIndex={-1}
        className="rounded-[22px] focus:outline-none"
      >
        {isLoading ? (
          <AnalysisLoading />
        ) : analysis ? (
          <div className="animate-result-in">
            <JobAnalysisResult analysis={analysis} />
          </div>
        ) : (
          <AnalysisEmpty />
        )}
      </div>
    </form>
  );
}

type TextInputProps = {
  id: string;
  label: string;
  code: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  action?: ReactNode;
};

function TextInput({
  id,
  label,
  code,
  value,
  placeholder,
  onChange,
  action,
}: TextInputProps) {
  return (
    <div className="block border-b border-[#172033]/8 px-5 py-5 last:border-b-0 sm:px-6">
      <span className="flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="flex items-center gap-2 text-xs font-semibold"
        >
          <FileText className="size-3.5 text-[#1f7565]" />
          {label}
        </label>
        <span className="flex items-center gap-2">
          {action}
          <span className="font-mono text-[9px] text-[#172033]/30">
            {code} / {value.length.toLocaleString()}
          </span>
        </span>
      </span>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 min-h-48 w-full resize-y bg-transparent text-[13px] leading-6 text-[#172033]/72 outline-none placeholder:text-[#172033]/24 sm:min-h-52"
      />
    </div>
  );
}

function AnalysisEmpty() {
  return (
    <aside className="overflow-hidden rounded-[22px] bg-[#e7ece8]">
      <div className="grid min-h-[31rem] content-between p-6 sm:p-8">
        <div className="max-w-md">
          <span className="font-mono text-[10px] text-[#1f7565]">
            READY / WAITING FOR INPUT
          </span>
          <h3 className="mt-5 text-3xl leading-tight font-semibold tracking-[-0.045em] text-balance">
            报告会在这里逐层展开。
          </h3>
          <p className="mt-4 text-sm leading-7 text-[#172033]/48 text-pretty">
            完成分析后，你会看到匹配分数、岗位要求证据、简历缺口、面试问题和一个明确的下一步行动。
          </p>
        </div>
        <div className="mt-14">
          <p className="mb-4 text-[11px] font-medium text-[#172033]/40">
            本次请求如何流动
          </p>
          <ol className="grid gap-px overflow-hidden rounded-[14px] bg-[#172033]/8 sm:grid-cols-5">
            {pipeline.map(([number, name, detail]) => (
              <li key={number} className="bg-[#f3f6f3] p-3.5">
                <span className="font-mono text-[9px] text-[#1f7565]">
                  {number}
                </span>
                <p className="mt-3 text-[11px] font-semibold">{name}</p>
                <p className="mt-1 text-[9px] text-[#172033]/36">{detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </aside>
  );
}

function AnalysisLoading() {
  return (
    <aside
      className="min-h-[31rem] rounded-[22px] bg-white p-6 sm:p-8"
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">正在建立匹配图谱</p>
          <p className="mt-1 text-[11px] text-[#172033]/38">
            提取要求并核对简历证据
          </p>
        </div>
        <span className="font-mono text-[10px] text-[#1f7565] animate-pulse">
          PROCESSING
        </span>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-[9rem_1fr]">
        <div className="h-32 animate-pulse rounded-[16px] bg-[#e8eeea]" />
        <div className="space-y-3 pt-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-[#e8eeea]" />
          <div className="h-3 w-full animate-pulse rounded bg-[#eef2ef]" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-[#eef2ef]" />
        </div>
      </div>
      <div className="mt-8 space-y-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-[12px] bg-[#f0f3f1]"
          />
        ))}
      </div>
    </aside>
  );
}
