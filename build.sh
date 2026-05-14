#!/bin/bash

docker build -f app/client/Dockerfile -t spf-client:v_0.0.1 app/client 
docker build -f app/server/Dockerfile -t spf-server:v_0.0.1 app/server

