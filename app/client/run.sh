#!/bin/bash

PORT=$1
uvicorn main:app --reload --port $PORT
