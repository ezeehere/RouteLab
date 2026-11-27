import { useEffect, useState } from "react";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "./App.css";

const STORAGE_KEY = "routelab-network-v2";

// Display names only: graph IDs, edge endpoints, and API payloads remain unchanged.
const ROUTER_NAMES = {
  A: "Administrative Block",
  B: "Academic Block 1",
  C: "Academic Block 2",
  D: "Central Library",
  E: "Computer Centre",
  F: "Science Block",
  G: "Engineering Block",
  H: "Management Block",
  I: "Lecture Hall Complex",
  J: "University Auditorium",
  K: "Boys' Hostel Zone",
  L: "Girls' Hostel Zone",
  M: "Faculty Residential Zone",
  N: "Health Centre",
  O: "University Guest House",
  P: "Central Canteen",
  Q: "Sports Complex",
  R: "Student Activity Centre",
  S: "Campus Security Office",
  T: "Main Campus Gateway",
};

function routerLabel(id) {
  return ROUTER_NAMES[id] ? `${id} : ${ROUTER_NAMES[id]}` : id;
}

/* ---------- graph look (kept in one place) ---------- */

const COLORS = {
  edge: "#c3c5ee",
  nodeBg: "#ffffff",
  nodeBorder: "#c5c7f0",
  nodeText: "#3f3fa8",
  accent: "#5b5bd6",
  teal: "#0f9d8a",
  tealBg: "#e4f6f3",
  amber: "#e0a33a",
  amberBg: "#fdf3e1",
};

// One subtle colour set per connected component (cycled if more than six).
const COMP_COLORS = [
  { bg: "#eeeefd", border: "#8f90e8", text: "#3f3fa8", edge: "#b4b6ee" },
  { bg: "#e6f3fd", border: "#6db3e8", text: "#1f6aa5", edge: "#b3d6f2" },
  { bg: "#fdeef2", border: "#e58aa4", text: "#a8365a", edge: "#f0bfcd" },
  { bg: "#f0f7e0", border: "#9cc24a", text: "#587a14", edge: "#cfe3a3" },
  { bg: "#f3ecfd", border: "#b08be8", text: "#6b3fb5", edge: "#d9c6f3" },
  { bg: "#eef0f3", border: "#9aa3b2", text: "#4b5565", edge: "#cdd2da" },
];

const edgeBase = {
  style: { stroke: COLORS.edge, strokeWidth: 1.75 },
  labelStyle: { fill: "#4a4a68", fontWeight: 600, fontSize: 11 },
  labelBgStyle: { fill: "#ffffff", stroke: "#e9e9f1" },
  labelBgPadding: [6, 3],
  labelBgBorderRadius: 7,
};

const nodeStyle = {
  background: COLORS.nodeBg,
  color: COLORS.nodeText,
  border: `1.5px solid ${COLORS.nodeBorder}`,
  borderRadius: "50%",
  width: 58,
  height: 58,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: 15,
};

// Keep the graph compact; full router names appear in the inspector when selected.
/*
 * Default demonstration topology: a campus/organization network.
 * IDs A-T are intentionally preserved for API compatibility.
 * Positions are grouped into operational zones around two backbone routers.
 */
const DEFAULT_LAYOUT = {
  // Core / network operations
  A: { x: 790, y: 330 }, // Administrative Block — core
  E: { x: 790, y: 500 }, // Computer Centre — core

  // Academic and research zone
  B: { x: 300, y: 130 },
  C: { x: 470, y: 130 },
  D: { x: 640, y: 130 },
  F: { x: 300, y: 285 },
  G: { x: 470, y: 285 },
  H: { x: 640, y: 285 },
  I: { x: 470, y: 440 },
  J: { x: 300, y: 440 },

  // Residential zone
  K: { x: 1120, y: 150 },
  L: { x: 1300, y: 150 },
  M: { x: 1120, y: 315 },
  N: { x: 1300, y: 315 },

  // Student services and campus facilities
  O: { x: 1120, y: 500 },
  P: { x: 1300, y: 500 },
  Q: { x: 1120, y: 665 },
  R: { x: 1300, y: 665 },

  // Perimeter / access
  S: { x: 790, y: 760 },
  T: { x: 790, y: 900 },
};

const initialNodes = "ABCDEFGHIJKLMNOPQRST".split("").map((id) => ({
  id,
  position: DEFAULT_LAYOUT[id],
  data: { label: id },
  draggable: true,
  style: { ...nodeStyle },
}));

/*
 * 37 weighted, bidirectional links.
 * A and E form the backbone; departmental clusters have local redundancy
 * and multiple uplinks so failure analysis produces meaningful results.
 * Weights are illustrative simulated delays, not measured campus data.
 */
