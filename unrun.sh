#!/bin/bash

docker stop spf-server spf-client 
docker rmi spf-server:v_0.0.1 spf-client:v_0.0.1 python:3.12-slim 