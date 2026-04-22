#!/usr/bin/env python3
import json
import sys
from itertools import combinations

try:
    from ortools.sat.python import cp_model
except Exception as exc:
    print(json.dumps({"error": f"Failed to import OR-Tools: {exc}"}))
    sys.exit(2)


def solve_round_robin(participants):
    n = len(participants)
    rounds_count = n - 1 if n % 2 == 0 else n
    slots_per_round = n // 2

    model = cp_model.CpModel()
    pairs = list(combinations(range(n), 2))

    x = {}
    for r in range(rounds_count):
        for (i, j) in pairs:
            x[(r, i, j)] = model.NewBoolVar(f"x_r{r}_p{i}_{j}")

    # Each pair plays exactly once.
    for (i, j) in pairs:
        model.Add(sum(x[(r, i, j)] for r in range(rounds_count)) == 1)

    # Each participant can play at most one match per round.
    for r in range(rounds_count):
        for p in range(n):
            model.Add(
                sum(
                    x[(r, i, j)]
                    for (i, j) in pairs
                    if i == p or j == p
                )
                <= 1
            )

    # Fill expected slots in each round.
    for r in range(rounds_count):
        model.Add(sum(x[(r, i, j)] for (i, j) in pairs) == slots_per_round)

    # Simple symmetry-breaking to speed up.
    if rounds_count > 0:
        model.Add(x[(0, 0, 1)] == 1)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 8.0
    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return None

    rounds = []
    for r in range(rounds_count):
        current_round = []
        for (i, j) in pairs:
            if solver.Value(x[(r, i, j)]) == 1:
                current_round.append([participants[i], participants[j]])
        rounds.append(current_round)
    return rounds


def solve_single_round(participants):
    pairs = []
    for idx in range(0, len(participants) - 1, 2):
        pairs.append([participants[idx], participants[idx + 1]])
    return [pairs]


def solve_swiss(participants, rounds_requested=None):
    n = len(participants)
    max_unique_rounds = n - 1 if n % 2 == 0 else n
    requested_rounds = rounds_requested or min(5, max_unique_rounds)
    target_rounds = min(requested_rounds, max_unique_rounds)

    rounds = []
    pair_history = set()
    bye_counts = {idx: 0 for idx in range(n)}
    rank_order = {idx: idx for idx in range(n)}
    jam_prevented = False

    for _round in range(target_rounds):
        model = cp_model.CpModel()
        use_dummy = (n % 2 == 1)
        dummy = n if use_dummy else None
        pool = list(range(n)) + ([dummy] if use_dummy else [])
        variables = {}
        edge_costs = {}

        for i in range(len(pool)):
            for j in range(i + 1, len(pool)):
                a, b = pool[i], pool[j]
                key = (a, b)

                if dummy not in key:
                    pair_key = tuple(sorted((a, b)))
                    if pair_key in pair_history:
                        continue
                    distance = abs(rank_order[a] - rank_order[b])
                    edge_costs[key] = distance
                else:
                    player = a if b == dummy else b
                    # Prevent repeat byes whenever possible.
                    edge_costs[key] = 1000 * bye_counts[player]

                variables[key] = model.NewBoolVar(f"m_{a}_{b}")

        # Every participant must be in exactly one pairing in this round.
        for player in range(n):
            model.Add(
                sum(var for (a, b), var in variables.items() if a == player or b == player) == 1
            )

        if use_dummy:
            model.Add(
                sum(var for (a, b), var in variables.items() if a == dummy or b == dummy) == 1
            )

        if not variables:
            jam_prevented = True
            break

        model.Minimize(sum(edge_costs[key] * var for key, var in variables.items()))

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 4.0
        status = solver.Solve(model)
        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            jam_prevented = True
            break

        round_pairs = []
        for (a, b), var in variables.items():
            if solver.Value(var) != 1:
                continue
            if dummy in (a, b):
                player = a if b == dummy else b
                bye_counts[player] += 1
                continue

            pair_key = tuple(sorted((a, b)))
            pair_history.add(pair_key)
            round_pairs.append([participants[a], participants[b]])

        if not round_pairs and n > 1:
            jam_prevented = True
            break

        rounds.append(round_pairs)

    diagnostics = {
        "requested_rounds": requested_rounds,
        "target_rounds": target_rounds,
        "produced_rounds": len(rounds),
        "max_unique_rounds": max_unique_rounds,
        "jam_prevented": jam_prevented or len(rounds) < target_rounds or requested_rounds > max_unique_rounds,
    }
    return rounds, diagnostics


def main():
    raw = sys.stdin.read()
    payload = json.loads(raw or "{}")
    participants = payload.get("participants", [])
    strategy = payload.get("strategy", "round-robin")
    rounds_requested = payload.get("roundsRequested")

    if len(participants) < 2:
        print(
            json.dumps(
                {
                    "source": "python-ortools",
                    "summary": "Not enough participants to optimize.",
                    "rounds": [],
                }
            )
        )
        return

    if strategy == "single-round":
        rounds = solve_single_round(participants)
        print(
            json.dumps(
                {
                    "source": "python-ortools",
                    "summary": f"Generated {len(rounds)} round using single-round strategy.",
                    "rounds": rounds,
                }
            )
        )
        return

    if strategy == "swiss":
        rounds, diagnostics = solve_swiss(participants, rounds_requested=rounds_requested)
        summary = (
            f"Swiss schedule generated with {len(rounds)} rounds."
            if not diagnostics["jam_prevented"]
            else f"Swiss jam prevented: generated {len(rounds)} feasible rounds (requested {diagnostics['requested_rounds']}, max {diagnostics['max_unique_rounds']})."
        )
        print(
            json.dumps(
                {
                    "source": "python-ortools",
                    "summary": summary,
                    "rounds": rounds,
                    "diagnostics": diagnostics,
                }
            )
        )
        return

    rounds = solve_round_robin(participants)
    if rounds is None:
        print(json.dumps({"error": "No feasible OR-Tools solution found"}))
        sys.exit(3)

    print(
        json.dumps(
            {
                "source": "python-ortools",
                "summary": f"Generated {len(rounds)} optimized rounds using OR-Tools CP-SAT.",
                "rounds": rounds,
                "diagnostics": {"participants": len(participants)},
            }
        )
    )


if __name__ == "__main__":
    main()
