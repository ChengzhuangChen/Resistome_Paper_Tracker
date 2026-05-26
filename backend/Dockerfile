FROM python:3.11-slim

RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && echo "Asia/Shanghai" > /etc/timezone

WORKDIR /app

# 配置 pip 使用腾讯云镜像源（加速下载）
RUN pip config set global.index-url https://mirrors.cloud.tencent.com/pypi/simple

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

RUN mkdir -p /app/data

EXPOSE 8000