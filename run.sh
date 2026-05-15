#!/bin/bash

docker run --rm -d -p 9000:9000 --name spf-server spf-server:v_0.0.1
docker run --rm -d -p 9001:9001 --name spf-client spf-client:v_0.0.1