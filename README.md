# Resistome Literature Tracker

**Resistome Literature Tracker** 是一个专注于耐药基因（Antibiotic Resistance Genes, ARGs）领域的文献监测与追踪平台。通过自动化抓取 PubMed 论文，结合 AI 摘要生成和多维度可视化分析，帮助研究人员高效追踪前沿研究进展。

## 数据来源与检索策略

文献数据来自 PubMed 官方数据库，检索词覆盖以下关键词：

```
(resistome OR resistomes OR "antibiotic resistome" OR "antibiotic resistance gene" OR
"antibiotic resistance genes" OR "antimicrobial resistance gene" OR "antimicrobial resistance genes" OR
"antibiotic resistant gene" OR "AMR gene" OR "AMR genes" OR "ARGs")
```

目前收录 **2021 年 1 月 1 日**起发表的论文，系统每日 02:00（北京时间）自动同步更新，保证前沿文献不遗漏。

## 主要功能

- **自动更新** - 每日 02:00（北京时间）自动抓取 PubMed 新文献，支持手动触发
- **AI 摘要生成** - 基于 DeepSeek-v4-flash 自动提取中文摘要、研究方法、对象、创新点、结论
- **多维度筛选** - 文献类型、JCR 分区、学科分类、影响因子、发表时间等
- **三种视图** - 表格视图 / 卡片视图 / 分区视图
- **数据可视化** - 词云、发表趋势图、全球访客地图
- **访客追踪** - 记录访客地域分布
- **留言板** - 访客互动功能
- **数据导出** - 支持 CSV 格式导出筛选结果

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Python 3.11, FastAPI, SQLAlchemy, Biopython, APScheduler |
| 前端 | React 18, Vite, Tailwind CSS, ECharts |
| 数据库 | SQLite |
| 部署 | Docker, docker-compose, Nginx |

## 项目结构

```
.
├── docker-compose.yml
├── .env                      # 环境变量（需自行创建）
├── 01fenqu.xlsx              # 期刊分区数据（需自行放置）
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py           # FastAPI 入口，访客追踪，定时任务
│       ├── config.py         # 配置管理
│       ├── database.py       # SQLite 连接
│       ├── models.py         # 数据模型
│       ├── schemas.py        # Pydantic 模型
│       ├── scheduler.py      # 定时任务
│       ├── routers/
│       │   ├── papers.py     # 文献查询 API
│       │   ├── stats.py      # 统计 API
│       │   ├── update.py     # 更新 / 富化 API
│       │   ├── logs.py       # 更新日志 API
│       │   ├── visitors.py   # 访客统计 API
│       │   ├── guestbook.py  # 留言板 API
│       │   └── keywords.py   # 关键词 API
│       └── services/
│           ├── pubmed_fetcher.py   # PubMed 抓取
│           ├── llm_processor.py    # DeepSeek LLM
│           ├── journal_matcher.py  # 期刊分区匹配
│           ├── geoip.py            # IP 地理位置
│           └── email_sender.py     # 邮件通知
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── App.jsx
        ├── api.js
        └── components/
            ├── Header.jsx          # 顶栏
            ├── Toolbar.jsx         # 搜索与筛选
            ├── PaperTable.jsx      # 表格视图
            ├── PaperCard.jsx       # 卡片视图
            ├── PaperModal.jsx      # 文献详情弹窗
            ├── SectionView.jsx     # 分区视图
            ├── StatCards.jsx       # 统计卡片
            ├── ChartsSection.jsx   # 图表（词云、趋势）
            ├── GlobalVisitorMap.jsx # 全球访客地图
            ├── VisitorMap.jsx      # 访客地图弹窗
            ├── GuestbookSection.jsx # 留言板
            ├── UpdateLogPanel.jsx  # 更新日志面板
            ├── UpdateFaqPanel.jsx  # 常见问题面板
            └── DonateCard.jsx      # 赞助卡片
```

## 快速启动

### 1. 配置环境变量

创建 `.env` 文件：

```bash
# DeepSeek API（必填）
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxx

# PubMed（必填）
NCBI_EMAIL=your_email@example.com
NCBI_API_KEY=your_ncbi_api_key

# 手动更新接口鉴权（必填）
APP_SECRET_TOKEN=your_random_secret

# 抓取起始日期（选填，默认 2024-01-01）
FETCH_START_DATE=2024-01-01
```

### 2. 准备期刊分区数据

将 `01fenqu.xlsx` 文件放入项目根目录（用于 JCR / 芯睿分区匹配）。

### 3. Docker 启动

```bash
docker-compose up --build -d
```

访问 `http://localhost:3000`

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `GET /api/papers` | 文献列表 | 支持分页、搜索、筛选、排序 |
| `GET /api/papers/{id}` | 文献详情 | |
| `GET /api/stats` | 统计数据 | 总数、分区分布、期刊分布、月度趋势 |
| `POST /api/update` | 触发更新 | 需 Authorization header |
| `POST /api/enrich` | 补充分析 | 对缺少摘要的文献补分析 |
| `GET /api/logs` | 更新日志 | |
| `GET /api/visitors/stats` | 访客统计 | |
| `POST /api/guestbook` | 提交留言 | |
| `GET /api/guestbook` | 留言列表 | |

## 开发模式

```bash
# 后端
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 前端
cd frontend
npm install
npm run dev
```

## 注意事项

1. 文献 AI 摘要仅供参考，请以原文为准
2. PubMed API 建议配置 API Key 以提高速率限制
3. JCR / 芯睿分区通过期刊名称关键词估算，精确数据需对接专业数据库