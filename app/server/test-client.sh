#!/bin/bash

curl -X POST "http://localhost:8080/shortest-paths" \
  -H "Content-Type: application/json" \
  -d @test_payload.json
