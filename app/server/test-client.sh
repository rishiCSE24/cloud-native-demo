#!/bin/bash

curl -X POST "http://localhost:9000/shortest-paths" \
  -H "Content-Type: application/json" \
  -d @test_payload.json
