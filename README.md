# RouteLab — Network Failure Analysis & Recovery Simulation

**An interactive graph-theory-based network simulator for shortest-path analysis, connectivity testing, failure simulation, and recovery planning.**

<p align="center">
  <a href="https://routelab-09u.pages.dev/"><strong>Live Demo</strong></a>
  ·
  <a href="https://routelab-api.onrender.com/docs"><strong>API Documentation</strong></a>
</p>

---

## Overview

RouteLab is a full-stack web application that demonstrates how graph theory can be applied to communication-network analysis.

It models a communication network as an **undirected weighted graph**, where routers are represented as vertices and bidirectional communication links are represented as weighted edges.

Users can interactively modify the network, calculate minimum-weight routes, simulate router and link failures, analyze network connectivity, identify critical network elements, and explore possible recovery connections.

The project combines graph theory concepts with practical full-stack development using React, FastAPI, Python, and NetworkX.

> **Project context:** Developed as a group academic project for Graph Theory (CSMC441), Master of Computer Applications (MCA), Department of Computer Science and Engineering, Tezpur University.

## Live Application

| Component | Link |
|---|---|
| Frontend | https://routelab-09u.pages.dev/ |
| Backend API | https://routelab-api.onrender.com/ |
| API Health Check | https://routelab-api.onrender.com/health |
| Interactive API Docs | https://routelab-api.onrender.com/docs |

*Note: The backend is hosted on Render's free service and may experience a cold start after periods of inactivity.*

## Features

### Network Visualization
- Interactive network graph with draggable routers and connections.
- Visual representation of weighted bidirectional links.
- Organized sample topology with 20 routers and 35 connections.
- Router labels representing illustrative organizational and campus facilities.

### Shortest-Path Analysis
- Calculates minimum-total-weight routes using Dijkstra's algorithm.
- Displays the selected source and destination.
- Shows the resulting route and total simulated delay.
- Handles unreachable destinations.

### Network Failure Simulation
- Disable and restore individual connections.
- Simulate router failures.
- Restore failed routers and their saved connections.
- Observe how failures affect network connectivity.

### Critical Network Analysis
- Identify connected components.
- Detect bridge edges.
- Identify articulation points.
- Determine whether the active network is connected.
- Examine structural vulnerabilities in the network.

### Recovery Suggestions
- Generate candidate backup connections between disconnected components.
- Select high-degree routers as candidate endpoints.
- Explore how adding a connection can reconnect separated network components.

### Network Management
- Add routers and weighted connections.
- Import and export network configurations using JSON.
- Persist graph and failure state using browser LocalStorage.
- Validate graph data before importing or modifying the network.

## Screenshots

### Network Visualization

![RouteLab Network Graph](docs/screenshots/network-graph.png)

### Shortest-Path Analysis

![RouteLab Shortest Path](docs/screenshots/shortest-path.png)

### Critical Network Analysis

![RouteLab Critical Analysis](docs/screenshots/critical-analysis.png)

### Failure Simulation and Recovery

![RouteLab Failure Simulation](docs/screenshots/failure-recovery.png)

> Replace the image paths above with screenshots saved in your repository under `docs/screenshots/`. These are suggested filenames; add the actual screenshot files before publishing.

## System Architecture

RouteLab follows a frontend-backend architecture.

```text
┌──────────────────────────────────────┐
│          BROWSER / FRONTEND           │
│                                      │
│       React + JavaScript             │
│       React Flow                     │
│       Graph Editing & Visualization  │
│       LocalStorage / JSON            │
└──────────────────┬───────────────────┘
                   │
                   │ HTTP + JSON
                   ▼
┌──────────────────────────────────────┐
│           FASTAPI BACKEND             │
│                                      │
│       Request Validation             │
│       Graph Construction             │
│       API Endpoints                   │
│       Response Formatting             │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│              NETWORKX                │
│                                      │
│       Weighted Graph                 │
│       Dijkstra's Algorithm            │
│       Connected Components            │
│       Bridges                         │
│       Articulation Points             │
└──────────────────────────────────────┘
```

**Request flow:**

1. The user interacts with the graph in the React frontend.
2. The frontend sends the active graph as JSON to the FastAPI backend.
3. FastAPI validates the request and constructs an in-memory NetworkX graph.
4. NetworkX performs the requested graph operations.
5. The backend returns the results as JSON.
6. The frontend displays the analysis results.

NetworkX runs inside the FastAPI backend; it is not a separate deployed service.

## Technology Stack

| Category | Technology |
|---|---|
| Frontend | React |
| Programming Language | JavaScript |
| Build Tool | Vite |
| Graph Visualization | React Flow (`@xyflow/react`) |
| Styling | CSS |
| Backend | Python |
| API Framework | FastAPI |
| Request Validation | Pydantic |
| Graph Processing | NetworkX |
| ASGI Server | Uvicorn |
| Browser Persistence | LocalStorage |
| Data Exchange | JSON |
| Frontend Deployment | Cloudflare Pages |
| Backend Deployment | Render |

## Graph Theory Concepts

