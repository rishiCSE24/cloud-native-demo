import json
import random
import re
from typing import Any, Dict, List

import httpx
from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates


app = FastAPI(title="Shortest Path Client App with Zoom-Fit D3 Topology Frame")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

SERVER_ENDPOINT_PATH = "/shortest-paths"


def clean_prefix(prefix: str) -> str:
    prefix = prefix.strip()

    if not prefix:
        return "N"

    prefix = re.sub(r"\s+", "_", prefix)
    prefix = re.sub(r"[^A-Za-z0-9_\\-]", "", prefix)

    if not prefix:
        return "N"

    return prefix


def create_random_weighted_graph_adjacency(
    number_of_nodes: int,
    node_prefix: str,
    edge_probability: float = 0.4,
    min_weight: int = 1,
    max_weight: int = 10,
) -> Dict[str, Dict[str, int]]:
    if number_of_nodes < 1:
        raise ValueError("Number of nodes must be at least 1.")

    node_prefix = clean_prefix(node_prefix)
    nodes = [f"{node_prefix}_{i}" for i in range(1, number_of_nodes + 1)]
    adjacency: Dict[str, Dict[str, int]] = {node: {} for node in nodes}

    for i in range(number_of_nodes):
        for j in range(i + 1, number_of_nodes):
            if random.random() <= edge_probability:
                weight = random.randint(min_weight, max_weight)
                source = nodes[i]
                destination = nodes[j]
                adjacency[source][destination] = weight
                adjacency[destination][source] = weight

    # Backbone chain to keep graph connected.
    for i in range(number_of_nodes - 1):
        source = nodes[i]
        destination = nodes[i + 1]

        if destination not in adjacency[source]:
            weight = random.randint(min_weight, max_weight)
            adjacency[source][destination] = weight
            adjacency[destination][source] = weight

    return adjacency


def adjacency_to_d3_graph(adjacency: Dict[str, Dict[str, int]]) -> Dict[str, List[Dict[str, Any]]]:
    nodes = [{"id": node, "label": node} for node in adjacency.keys()]
    links = []
    seen_edges = set()

    for source, neighbours in adjacency.items():
        for destination, weight in neighbours.items():
            edge_key = tuple(sorted([source, destination]))

            if edge_key in seen_edges:
                continue

            seen_edges.add(edge_key)
            links.append(
                {
                    "source": source,
                    "target": destination,
                    "weight": weight,
                }
            )

    return {
        "nodes": nodes,
        "links": links,
    }


def build_server_url(server_ip: str, server_port: int) -> str:
    server_ip = server_ip.strip()

    if server_ip.startswith("http://") or server_ip.startswith("https://"):
        base_url = f"{server_ip}:{server_port}"
    else:
        base_url = f"http://{server_ip}:{server_port}"

    return f"{base_url}{SERVER_ENDPOINT_PATH}"


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "server_ip": "localhost",
            "server_port": "8080",
            "number_of_nodes": "5",
            "node_prefix": "N",
            "selected_algorithm": "dijkstra",
            "payload": None,
            "server_url": None,
            "server_response": None,
            "graph_data": None,
            "error": None,
        },
    )


@app.post("/submit", response_class=HTMLResponse)
async def submit(
    request: Request,
    server_ip: str = Form(...),
    server_port: int = Form(...),
    number_of_nodes: int = Form(...),
    node_prefix: str = Form("N"),
    algorithm: str = Form(...),
):
    payload = None
    server_url = None
    server_response = None
    graph_data = None
    error = None

    try:
        cleaned_prefix = clean_prefix(node_prefix)
        adjacency = create_random_weighted_graph_adjacency(number_of_nodes, cleaned_prefix)

        payload = {
            "topology": adjacency,
            "algorithm": algorithm,
        }

        graph_data = adjacency_to_d3_graph(adjacency)
        server_url = build_server_url(server_ip, server_port)

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(server_url, json=payload)

        try:
            server_response = response.json()
        except Exception:
            server_response = {
                "response": response.text,
                "code": response.status_code,
            }

        node_prefix = cleaned_prefix

    except Exception as exc:
        error = str(exc)

    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "server_ip": server_ip,
            "server_port": str(server_port),
            "number_of_nodes": str(number_of_nodes),
            "node_prefix": node_prefix,
            "selected_algorithm": algorithm,
            "payload": json.dumps(payload, indent=2) if payload else None,
            "server_url": server_url,
            "server_response": json.dumps(server_response, indent=2) if server_response else None,
            "graph_data": graph_data,
            "error": error,
        },
    )
