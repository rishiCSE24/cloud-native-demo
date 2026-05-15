#!/bin/bash

PORT=$1
uvicorn main:app --reload --host 0.0.0.0 --port $PORT
