import os
import json
import asyncio
import random
import httpx
from pathlib import Path
from typing import Optional
from app.config import settings

PROMPT_TEMPLATE_PATH = Path(__file__).resolve().parent.parent / "prompts" / "paper_analysis.txt"

SYSTEM_PROMPT = (
    "你是微生物耐药领域的资深专家。"
    "你的任务是从文献中提取核心要点，而非逐句翻译。"
    "输出必须是严格的JSON格式，不要任何额外解释。\n\n"
    "【学科分类体系】请根据文献内容，从以下8类中严格选择一项（仅返回类别名称）：\n"
    "- 临床医学：关键词如 hospital, patient, clinical, infection, therapy\n"
    "- 环境科学：关键词如 water, soil, sediment, wastewater, river, environment\n"
    "- 动物健康：关键词如 livestock, poultry, swine, cattle, aquaculture\n"
    "- 食品与公共卫生：关键词如 food, meat, vegetable, market, foodborne\n"
    "- 分子机制与遗传学：关键词如 plasmid, integron, transposon, expression, mutation, evolution\n"
    "- 生物信息学与监测：关键词如 metagenomics, bioinformatics, pipeline, database, surveillance\n"
    "- 植物与农业：关键词如 rhizosphere, plant, crop, fertilizer, agricultural soil\n"
    "- 其他：综述、政策等无法归入上述类别的\n\n"
    "要求：仅返回一个类别名称，不要任何解释。"
)

_FIELD_DEFS = [
    ("abstract_cn", "中文摘要（abstract_cn）", "提取研究背景、核心发现与意义，控制在150字以内。"),
    ("methods", "研究方法（methods）", "提炼主要实验或分析方法，一句话概括，如'宏基因组测序+网络分析'。"),
    ("research_subject", "研究对象（research_subject）", "说明研究使用的样本或体系，如'临床分离大肠埃希菌'。"),
    ("sample_source", "样本来源（sample_source）", "说明样本采集地点或场景，如'医院废水、河流沉积物'。若未提及则填'未提及'。"),
    ("subject_category", "学科分类（subject_category）", "从以下8个类别中严格选择一项，仅返回类别名称，不要解释：\n"
     "   - 临床医学\n   - 环境科学\n   - 动物健康\n   - 食品与公共卫生\n   - 分子机制与遗传学\n   - 生物信息学与监测\n   - 植物与农业\n   - 其他"),
    ("highlights", "主要创新点（highlights）", "列出1-3条核心创新，每条一句话。"),
    ("conclusion", "结论（conclusion）", "提炼最核心结论，控制在50字以内。"),
    ("corresponding_author", "通讯作者（corresponding_author）", "提取通讯作者姓名，如'Zhang San'。若无法确定则留空。"),
    ("first_affiliation", "第一通讯单位（first_affiliation）", "提取第一通讯单位的英文全称，如'School of Medicine, Fudan University'。若无法确定则留空。"),
]


class LLMProcessor:
    def __init__(self):
        self.api_key = settings.deepseek_api_key
        self.base_url = settings.deepseek_base_url.rstrip("/")
        self.model = settings.deepseek_model
        self.semaphore = asyncio.Semaphore(settings.llm_max_concurrent)
        self.client = httpx.AsyncClient(timeout=60.0)
        self._prompt_template: Optional[str] = None

    def _load_prompt(self) -> str:
        if self._prompt_template is None:
            with open(PROMPT_TEMPLATE_PATH, "r", encoding="utf-8") as f:
                self._prompt_template = f.read()
        return self._prompt_template

    async def complete(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 800,
        }

        last_exception = None
        max_attempts = settings.llm_retry_attempts
        for attempt in range(1, max_attempts + 1):
            try:
                async with self.semaphore:
                    resp = await self.client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError as exc:
                last_exception = exc
                is_rate_limit = exc.response.status_code == 429
                if is_rate_limit and attempt < max_attempts:
                    delay = settings.llm_base_delay * (2 ** (attempt - 1)) + random.uniform(0, 2)
                    await asyncio.sleep(delay)
                elif not is_rate_limit and attempt < max_attempts:
                    await asyncio.sleep(2 ** attempt)
                else:
                    raise
            except Exception as exc:
                last_exception = exc
                if attempt < max_attempts:
                    await asyncio.sleep(2 ** attempt)
                else:
                    raise
        raise last_exception

    def _build_prompt(self, title: str, abstract: str, skip_fields: Optional[set] = None) -> str:
        skip = skip_fields or set()
        lines = [
            "你是一位抗生素耐药基因（ARG）领域的资深文献分析专家。请基于以下英文文献的标题和摘要，提取核心信息，用中文简明扼要地回答。注意：不要逐句翻译，只提炼最关键要点。\n",
            "要求：",
        ]
        idx = 1
        json_keys = []
        for key, label, desc in _FIELD_DEFS:
            if key in skip:
                continue
            lines.append(f"{idx}. {label}：{desc}")
            json_keys.append(f'  "{key}": "..."')
            idx += 1
        lines.append("\n请严格按以下JSON格式输出，不要添加额外解释：")
        lines.append("{")
        lines.extend(json_keys)
        lines.append("}\n")
        lines.append(f"文献标题：{title}\n")
        lines.append(f"文献摘要：{abstract or ''}")
        return "\n".join(lines)

    async def analyze_paper(self, title: str, abstract: str, skip_fields: Optional[set] = None) -> dict:
        prompt = self._build_prompt(title, abstract, skip_fields)
        raw = await self.complete(prompt, SYSTEM_PROMPT)

        # Extract JSON block
        text = raw.strip()
        if text.startswith("```"):
            text = text.strip("`")
            if text.lower().startswith("json"):
                text = text[4:].strip()

        default_result = {
            "abstract_cn": "",
            "methods": "",
            "research_subject": "",
            "sample_source": "未提及",
            "subject_category": "",
            "highlights": "",
            "conclusion": "",
            "corresponding_author": "",
            "first_affiliation": "",
        }

        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1:
                try:
                    parsed = json.loads(text[start:end + 1])
                except json.JSONDecodeError:
                    return default_result
            else:
                return default_result

        if not isinstance(parsed, dict):
            return default_result

        # Merge parsed fields into defaults; missing/invalid fields stay as defaults
        for key in default_result:
            if key in parsed and parsed[key] is not None:
                default_result[key] = str(parsed[key]).strip()

        return default_result


llm_processor = LLMProcessor()
