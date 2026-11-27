
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import networkx as nx

app = FastAPI(
    title="RouteLab API",
    description="Network Failure Analysis and Recovery Simulation",
    version="0.3.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://routelab-09u.pages.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Node(BaseModel):
    id: str


class Edge(BaseModel):
    source: str
    target: str
    weight: float


class NetworkRequest(BaseModel):
    nodes: list[Node]
    edges: list[Edge]


class ShortestPathRequest(NetworkRequest):
    source: str
    target: str


def build_graph(request):
    graph = nx.Graph()

    for node in request.nodes:
        graph.add_node(node.id)

    for edge in request.edges:
        if edge.weight <= 0:
            raise HTTPException(400, "Weights must be positive.")

        if edge.source == edge.target:
            raise HTTPException(400, "Self-connections are not allowed.")

        if edge.source not in graph or edge.target not in graph:
            raise HTTPException(400, "Unknown router in connection.")

        graph.add_edge(
            edge.source,
            edge.target,
            weight=edge.weight
        )

    return graph


@app.get("/")
def home():
    return {"message": "Welcome to RouteLab!", "status": "Backend running"}


@app.get("/health")
def health():
    return {"status": "healthy", "project": "RouteLab"}


@app.post("/shortest-path")
def shortest_path(request: ShortestPathRequest):
    graph = build_graph(request)

    if request.source not in graph or request.target not in graph:
        raise HTTPException(400, "Selected router does not exist.")

    try:
        path = nx.dijkstra_path(
            graph, request.source, request.target, weight="weight"
        )
        distance = nx.dijkstra_path_length(
            graph, request.source, request.target, weight="weight"
        )

        return {
            "success": True,
            "path": path,
            "total_delay": distance,
            "message": "Shortest path found successfully."
        }

    except nx.NetworkXNoPath:
        raise HTTPException(404, "No route exists between these routers.")


@app.post("/analyze-network")
def analyze_network(request: NetworkRequest):
    graph = build_graph(request)

    components = [
        sorted(list(component))
        for component in nx.connected_components(graph)
    ]

    bridges = [
        sorted([u, v])
        for u, v in nx.bridges(graph)
    ]

    articulation_points = sorted(
        list(nx.articulation_points(graph))
    )

    # Suggest a possible backup connection between each pair
    # of disconnected components. These are candidates, not
    # guaranteed optimal physical links.
    recovery_candidates = []

    if len(components) > 1:
        for i in range(len(components)):
            for j in range(i + 1, len(components)):
                first_component = components[i]
                second_component = components[j]

                first_router = max(
                    first_component,
                    key=lambda node: graph.degree(node)
                )

                second_router = max(
                    second_component,
                    key=lambda node: graph.degree(node)
                )

                recovery_candidates.append({
                    "source": first_router,
                    "target": second_router,
                    "reason": "Connects two currently disconnected components."
                })

    return {
        "success": True,
        "total_routers": graph.number_of_nodes(),
        "total_connections": graph.number_of_edges(),
        "component_count": len(components),
        "components": components,
        "bridges": bridges,
        "articulation_points": articulation_points,
        "is_connected": nx.is_connected(graph) if graph.number_of_nodes() else True,
        "recovery_candidates": recovery_candidates
    }

# Cloudflare Python Workers ASGI entrypoint
from workers import asgi

Default = asgi.entrypoint(app)