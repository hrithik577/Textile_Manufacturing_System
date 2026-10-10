"""Multi-criteria recovery option scoring and trade-off evaluation."""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from intelligence.models import RecoveryOption


class ScoringWeights(BaseModel):
    """Configurable weights for multi-criteria recovery ranking."""
    delivery_impact_weight: float = Field(default=0.35, description="Weight for delay reduction / on-time recovery")
    feasibility_weight: float = Field(default=0.25, description="Weight for operational & machine feasibility")
    cost_efficiency_weight: float = Field(default=0.20, description="Weight for minimizing extra financial expenditure")
    operational_risk_weight: float = Field(default=0.20, description="Weight for avoiding quality or downstream risk")


class OptionScorer:
    """Evaluates and scores recovery alternatives with transparent criteria breakdown."""

    def __init__(self, weights: Optional[ScoringWeights] = None):
        self.weights = weights or ScoringWeights()

    def score_option(self, option: RecoveryOption) -> RecoveryOption:
        """Scores an individual recovery option. Infeasible options receive score 0.0."""
        if not option.feasible:
            option.score = 0.0
            option.score_breakdown = {
                "delivery_impact": 0.0,
                "feasibility": 0.0,
                "cost_efficiency": 0.0,
                "operational_risk": 0.0,
                "final_score": 0.0,
            }
            return option

        # 1. Delivery Impact (0 to 100): More delay reduction = higher score
        # Assume 240 mins (4 hours) reduction is a top 100 score
        delay_red = option.estimated_delay_reduction_minutes or 0.0
        delivery_score = min(100.0, max(0.0, (delay_red / 240.0) * 100.0))

        # 2. Feasibility (0 to 100)
        feasibility_score = 90.0 if option.feasible else 0.0

        # 3. Cost Efficiency (0 to 100): Lower cost = higher score
        # $0 cost = 100, $1000 cost = 0
        cost = option.estimated_additional_cost or 0.0
        cost_score = max(0.0, 100.0 - (cost / 10.0))

        # 4. Operational & Quality Risk (0 to 100): Low risk = high score
        risk_map = {"low": 90.0, "medium": 60.0, "high": 20.0}
        risk_score = risk_map.get(option.quality_and_safety_risk.lower(), 50.0)

        # Weighted composite score
        w = self.weights
        composite = (
            w.delivery_impact_weight * delivery_score
            + w.feasibility_weight * feasibility_score
            + w.cost_efficiency_weight * cost_score
            + w.operational_risk_weight * risk_score
        )

        option.score = round(composite, 2)
        option.score_breakdown = {
            "delivery_impact": round(delivery_score, 1),
            "feasibility": round(feasibility_score, 1),
            "cost_efficiency": round(cost_score, 1),
            "operational_risk": round(risk_score, 1),
            "final_score": round(composite, 2),
        }
        return option

    def rank_options(self, options: List[RecoveryOption]) -> List[RecoveryOption]:
        """Scores all options and returns them sorted by score descending (feasible first)."""
        scored = [self.score_option(opt) for opt in options]
        # Feasible options come first, ranked by score
        scored.sort(key=lambda o: (o.feasible, o.score), reverse=True)
        return scored
