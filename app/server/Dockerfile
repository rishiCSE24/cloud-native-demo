FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir fastapi uvicorn[standard] networkx pydantic

COPY . .

RUN chmod +x run.sh

EXPOSE 9000

CMD ["./run.sh", "9000"]