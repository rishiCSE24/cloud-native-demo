#!/bin/bash

docker buildx build --platform linux/amd64  -f app/client/Dockerfile -t spf-client:v_0.0.1 app/client 
docker buildx build --platform linux/amd64 -f app/server/Dockerfile -t spf-server:v_0.0.1 app/server
