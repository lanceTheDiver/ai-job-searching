import {
  OmniRouteError,
  requestOmniRouteStructuredOutput,
} from "@/lib/services/omniroute-service";
import {
  jobSearchCriteriaSchema,
  type JobSearchCriteria,
  type Workplace,
} from "@/schemas/job-search";

export { OmniRouteError as JobSearchCriteriaError };

export async function deriveJobSearchCriteria(
  resumeText: string,
  workplace: Workplace,
): Promise<JobSearchCriteria> {
  return requestOmniRouteStructuredOutput({
    schema: jobSearchCriteriaSchema,
    schemaName: "job_search_criteria",
    instructions:
      "你是一名严谨的招聘搜索顾问。根据候选人简历生成 LinkedIn 岗位检索条件。keywords 只返回一个最匹配候选人当前经验的常见英文职位名称，不要堆砌技能或返回多个职位。location 只使用简历明确写出的候选人当前城市、地区或国家；不要把雇主或项目地点当作候选人所在地，无法确认时返回 null。不要虚构信息。",
    input: `办公方式偏好：${workplace}\n\n候选人简历：\n${resumeText.slice(0, 18_000)}`,
    operationName: "岗位检索条件提取",
    resultName: "岗位检索条件",
  });
}
