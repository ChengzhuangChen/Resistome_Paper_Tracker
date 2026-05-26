FROM python:3.11-slim

WORKDIR /app

# 配置 pip 使用腾讯云镜像源（加速下载）
RUN pip config set global.index-url https://mirrors.cloud.tencent.com/pypi/simple

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

RUN mkdir -p /app/data

EXPOSE 8000