RouteLab demonstrates the following concepts:

| Concept | Application |
|---|---|
| Undirected Weighted Graph | Models bidirectional communication links |
| Vertex | Represents a router |
| Edge | Represents a connection between routers |
| Edge Weight | Represents simulated communication delay |
| Degree | Number of connections incident to a router |
| Dijkstra's Algorithm | Finds a minimum-weight route |
| Connected Components | Identifies disconnected network groups |
| Bridge | Identifies a connection whose removal increases component count |
| Articulation Point | Identifies a router whose removal increases component count |

### Algorithms and Implementation

The application uses NetworkX for its core graph operations:

- `nx.dijkstra_path()` — calculates the shortest path.
- `nx.dijkstra_path_length()` — calculates the total path weight.
- `nx.connected_components()` — identifies connected components.
- `nx.bridges()` — identifies bridge edges.
- `nx.articulation_points()` — identifies articulation points.

The backend also implements graph construction, request validation, response formatting, and a degree-based recovery-candidate heuristic.

**Important implementation detail:** The graph algorithms above are provided by NetworkX. RouteLab integrates and applies these library functions rather than claiming to implement the underlying algorithms from scratch.

## Default Network Model

The default demonstration network contains:

| Property | Value |
|---|---:|
| Routers (Vertices) | 20 |
| Connections (Edges) | 35 |
| Graph Type | Undirected |
| Edge Weights | Positive simulated delays |
| Maximum Routers | 30 |
| Initial Connected Components | 1 |
| Initial Bridges | None |
| Initial Articulation Points | None |

The initial shortest path from router A to router T is:

```text
A → E → T

Total Weight = 2 + 3 = 5
```

The dataset is synthetic and intended for educational demonstration. Its facility labels are illustrative and do not represent verified physical campus infrastructure or measured network latency.

## API Reference

The FastAPI backend exposes the following endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Returns backend status |
| GET | `/health` | Health-check endpoint |
| POST | `/shortest-path` | Calculates the minimum-weight route |
| POST | `/analyze-network` | Analyzes network connectivity and critical elements |

### Example: Shortest-Path Request

```json
{
  "nodes": [
    {"id": "A"},
    {"id": "B"}
  ],
  "edges": [
    {
      "source": "A",
      "target": "B",
      "weight": 4
    }
  ],
  "source": "A",
  "target": "B"
}
```

### Example: Shortest-Path Response

```json
{
  "success": true,
  "path": ["A", "B"],
  "total_delay": 4,
  "message": "Shortest path calculated successfully"
}
```

For complete request schemas and interactive endpoint testing, visit the [RouteLab API Documentation](https://routelab-api.onrender.com/docs).

## Getting Started

Follow these instructions to run RouteLab locally.

### Prerequisites

Make sure you have installed:

- Node.js and npm
- Python 3.10 or later
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/ezeehere/RouteLab.git
cd RouteLab
```

### 2. Start the Frontend

Open a terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will provide a local URL, typically:

```text
http://localhost:5173
```

### 3. Start the Backend

Open a second terminal from the project root:

```bash
cd backend
```

Create a virtual environment:

**Windows:**

```bash
python -m venv .venv
.venv\Scripts\activate
```

**macOS / Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The backend will typically be available at:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### 4. Open RouteLab

Open the frontend URL in your browser and start exploring the network.

Keep both frontend and backend servers running during local development.

## Project Structure

```text
RouteLab/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── ...
│
├── docs/
│   └── screenshots/
│
└── README.md
```

## Data Validation and Constraints

The frontend validates graph data before applying changes or importing JSON.

Current validation rules include:

- Maximum of 30 routers.
- Unique router identifiers.
- Valid edge endpoints.
- No self-connections.
- Positive, finite edge weights.
- No duplicate undirected connections.

The backend independently checks that edge weights are positive, endpoints are valid, and self-connections are rejected.

## Limitations

RouteLab is an educational network simulation, not a production network-management system.

Current limitations include:

- Uses synthetic network topology and illustrative edge weights.
- Models undirected connections only.
- Does not use live router or network telemetry.
- Does not simulate packet traffic, congestion, bandwidth, or packet loss.
- Recovery suggestions use a degree-based heuristic rather than an optimization algorithm.
- The backend constructs an in-memory graph for each request.
- Does not currently include authentication, authorization, or a persistent backend database.

## Future Improvements

Potential directions for further development include:

- Importing documented real-world or anonymized network topology datasets.
- Dynamic edge weights based on measured latency.
- Bandwidth and congestion simulation.
- More advanced recovery-link optimization.
- Directed graphs and multigraph support.
- Reliability analysis using edge and vertex failure probabilities.
- Larger graph support and performance benchmarking.
- Automated unit, integration, and end-to-end testing.
- Authentication and access control.



## License

This project was developed for academic and educational purposes.

A formal open-source license has not yet been specified. Please contact the repository owner before reusing or redistributing the project.

---

<p align="center">
  <strong>RouteLab</strong><br/>
  Exploring network connectivity, failures, and recovery through graph theory.
</p>
