# ARG 前沿追踪

**ARG 前沿追踪** (Antibiotic Resistance Gene Tracker) 是一个文献监测与展示平台，专注于抗生素耐药基因（ARGs）领域的最新研究进展。

## 数据来源

文献数据通过 NCBI Entrez API 从 PubMed 数据库获取。

当前使用的检索策略为：

```
resistome[Title/Abstract] OR resistomes[Title/Abstract] OR "antibiotics resistance gene"[Title/Abstract] OR "antibiotics resistance genes"[Title/Abstract]
```

该策略可以匹配主题中包含 **resistome**、**resistomes**、**antibiotics resistance gene**、**antibiotics resistance genes** 的文献，确保全面覆盖耐药基因谱相关研究。检索范围限定为 **2026 年 5 月 1 日**起收录的文献。

## 文献加工与摘要生成

每条文献在抓取后，通过 **DeepSeek 大模型** 自动提取以下中文字段，方便快速浏览：

- **中文摘要** — 核心要点提炼
- **主要研究方法**
- **研究对象**
- **核心创新点**
- **主要结论**

## 排序与筛选

系统为文献标记 JCR 分区（若可获取），并支持按分区、期刊、文献类型、发表时间等多维度筛选，帮助研究者快速定位高质量论文。

前端提供三种展示视图：
- **分区视图**（默认）— 按 JCR 分区（Q1 / Q2 / Q3 / Q4 / NA）分组展示
- **表格视图** — 紧凑列表，支持表头排序
- **卡片视图** — 单篇卡片流，信息密度适中

## 项目结构

```
arg-tracker/
├── docker-compose.yml          # 一键部署
├── .env                        # 环境变量配置
├── backend/                    # FastAPI 后端
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI 入口（含访客追踪中间件）
│       ├── config.py           # 配置管理
│       ├── database.py         # SQLite 连接
│       ├── models.py           # SQLAlchemy 模型
│       ├── schemas.py          # Pydantic 模型
│       ├── routers/
│       │   ├── papers.py       # 文献列表与详情 API
│       │   ├── stats.py        # 统计 API
│       │   ├── update.py       # 手动触发更新 API
│       │   ├── logs.py         # 爬取日志 API
│       │   └── visitors.py     # 访客统计 API
│       └── services/
│           ├── pubmed_fetcher.py   # PubMed 抓取（Biopython Entrez）
│           ├── llm_processor.py    # DeepSeek LLM 分析
│           ├── geoip.py            # IP 地理位置解析
│           └── email_sender.py     # SMTP 邮件推送（可选）
└── frontend/                   # React + Vite + Tailwind 前端
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── App.jsx
        ├── api.js
        └── components/         # Header, Toolbar, PaperTable, PaperCard, PaperModal,
                                # SectionView, VisitorMap, UpdateLogPanel
```

## 快速启动

### 1. 配置环境变量

复制并编辑根目录 `.env` 文件，填写以下必填项：

```bash
# DeepSeek API
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxx

# NCBI / PubMed（建议申请 API Key 以提高速率限制）
NCBI_EMAIL=your_email@example.com
NCBI_API_KEY=your_ncbi_api_key

# 手动更新接口的鉴权 Token
APP_SECRET_TOKEN=your_random_secret
```

### 2. Docker 一键启动

```bash
docker-compose up --build -d
```

- 前端：`http://localhost:3000`
- 后端 API：`http://localhost:8000`
- API 文档：`http://localhost:8000/docs`

### 3. 手动触发首次更新

点击页面右上角「手动更新」，输入 `.env` 中设置的 `APP_SECRET_TOKEN`，即可立即抓取文献并生成中文摘要。

## 主要功能

- **手动触发抓取**：通过网页右上角按钮一键抓取 PubMed 新增文献
- **智能去重**：基于 PMID / DOI 去重
- **LLM 核心要点提取**：DeepSeek 自动生成中文摘要、方法、对象、创新点、结论
- **全文检索**：支持题目、摘要、期刊、方法等多字段搜索
- **多维筛选**：文献类型、JCR 分区、日期范围
- **分区展示**：按 JCR 分区分组展示，快速识别高质量论文
- **访客地图**：ECharts 世界地图展示全球访客分布
- **更新日志**：记录每次爬取的检索数、新增数、分析成功数与失败数
- **响应式 UI**：蓝白学术风格，支持移动端

## API 列表

| 接口 | 方法 | 说明 |
|------|------|------|
| `GET /api/papers` | 查询 | 分页列表，支持 `q`, `page`, `article_type`, `jcr_quartile`, `date_from`, `date_to` |
| `GET /api/papers/{id}` | 详情 | 单篇文献全部字段 |
| `GET /api/stats` | 统计 | 总数、按月分布、分区分布等 |
| `GET /api/logs` | 日志 | 爬取历史记录分页 |
| `GET /api/visitors/stats` | 访客统计 | 总访客数、国家分布、地理坐标 |
| `POST /api/update` | 更新 | 手动触发抓取，Header `Authorization: Bearer <token>` |

## 技术栈

- **后端**：Python 3.11, FastAPI, SQLAlchemy, Biopython, httpx
- **前端**：React 18, Vite, Tailwind CSS, Lucide React, ECharts
- **数据库**：SQLite（默认），可无缝切换至 PostgreSQL
- **部署**：Docker, docker-compose, Nginx

## 注意事项

1. **API Key 安全**：`DEEPSEEK_API_KEY` 仅通过环境变量注入，代码中不硬编码任何密钥。
2. **PubMed 速率限制**：未提供 NCBI API Key 时，请求间隔强制为 1 秒；提供 Key 后建议 0.34 秒间隔。
3. **LLM 并发控制**：批量处理文献时，默认最多 5 条并行，避免触发 DeepSeek 速率限制。
4. **JCR 分区**：当前版本通过期刊名称关键词进行启发式估算，精确数据可后续对接 JCR API 或 LetPub 数据库。

## 重要提示

文献的中文摘要及提取字段均由 AI 自动生成，可能存在错误或遗漏。所有结论请务必查阅原文核实，AI 提炼内容仅供参考，不可直接作为科研引用依据。

## 开发模式启动

如果不使用 Docker，也可以分别启动前后端：

**后端**：
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**前端**：
```bash
cd frontend
npm install
npm run dev
```
