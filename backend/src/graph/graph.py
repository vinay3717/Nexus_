"""
graph.py — creates the LangGraph StateGraph and wires conditional edges.

Day 2 status: only router_node and error_handler are real. Every other node
is a stub passthrough so the graph compiles and can be exercised end-to-end
by tests/integration/test_full_graph_flow.py once real nodes land.

Architecture principles followed:
- Additive extension: NODE_REGISTRY is the single place new nodes get added.
  Adding a node never requires editing existing node functions.
- Model independence: stub nodes don't call any LLM; real nodes will receive
  `llm` via model_router.get_model(state["task_type"]).
"""

from langgraph.graph import StateGraph, END

from src.graph.state import NexusState
from src.graph.nodes.router_node import router_node, ROUTING_MAP
from src.graph.nodes.error_handler import error_handler


def _make_stub_node(name: str):
    """
    Returns a passthrough node function for nodes not yet implemented.

    Stub nodes do not mutate state except to set next_action so the graph
    keeps moving during early development / tests.
    """

    def _stub(state: NexusState) -> NexusState:
        return {**state, "next_action": state.get("next_action", "retry")}

    _stub.__name__ = f"stub_{name}"
    return _stub


# Every node that exists in the architecture, real or stub.
# Real implementations replace the stub entry as they're built (Days 2-5).
NODE_REGISTRY = {
    "router_node": router_node,           # real (Feature 7)
    "error_handler": error_handler,       # real (Feature 7)
    "personality_quiz": _make_stub_node("personality_quiz"),       # Feature 8
    "skill_assessment": _make_stub_node("skill_assessment"),       # Feature 9
    "roadmap_generator": _make_stub_node("roadmap_generator"),     # Feature 13
    "level_gate": _make_stub_node("level_gate"),                   # Feature 18
    "adaptive_sublevel": _make_stub_node("adaptive_sublevel"),     # Feature 19
    "rejection_handler": _make_stub_node("rejection_handler"),     # Feature 20
    "gamification": _make_stub_node("gamification"),               # Feature 24
}

# Destination names that conditional edges may route to, including the
# special LangGraph END sentinel for "complete".
_ALL_DESTINATIONS = set(NODE_REGISTRY.keys()) | {"__end__"}


def _route_after(state: NexusState) -> str:
    """
    Conditional edge function: every node (except router_node/error_handler
    themselves) routes through this after running, which delegates to
    router_node's ROUTING_MAP via router_node().
    """
    dest = router_node(state)
    return END if dest == "__end__" else dest


def build_graph():
    """
    Construct and compile the NexusState StateGraph.

    Wiring:
    - Entry point: router_node (reads initial next_action to pick first real node)
    - Every worker node -> conditional edge via _route_after -> next node
    - error_handler -> router_node (re-route after recovery decision)
    """
    graph = StateGraph(NexusState)

    for name, fn in NODE_REGISTRY.items():
        graph.add_node(name, fn)

    graph.set_entry_point("router_node")

    # router_node itself just decides where to go first.
    graph.add_conditional_edges(
        "router_node",
        _route_after,
        {name: name for name in _ALL_DESTINATIONS if name != "__end__"} | {END: END},
    )

    # Every worker node (everything except router_node and error_handler)
    # routes onward via the same conditional edge logic.
    worker_nodes = [n for n in NODE_REGISTRY if n not in ("router_node", "error_handler")]
    for name in worker_nodes:
        graph.add_conditional_edges(
            name,
            _route_after,
            {dest: dest for dest in _ALL_DESTINATIONS if dest != "__end__"} | {END: END},
        )

    # error_handler always loops back to router_node to re-route.
    graph.add_edge("error_handler", "router_node")

    return graph.compile()
