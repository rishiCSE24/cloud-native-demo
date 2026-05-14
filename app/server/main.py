from typing import Any, Dict, List, Literal, Union

import networkx as nx
from fastapi import FastAPI
from pydantic import BaseModel, Field


Algorithm = Literal["unweighted", "dijkstra", "bellman-ford"]


class ShortestPathRequest(BaseModel):
    topology: Dict[str, Any] = Field(
        ...,
        description=(
            "Adjacency-list topology. Supported forms: "
            "{'A': ['B', 'C']} or {'A': {'B': 2, 'C': 5}}."
        ),
    )
    algorithm: Algorithm = Field(
        ...,
        description="Shortest-path algorithm: unweighted, dijkstra, or bellman-ford.",
    )


class ShortestPathResponse(BaseModel):
    response: Union[List[Dict[str, Union[str, List[str]]]], str]
    code: int


app = FastAPI(
    title="All-Pairs Shortest Path API",
    description="Receives a network topology and returns shortest paths between all node pairs.",
    version="1.0.0",
)


def build_graph(topology: Dict[str, Any]) -> nx.Graph:
    """
    Build an undirected NetworkX graph from an adjacency-list dictionary.

    Supported input examples:
    1. Unweighted:
       {
         "A": ["B", "C"],
         "B": ["C"]
       }

    2. Weighted:
       {
         "A": {"B": 2, "C": 5},
         "B": {"C": 1}
       }

    The graph is undirected by default. For directed topologies, replace nx.Graph()
    with nx.DiGraph().
    """
    graph = nx.Graph()

    if not isinstance(topology, dict):
        raise ValueError("topology must be a dictionary adjacency list.")

    for source, neighbours in topology.items():
        if not isinstance(source, str):
            raise ValueError("All node names must be strings.")

        graph.add_node(source)

        if isinstance(neighbours, list):
            for destination in neighbours:
                if not isinstance(destination, str):
                    raise ValueError("For list adjacency, each neighbour must be a string.")
                graph.add_edge(source, destination, weight=1)

        elif isinstance(neighbours, dict):
            for destination, weight in neighbours.items():
                if not isinstance(destination, str):
                    raise ValueError("For weighted adjacency, each neighbour key must be a string.")
                if not isinstance(weight, (int, float)):
                    raise ValueError("Edge weights must be numeric for weighted algorithms.")
                graph.add_edge(source, destination, weight=float(weight))

        else:
            raise ValueError(
                "Each adjacency-list value must be either a list of neighbours "
                "or a dictionary of neighbour-to-weight mappings."
            )

    return graph


def compute_all_pairs_shortest_paths(
    graph: nx.Graph,
    algorithm: Algorithm,
) -> List[Dict[str, Union[str, List[str]]]]:
    """
    Compute shortest paths for every reachable source-destination pair.
    Unreachable pairs are omitted because NetworkX all-pairs functions only
    return reachable destinations.
    """
    results: List[Dict[str, Union[str, List[str]]]] = []

    if algorithm == "unweighted":
        all_paths = nx.all_pairs_shortest_path(graph)

    elif algorithm == "dijkstra":
        all_paths = nx.all_pairs_dijkstra_path(graph, weight="weight")

    elif algorithm == "bellman-ford":
        all_paths = nx.all_pairs_bellman_ford_path(graph, weight="weight")

    else:
        raise ValueError(
            "Unsupported algorithm. Use one of: unweighted, dijkstra, bellman-ford."
        )

    for source, destination_paths in all_paths:
        for destination, path in destination_paths.items():
            if source == destination:
                continue

            results.append(
                {
                    "source": str(source),
                    "destination": str(destination),
                    "path": [str(node) for node in path],
                }
            )

    return results


@app.get("/")
def health_check() -> Dict[str, str]:
    return {"status": "running"}


@app.post("/shortest-paths", response_model=ShortestPathResponse)
def shortest_paths(request: ShortestPathRequest) -> ShortestPathResponse:
    try:
        graph = build_graph(request.topology)

        if graph.number_of_nodes() == 0:
            return ShortestPathResponse(response="Topology contains no nodes.", code=400)

        paths = compute_all_pairs_shortest_paths(graph, request.algorithm)
        return ShortestPathResponse(response=paths, code=200)

    except nx.NetworkXUnbounded:
        return ShortestPathResponse(
            response="Negative-weight cycle detected. Shortest paths are undefined.",
            code=400,
        )

    except Exception as exc:
        return ShortestPathResponse(response=str(exc), code=400)