const initialEdges = [
  // Backbone
  { id: "AE", source: "A", target: "E", label: "2" },
  { id: "AS", source: "A", target: "S", label: "4" },
  { id: "ET", source: "E", target: "T", label: "3" },

  // Academic and research cluster
  { id: "AB", source: "A", target: "B", label: "3" },
  { id: "BC", source: "B", target: "C", label: "2" },
  { id: "CD", source: "C", target: "D", label: "2" },
  { id: "BF", source: "B", target: "F", label: "3" },
  { id: "CG", source: "C", target: "G", label: "2" },
  { id: "DH", source: "D", target: "H", label: "3" },
  { id: "FG", source: "F", target: "G", label: "2" },
  { id: "GH", source: "G", target: "H", label: "2" },
  { id: "FI", source: "F", target: "I", label: "3" },
  { id: "GJ", source: "G", target: "J", label: "3" },
  { id: "IJ", source: "I", target: "J", label: "2" },
  { id: "IE", source: "I", target: "E", label: "4" },
  { id: "HE", source: "H", target: "E", label: "4" },

  // Residential cluster
  { id: "AK", source: "A", target: "K", label: "4" },
  { id: "KL", source: "K", target: "L", label: "2" },
  { id: "KM", source: "K", target: "M", label: "3" },
  { id: "LN", source: "L", target: "N", label: "3" },
  { id: "MN", source: "M", target: "N", label: "2" },
  { id: "ME", source: "M", target: "E", label: "4" },
  { id: "NE", source: "N", target: "E", label: "5" },

  // Campus services and facilities cluster
  { id: "EO", source: "E", target: "O", label: "3" },
  { id: "OP", source: "O", target: "P", label: "2" },
  { id: "OQ", source: "O", target: "Q", label: "3" },
  { id: "PR", source: "P", target: "R", label: "2" },
  { id: "QR", source: "Q", target: "R", label: "2" },
  { id: "QS", source: "Q", target: "S", label: "4" },
  { id: "RS", source: "R", target: "S", label: "3" },

  // Perimeter / security / gateway redundancy
  { id: "ST", source: "S", target: "T", label: "2" },
  { id: "AT", source: "A", target: "T", label: "7" },
  { id: "ES", source: "E", target: "S", label: "3" },
  { id: "JT", source: "J", target: "T", label: "6" },
  { id: "DO", source: "D", target: "O", label: "7" },
].map((edge) => ({ ...edge, ...edgeBase }));

function createInitialData() {
  return {
    nodes: initialNodes,
    edges: initialEdges,
    failedEdges: [],
    failedRouters: [],
  };
}

function loadSavedData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return createInitialData();

    const data = JSON.parse(saved);

    if (
      !Array.isArray(data.nodes) ||
      !Array.isArray(data.edges) ||
      !Array.isArray(data.failedEdges) ||
      !Array.isArray(data.failedRouters)
    ) {
      return createInitialData();
    }

    return data;
  } catch {
    return createInitialData();
  }
}

function validateNetwork(data) {
  if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    throw new Error("Invalid JSON network format.");
  }

  if (data.nodes.length > 30) {
    throw new Error("A network can contain a maximum of 30 routers.");
  }

  const ids = new Set();

  for (const node of data.nodes) {
    if (
      !node ||
      typeof node.id !== "string" ||
      !node.id.trim() ||
      ids.has(node.id)
    ) {
      throw new Error("Invalid or duplicate router ID.");
    }

    ids.add(node.id);
  }

  const edgeIds = new Set();

  for (const edge of data.edges) {
    const weight = Number(edge.label);

    if (
      !edge ||
      !ids.has(edge.source) ||
      !ids.has(edge.target) ||
      edge.source === edge.target ||
      !Number.isFinite(weight) ||
      weight <= 0
    ) {
      throw new Error("Invalid connection or connection weight.");
    }

    const key = [edge.source, edge.target].sort().join("-");

    if (edgeIds.has(key)) {
      throw new Error("Duplicate connections are not allowed.");
    }

    edgeIds.add(key);
  }

  return {
    nodes: data.nodes.map((node) => ({
      ...node,
      position: node.position || { x: 100, y: 100 },
      data: node.data || { label: node.id },
      draggable: true,
      style: { ...nodeStyle },
    })),

    edges: data.edges.map((edge) => ({
      ...edge,
      label: String(edge.label),
      ...edgeBase,
    })),

    failedEdges: Array.isArray(data.failedEdges) ? data.failedEdges : [],
    failedRouters: Array.isArray(data.failedRouters) ? data.failedRouters : [],
  };
}

/* ---------- inline icons (no extra packages) ---------- */

const ICONS = {
  graph: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="8" r="2.5" />
      <circle cx="9" cy="18" r="2.5" />
      <path d="M8.3 6.6 15.6 7.5M7 8.3l1.4 7.3M16.7 10l-6 6.5" />
    </>
  ),
  path: (
    <>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5" />
    </>
  ),
  failure: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  analysis: <path d="M5 20V11M12 20V4M19 20v-7M3 20h18" />,
  recovery: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </>
  ),
  builder: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  data: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </>
  ),
  router: (
    <>
      <rect x="3" y="14" width="18" height="6" rx="2" />
      <path d="M7 17h.01M11 17h.01M8 14v-3M16 14v-3M6 8a8 8 0 0 1 12 0" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 2 20h20z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12 5 5 9-10" />,
};

function Icon({ name, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

const NAV_GROUPS = [
  {
    label: "Network",
    items: [
      { id: "graph", label: "Network graph", icon: "graph" },
      { id: "shortest-path", label: "Shortest path", icon: "path" },
      { id: "failure", label: "Failure simulation", icon: "failure" },
      { id: "analysis", label: "Critical analysis", icon: "analysis" },
      { id: "recovery", label: "Recovery", icon: "recovery" },
    ],
  },
  {
    label: "Manage",
    items: [
      { id: "builder", label: "Network builder", icon: "builder" },
      { id: "data-management", label: "Data management", icon: "data" },
    ],
  },
];

const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

function App() {
  const [savedData] = useState(loadSavedData);

  const [nodes, setNodes, onNodesChange] = useNodesState(savedData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(savedData.edges);

  const [failedEdges, setFailedEdges] = useState(savedData.failedEdges);
  const [failedRouters, setFailedRouters] = useState(savedData.failedRouters);

  const [newNode, setNewNode] = useState("");
  const [from, setFrom] = useState(savedData.nodes[0]?.id || "");
  const [to, setTo] = useState(savedData.nodes[1]?.id || "");
  const [weight, setWeight] = useState("1");

  const [source, setSource] = useState(savedData.nodes[0]?.id || "");
  const [target, setTarget] = useState(savedData.nodes.at(-1)?.id || "");

  const [shortestPath, setShortestPath] = useState(null);
  const [pathError, setPathError] = useState("");
  const [loading, setLoading] = useState(false);

  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const [saveMessage, setSaveMessage] = useState("Saved in this browser");
  const [activeSection, setActiveSection] = useState("graph");

  const [selected, setSelected] = useState(null); // { type: "node" | "edge", id }
  const [failTab, setFailTab] = useState("connections");

  // Which analysis layers are drawn on the graph, and which component is focused.
  const [overlays, setOverlays] = useState({
    components: true,
    bridges: true,
    articulation: true,
  });
  const [focusComp, setFocusComp] = useState(null);

  function navigateTo(sectionId) {
    setActiveSection(sectionId);

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function toggleLayer(key) {
    setOverlays((current) => ({ ...current, [key]: !current[key] }));
    if (key === "components") setFocusComp(null);
  }

  // Locate an analysis result on the graph.
  function focusComponent(index) {
    setOverlays((current) => ({ ...current, components: true }));
    setFocusComp((current) => (current === index ? null : index));
    setSelected(null);
    navigateTo("graph");
  }

  function focusBridge(bridge) {
    const edge = edges.find(
      (item) =>
        (item.source === bridge[0] && item.target === bridge[1]) ||
        (item.source === bridge[1] && item.target === bridge[0])
    );

    if (edge) setSelected({ type: "edge", id: edge.id });
    setOverlays((current) => ({ ...current, bridges: true }));
    navigateTo("graph");
  }

  function focusRouter(routerId) {
    setSelected({ type: "node", id: routerId });
    setOverlays((current) => ({ ...current, articulation: true }));
    navigateTo("graph");
  }

  // Highlight the sidebar item of the section currently in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-15% 0px -60% 0px", threshold: [0, 0.2, 0.5] }
    );

    NAV_ITEMS.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Automatically save the current network whenever it changes.
  useEffect(() => {
    const data = { nodes, edges, failedEdges, failedRouters };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSaveMessage("Saved in this browser");
    } catch {
      setSaveMessage("Could not save browser data");
    }
  }, [nodes, edges, failedEdges, failedRouters]);

  function clearResults() {
    setFocusComp(null);
    setShortestPath(null);
    setPathError("");
    setAnalysis(null);
    setAnalysisError("");
  }

  function payload() {
    return {
      nodes: nodes.map((node) => ({ id: node.id })),
      edges: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        weight: Number(edge.label),
      })),
    };
  }

  function addNode() {
    const name = newNode.trim().toUpperCase();

    if (!name || nodes.some((node) => node.id === name)) {
      alert("Enter a new, unique router name.");
      return;
    }

    if (nodes.length >= 30) {
      alert("The project currently supports a maximum of 30 routers.");
      return;
    }

    setNodes((current) => [
      ...current,
      {
        id: name,
        position: {
          x: 150 + (current.length % 5) * 150,
          y: 100 + Math.floor(current.length / 5) * 150,
        },
        data: { label: name },
        draggable: true,
        style: { ...nodeStyle },
      },
    ]);

    setNewNode("");
    clearResults();
  }

  function addEdge() {
    const delay = Number(weight);

    if (
      !from ||
      !to ||
      from === to ||
      !Number.isFinite(delay) ||
      delay <= 0 ||
      edges.some(
        (edge) =>
          (edge.source === from && edge.target === to) ||
          (edge.source === to && edge.target === from)
      )
    ) {
      alert("Choose two different routers and a positive, unique connection weight.");
      return;
    }

    setEdges((current) => [
      ...current,
      {
        id: `${from}-${to}`,
        source: from,
        target: to,
        label: String(delay),
        ...edgeBase,
      },
    ]);

    clearResults();
  }

  function removeConnection(edgeId) {
    const edge = edges.find((item) => item.id === edgeId);
    if (!edge) return;

    setEdges((current) => current.filter((item) => item.id !== edgeId));
    setFailedEdges((current) => [...current, edge]);
    setSelected(null);
    clearResults();
  }

  function restoreConnection(edgeId) {
    const edge = failedEdges.find((item) => item.id === edgeId);
    if (!edge) return;

    if (
      !nodes.some((node) => node.id === edge.source) ||
      !nodes.some((node) => node.id === edge.target)
    ) {
      alert("Restore both routers before restoring this connection.");
      return;
    }

    setEdges((current) => [...current, edge]);
    setFailedEdges((current) => current.filter((item) => item.id !== edgeId));
    clearResults();
  }

  function removeRouter(routerId) {
    if (!routerId) return;

    const router = nodes.find((node) => node.id === routerId);
    if (!router) return;

    const connected = edges.filter(
      (edge) => edge.source === routerId || edge.target === routerId
    );

    setFailedRouters((current) => [...current, { node: router, edges: connected }]);

    setNodes((current) => current.filter((node) => node.id !== routerId));

    setEdges((current) =>
      current.filter(
        (edge) => edge.source !== routerId && edge.target !== routerId
      )
    );

    const fallback = nodes.find((node) => node.id !== routerId)?.id || "";

    if (source === routerId) setSource(fallback);
    if (target === routerId) setTarget(fallback);
    if (from === routerId) setFrom(fallback);
    if (to === routerId) setTo(fallback);

    setSelected(null);
    clearResults();
  }

  function restoreRouter(routerId) {
    const saved = failedRouters.find((item) => item.node.id === routerId);
    if (!saved) return;

    setNodes((current) => [...current, saved.node]);

    setEdges((current) => {
      const ids = new Set(current.map((edge) => edge.id));
      return [...current, ...saved.edges.filter((edge) => !ids.has(edge.id))];
    });

    setFailedRouters((current) =>
      current.filter((item) => item.node.id !== routerId)
    );

    clearResults();
  }

  async function findShortestPath() {
    if (!source || !target) {
      setPathError("Please select two existing routers.");
      return;
    }

    setLoading(true);
    setPathError("");
    setShortestPath(null);

    try {
      const response = await fetch("https://routelab-api.onrender.com/shortest-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload(), source, target }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to find a route.");
      }

      setShortestPath(data);
    } catch (error) {
      setPathError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeNetwork() {
    setAnalysisLoading(true);
    setAnalysisError("");
    setAnalysis(null);
    setFocusComp(null);

    try {
      const response = await fetch("https://routelab-api.onrender.com/analyze-network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Network analysis failed.");
      }

      setAnalysis(data);
    } catch (error) {
      setAnalysisError(error.message);
    } finally {
      setAnalysisLoading(false);
    }
  }

  // Export the complete network and failure records as JSON.
  function exportNetwork() {
    const data = {
      project: "RouteLab",
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      nodes,
      edges,
      failedEdges,
      failedRouters,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "routelab-network.json";
    link.click();

    URL.revokeObjectURL(url);
    setSaveMessage("Network exported successfully");
  }

  // Import a previously exported JSON network.
  function importNetwork(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const imported = validateNetwork(parsed);

        setNodes(imported.nodes);
        setEdges(imported.edges);
        setFailedEdges(imported.failedEdges);
        setFailedRouters(imported.failedRouters);

        const first = imported.nodes[0]?.id || "";
        const last = imported.nodes.at(-1)?.id || "";

        setSource(first);
        setTarget(last);
        setFrom(first);
        setTo(imported.nodes[1]?.id || first);

        setSelected(null);
        clearResults();
        setSaveMessage("Network imported successfully");
        alert("Network imported successfully!");
      } catch (error) {
        alert(`Import failed: ${error.message}`);
      }

      event.target.value = "";
    };

    reader.onerror = () => {
      alert("Could not read the selected file.");
      event.target.value = "";
    };

    reader.readAsText(file);
  }

  // Restore the original 20-router, 31-connection dataset.
  function resetNetwork() {
    const confirmed = window.confirm(
      "Reset RouteLab to its original network? Your current network will be replaced."
    );

    if (!confirmed) return;

    const original = createInitialData();

    setNodes(original.nodes);
    setEdges(original.edges);
    setFailedEdges([]);
    setFailedRouters([]);

    setSource("A");
    setTarget("T");
    setFrom("A");
    setTo("B");
    setWeight("1");
    setNewNode("");

    setSelected(null);
    clearResults();
    setSaveMessage("Original network restored");
  }

  function useRecoveryCandidate(candidate) {
    setFrom(candidate.source);
    setTo(candidate.target);
    setWeight("1");
    navigateTo("builder");
  }

  /* ---------- derived values ---------- */

  const selectedNode =
    selected?.type === "node"
      ? nodes.find((node) => node.id === selected.id)
      : null;

  const selectedEdge =
    selected?.type === "edge"
      ? edges.find((edge) => edge.id === selected.id)
      : null;

  const selectedNeighbors = selectedNode
    ? edges
        .filter(
          (edge) =>
            edge.source === selectedNode.id || edge.target === selectedNode.id
        )
        .map((edge) =>
          edge.source === selectedNode.id ? edge.target : edge.source
        )
    : [];

  const pathNodes = new Set(shortestPath?.path || []);
  const articulationSet = new Set(analysis?.articulation_points || []);
  const bridgeSet = new Set(
    (analysis?.bridges || []).map((b) => [b[0], b[1]].sort().join("|"))
  );

  // router id -> index of its connected component
  const compIndex = new Map();
  (analysis?.components || []).forEach((component, index) =>
    component.forEach((id) => compIndex.set(id, index))
  );

  const hasMultipleComponents = (analysis?.components?.length || 0) > 1;
  const showComponents =
    !!analysis && hasMultipleComponents && overlays.components;
  const showBridges = !!analysis && overlays.bridges;
  const showArticulation = !!analysis && overlays.articulation;

  const graphNodes = nodes.map((node) => {
    const onPath = pathNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    const isArticulation = showArticulation && articulationSet.has(node.id);
    const comp = showComponents ? compIndex.get(node.id) : undefined;
    const palette =
      comp !== undefined ? COMP_COLORS[comp % COMP_COLORS.length] : null;
    const dimmed = focusComp !== null && compIndex.get(node.id) !== focusComp;

    let style = { ...nodeStyle };

    if (palette) {
      style = {
        ...style,
        background: palette.bg,
        border: `1.5px solid ${palette.border}`,
        color: palette.text,
      };
    }

    if (isArticulation) {
      style = {
        ...style,
        border: `3px solid ${COLORS.amber}`,
        boxShadow: "0 0 0 4px rgba(224, 163, 58, 0.22)",
      };

      if (!palette) {
        style = { ...style, background: COLORS.amberBg, color: "#9a5f06" };
      }
    }

    if (onPath) {
      style = {
        ...style,
        background: COLORS.tealBg,
        border: `2px solid ${COLORS.teal}`,
        color: "#0b7a6b",
      };
    }

    if (isSelected) {
      style = {
        ...style,
        border: `2px solid ${COLORS.accent}`,
        boxShadow: "0 0 0 5px rgba(91, 91, 214, 0.16)",
      };
    }

    return {
      ...node,
      data: { label: node.id },
      style: dimmed ? { ...style, opacity: 0.25 } : style,
    };
  });

  const graphEdges = edges.map((edge) => {
    const path = shortestPath?.path || [];

    const isPathEdge = path.some(
      (node, index) =>
        index < path.length - 1 &&
        ((edge.source === node && edge.target === path[index + 1]) ||
          (edge.target === node && edge.source === path[index + 1]))
    );

    const isBridge =
      showBridges && bridgeSet.has([edge.source, edge.target].sort().join("|"));
    const isSelected = selectedEdge?.id === edge.id;

    const edgeComp = showComponents ? compIndex.get(edge.source) : undefined;
    const edgeDimmed =
      focusComp !== null && compIndex.get(edge.source) !== focusComp;

    let stroke =
      edgeComp !== undefined
        ? COMP_COLORS[edgeComp % COMP_COLORS.length].edge
        : COLORS.edge;
    let strokeWidth = 1.75;
    let strokeDasharray;

    if (isBridge) {
      stroke = COLORS.amber;
      strokeWidth = 2.25;
      strokeDasharray = "6 4";
    }
    if (isSelected) {
      stroke = COLORS.accent;
      strokeWidth = 3;
      strokeDasharray = undefined;
    }
    if (isPathEdge) {
      stroke = COLORS.teal;
      strokeWidth = 4;
      strokeDasharray = undefined;
    }

    return {
      ...edge,
      ...edgeBase,
      animated: isPathEdge,
      style: {
        stroke,
        strokeWidth,
        strokeDasharray,
        opacity: edgeDimmed ? 0.2 : 1,
      },
    };
  });

  const failedCount = failedEdges.length + failedRouters.length;

  /* ---------- UI ---------- */

  return (
    <div className="app">
      {/* ---------------- SIDEBAR ---------------- */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">
            <Icon name="router" size={18} />
          </span>
          <span className="brand-name">RouteLab</span>
        </div>

        <nav>
          {NAV_GROUPS.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-label">{group.label}</p>

              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${activeSection === item.id ? "active" : ""}`}
                  onClick={() => navigateTo(item.id)}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="save-dot" />
          {saveMessage}
        </div>
      </aside>

      {/* ---------------- MAIN ---------------- */}
      <main className="main">
        <div className="page-head">
          <h1>Route Lab</h1>
          <span>Synthetic network · graph theory simulation</span>
        </div>

        {/* toolbar */}
        <div className="toolbar">
          <div className="toolbar-chips">
            <span className="chip">
              <Icon name="router" size={16} />
              {nodes.length} routers
            </span>
            <span className="chip">
              <Icon name="link" size={16} />
              {edges.length} connections
            </span>
            <span className={`chip ${failedCount ? "chip-red" : ""}`}>
              <Icon name="alert" size={16} />
              {failedCount} failed
            </span>

            {analysis && (
              <span
                className={`chip ${analysis.is_connected ? "chip-teal" : "chip-red"}`}
              >
                <Icon name={analysis.is_connected ? "check" : "alert"} size={16} />
                {analysis.is_connected ? "Connected" : "Disconnected"}
              </span>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={analyzeNetwork}
            disabled={analysisLoading}
          >
            {analysisLoading ? "Analyzing..." : "Analyze network"}
          </button>
        </div>

        {/* ---------- GRAPH (top) ---------- */}
        <section className="card graph-card" id="graph">
          <div className="card-head">
            <div>
              <h3>Network graph</h3>
              <p>Drag to rearrange. Click a router or connection to inspect or fail it.</p>
            </div>

            <div className="legend">
              <span>
                <i className="dot dot-node" />
                Router
              </span>
              {shortestPath && (
                <span>
                  <i className="dot dot-path" />
                  Shortest path
                </span>
              )}
              {showArticulation && (
                <span>
                  <i className="dot dot-ring" />
                  Articulation point
                </span>
              )}
              {showBridges && (
                <span>
                  <i className="line-swatch" />
                  Bridge
                </span>
              )}
            </div>
          </div>

          {/* analysis layers: shown after "Analyze network" */}
          {analysis && (
            <div className="layers">
              <span className="layers-label">Analysis layers</span>

              <button
                className={`toggle ${overlays.components ? "on" : ""}`}
                onClick={() => toggleLayer("components")}
              >
                Components <b>{analysis.components.length}</b>
              </button>
              <button
                className={`toggle ${overlays.bridges ? "on" : ""}`}
                onClick={() => toggleLayer("bridges")}
              >
                Bridges <b>{analysis.bridges.length}</b>
              </button>
              <button
                className={`toggle ${overlays.articulation ? "on" : ""}`}
                onClick={() => toggleLayer("articulation")}
              >
                Articulation points <b>{analysis.articulation_points.length}</b>
              </button>

              {!hasMultipleComponents && (
                <span className="layers-note">All routers form one component.</span>
              )}

              {showComponents && (
                <div className="comp-legend">
                  {analysis.components.map((component, index) => {
                    const pal = COMP_COLORS[index % COMP_COLORS.length];

                    return (
                      <button
                        key={index}
                        className={`comp-chip ${focusComp === index ? "on" : ""}`}
                        style={{ background: pal.bg, borderColor: pal.border, color: pal.text }}
                        onClick={() => focusComponent(index)}
                        title="Click to focus this component"
                      >
                        <i style={{ background: pal.border }} />
                        Component {index + 1} · {component.length}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="graph-container">
            <ReactFlow
              nodes={graphNodes}
              edges={graphEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={(_, node) => setSelected({ type: "node", id: node.id })}
              onEdgeClick={(_, edge) => setSelected({ type: "edge", id: edge.id })}
              onPaneClick={() => setSelected(null)}
              defaultEdgeOptions={{ type: "straight" }}
              deleteKeyCode={null}
              nodesDraggable
              nodesConnectable={false}
              fitView
              fitViewOptions={{ padding: 0.2 }}
            >
              <Background color="#dcdcea" gap={22} size={1.2} />
              <Controls showInteractive={false} />
              <MiniMap
                pannable
                nodeColor="#c5c7f0"
                maskColor="rgba(246, 246, 250, 0.7)"
              />
            </ReactFlow>

            {/* analysis summary badge */}
            {analysis && (
              <div className="analysis-badge">
                <strong>Analysis result</strong>
                <span>
                  {analysis.components.length} component
                  {analysis.components.length !== 1 ? "s" : ""} ·{" "}
                  {analysis.bridges.length} bridge
                  {analysis.bridges.length !== 1 ? "s" : ""} ·{" "}
                  {analysis.articulation_points.length} articulation point
                  {analysis.articulation_points.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* inspector floating on the graph */}
            {selectedNode && (
              <div className="inspector">
                <div className="insp-head">
                  <div>
                    <span className="insp-kicker">Router</span>
                    <h4>{routerLabel(selectedNode.id)}</h4>
                  </div>
                  <button className="icon-btn" onClick={() => setSelected(null)}>
                    <Icon name="close" size={16} />
                  </button>
                </div>

                <div className="insp-row">
                  <span>Degree</span>
                  <strong>{selectedNeighbors.length}</strong>
                </div>
                <div className="insp-row">
                  <span>Linked to</span>
                  <strong>{selectedNeighbors.map(routerLabel).join(", ") || "None"}</strong>
                </div>

                {analysis && (
                  <div className="insp-row">
                    <span>Analysis</span>
                    <strong
                      className={articulationSet.has(selectedNode.id) ? "amber" : ""}
                    >
                      {articulationSet.has(selectedNode.id)
                        ? "Articulation point"
                        : "Not critical"}
                    </strong>
                  </div>
                )}

                <div className="insp-actions">
                  <button
                    className="btn btn-sm"
                    onClick={() => setSource(selectedNode.id)}
                  >
                    Set as start
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => setTarget(selectedNode.id)}
                  >
                    Set as end
                  </button>
                </div>

                <button
                  className="btn btn-danger btn-block"
                  onClick={() => removeRouter(selectedNode.id)}
                >
                  Fail this router
                </button>
              </div>
            )}

            {selectedEdge && (
              <div className="inspector">
                <div className="insp-head">
                  <div>
                    <span className="insp-kicker">Connection</span>
                    <h4>
                      {routerLabel(selectedEdge.source)} ↔ {routerLabel(selectedEdge.target)}
                    </h4>
                  </div>
                  <button className="icon-btn" onClick={() => setSelected(null)}>
                    <Icon name="close" size={16} />
                  </button>
                </div>

                <div className="insp-row">
                  <span>Delay</span>
                  <strong>{selectedEdge.label}</strong>
                </div>

                {analysis && (
                  <div className="insp-row">
                    <span>Analysis</span>
                    <strong
                      className={
                        bridgeSet.has(
                          [selectedEdge.source, selectedEdge.target].sort().join("|")
                        )
                          ? "amber"
                          : ""
                      }
                    >
                      {bridgeSet.has(
                        [selectedEdge.source, selectedEdge.target].sort().join("|")
                      )
                        ? "Bridge"
                        : "Not critical"}
                    </strong>
                  </div>
                )}

                <button
                  className="btn btn-danger btn-block"
                  onClick={() => removeConnection(selectedEdge.id)}
                >
                  Fail this connection
                </button>
              </div>
            )}

            {!selectedNode && !selectedEdge && (
              <div className="insp-hint">Select a router or connection</div>
            )}
          </div>

          {/* failed components tray */}
          <div className="tray">
            <span className="tray-label">Failed components</span>

            {failedCount === 0 && (
              <span className="tray-empty">
                None. Fail a router or connection to simulate an outage.
              </span>
            )}

            {failedRouters.map((item) => (
              <button
                className="restore-chip"
                key={`r-${item.node.id}`}
                onClick={() => restoreRouter(item.node.id)}
                title="Restore router"
              >
                <Icon name="recovery" size={14} />
                Router {routerLabel(item.node.id)}
              </button>
            ))}

            {failedEdges.map((edge) => (
              <button
                className="restore-chip"
                key={`e-${edge.id}`}
                onClick={() => restoreConnection(edge.id)}
                title="Restore connection"
              >
                <Icon name="recovery" size={14} />
                {routerLabel(edge.source)} ↔ {routerLabel(edge.target)}
              </button>
            ))}
          </div>
        </section>

        {/* ---------- shortest path + failure simulation ---------- */}
        <div className="grid-2">
          <section className="card" id="shortest-path">
            <div className="card-head">
              <div>
                <h3>Shortest path</h3>
                <p>Minimum-delay route using Dijkstra's algorithm.</p>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Start</label>
                <select value={source} onChange={(e) => setSource(e.target.value)}>
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      Router {routerLabel(node.id)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Destination</label>
                <select value={target} onChange={(e) => setTarget(e.target.value)}>
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      Router {routerLabel(node.id)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className="btn btn-primary btn-block"
              onClick={findShortestPath}
              disabled={loading || !nodes.length}
            >
              {loading ? "Calculating..." : "Find shortest path"}
            </button>

            {pathError && <p className="notice notice-red">{pathError}</p>}

            {shortestPath && (
              <div className="metric-block">
                <span className="metric-label">Total delay</span>
                <strong className="metric-value">{shortestPath.total_delay}</strong>

                <div className="path-chips">
                  {shortestPath.path.map((router, index) => (
                    <span key={`${router}-${index}`} className="path-step">
                      <span className="chip chip-teal">{routerLabel(router)}</span>
                      {index < shortestPath.path.length - 1 && (
                        <span className="arrow">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="card" id="failure">
            <div className="card-head">
              <div>
                <h3>Failure simulation</h3>
                <p>Prefer a list? Fail components from here too.</p>
              </div>

              <div className="segmented">
                <button
                  className={failTab === "connections" ? "on" : ""}
                  onClick={() => setFailTab("connections")}
                >
                  Connections
                </button>
                <button
                  className={failTab === "routers" ? "on" : ""}
                  onClick={() => setFailTab("routers")}
                >
                  Routers
                </button>
              </div>
            </div>

            <div className="list">
              {failTab === "connections" &&
                edges.map((edge) => (
                  <div className="row" key={edge.id}>
                    <span>
                      {routerLabel(edge.source)} ↔ {routerLabel(edge.target)}
                      <em>Delay {edge.label}</em>
                    </span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removeConnection(edge.id)}
                    >
                      Fail
                    </button>
                  </div>
                ))}

              {failTab === "routers" &&
                nodes.map((node) => (
                  <div className="row" key={node.id}>
                    <span>Router {routerLabel(node.id)}</span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removeRouter(node.id)}
                    >
                      Fail
                    </button>
                  </div>
                ))}

              {((failTab === "connections" && !edges.length) ||
                (failTab === "routers" && !nodes.length)) && (
                <p className="empty">Nothing left to fail.</p>
              )}
            </div>
          </section>
        </div>

        {/* ---------- analysis + recovery ---------- */}
        <div className="grid-2">
          <section className="card" id="analysis">
            <div className="card-head">
              <div>
                <h3>Critical analysis</h3>
                <p>Components, bridges and articulation points.</p>
              </div>

              <button
                className="btn btn-sm"
                onClick={analyzeNetwork}
                disabled={analysisLoading}
              >
                {analysisLoading ? "Analyzing..." : "Run analysis"}
              </button>
            </div>

            {analysisError && <p className="notice notice-red">{analysisError}</p>}

            {!analysis && !analysisError && (
              <p className="empty">
                Run an analysis to see the results here. Bridges and articulation
                points are also highlighted on the graph.
              </p>
            )}

            {analysis && (
              <>
                <div className="metrics">
                  <div>
                    <span>Components</span>
                    <strong>{analysis.component_count}</strong>
                  </div>
                  <div>
                    <span>Bridges</span>
                    <strong>{analysis.bridges.length}</strong>
                  </div>
                  <div>
                    <span>Articulation points</span>
                    <strong>{analysis.articulation_points.length}</strong>
                  </div>
                </div>

                <p
                  className={`notice ${analysis.is_connected ? "notice-teal" : "notice-red"}`}
                >
                  {analysis.is_connected
                    ? "The active network is connected."
                    : "The active network is disconnected."}
                </p>

                <p className="hint">Click any result to locate it on the graph.</p>

                <h5>Connected components</h5>
                {analysis.components.map((component, index) => {
                  const pal = COMP_COLORS[index % COMP_COLORS.length];

                  return (
                    <button
                      className={`row row-btn ${focusComp === index ? "on" : ""}`}
                      key={index}
                      onClick={() => focusComponent(index)}
                    >
                      <span>
                        {hasMultipleComponents && (
                          <i className="swatch" style={{ background: pal.border }} />
                        )}
                        <strong>Component {index + 1}</strong>
                        <em>{component.map(routerLabel).join(", ")}</em>
                      </span>
                    </button>
                  );
                })}

                <h5>Bridge connections</h5>
                {analysis.bridges.length ? (
                  <div className="tags">
                    {analysis.bridges.map((bridge, index) => (
                      <button
                        className="chip chip-amber chip-btn"
                        key={index}
                        onClick={() => focusBridge(bridge)}
                      >
                        {routerLabel(bridge[0])} ↔ {routerLabel(bridge[1])}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="empty">No bridges detected.</p>
                )}

                <h5>Articulation points</h5>
                {analysis.articulation_points.length ? (
                  <div className="tags">
                    {analysis.articulation_points.map((point) => (
                      <button
                        className="chip chip-amber chip-btn"
                        key={point}
                        onClick={() => focusRouter(point)}
                      >
                        {point}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="empty">No articulation points detected.</p>
                )}
              </>
            )}
          </section>

          <section className="card" id="recovery">
            <div className="card-head">
              <div>
                <h3>Recovery</h3>
                <p>Backup links that would reconnect separated groups.</p>
              </div>
            </div>

            {!analysis && (
              <p className="empty">
                Run the analysis to generate recovery suggestions.
              </p>
            )}

            {analysis &&
              (analysis.recovery_candidates.length ? (
                <div className="list">
                  {analysis.recovery_candidates.map((candidate, index) => (
                    <div className="row" key={index}>
                      <span>
                        {routerLabel(candidate.source)} ↔ {routerLabel(candidate.target)}
                      </span>
                      <button
                        className="btn btn-ok btn-sm"
                        onClick={() => useRecoveryCandidate(candidate)}
                      >
                        Use as backup link
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty">
                  No disconnected components need a backup connection.
                </p>
              ))}
          </section>
        </div>

        {/* ---------- builder + data ---------- */}
        <div className="grid-2">
          <section className="card" id="builder">
            <div className="card-head">
              <div>
                <h3>Network builder</h3>
                <p>Add routers and weighted connections.</p>
              </div>
            </div>

            <label className="group-label">Add router</label>
            <div className="inline">
              <input
                value={newNode}
                onChange={(e) => setNewNode(e.target.value)}
                placeholder="Router name"
              />
              <button className="btn" onClick={addNode}>
                Add router
              </button>
            </div>

            <label className="group-label">Add connection</label>
            <div className="inline">
              <select value={from} onChange={(e) => setFrom(e.target.value)}>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {routerLabel(node.id)}
                  </option>
                ))}
              </select>

              <select value={to} onChange={(e) => setTo(e.target.value)}>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {routerLabel(node.id)}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0.01"
                step="any"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                aria-label="Delay"
              />

              <button className="btn" onClick={addEdge}>
                Connect
              </button>
            </div>
          </section>

          <section className="card" id="data-management">
            <div className="card-head">
              <div>
                <h3>Data management</h3>
                <p>{saveMessage}. Export a JSON backup for a separate copy.</p>
              </div>
            </div>

            <div className="inline">
              <button className="btn" onClick={exportNetwork}>
                Export JSON
              </button>

              <label className="btn upload">
                Import JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={importNetwork}
                />
              </label>

              <button className="btn btn-danger" onClick={resetNetwork}>
                Reset network
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;