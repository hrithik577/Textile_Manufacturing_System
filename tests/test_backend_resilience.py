"""Tests covering network resilience, missing data, timeouts, and malformed API responses."""

from unittest.mock import MagicMock, patch
import pytest
import requests
from intelligence.data_access import HttpBackendAdapter, InMemoryBackendAdapter
from intelligence.deadline_predictor import DeadlinePredictor
from intelligence.models import RecoveryPlanStatus
from simulator.models import ProductionOrder


def test_missing_machine_data_handled_gracefully():
    """Verify that predictor handles orders with unknown or missing machine IDs without crashing."""
    from datetime import datetime, timedelta
    now = datetime(2026, 10, 10, 10, 0, 0)
    order = ProductionOrder(
        order_id="PO-ORPHAN-01",
        customer_name="Unknown Client",
        fabric_type="Cotton",
        ordered_quantity=500.0,
        deadline=now + timedelta(hours=12),
        created_at=now,
        assigned_machine_ids=["M-NON-EXISTENT-99"],
    )

    predictor = DeadlinePredictor()
    # Pass empty machine list
    assessments = predictor.predict_deadlines([order], [], now)

    assert len(assessments) == 1
    assert assessments[0].order_id == "PO-ORPHAN-01"
    assert assessments[0].confidence_level == "qualified_estimate"


def test_http_adapter_timeout_handling():
    """Verify HttpBackendAdapter surfaces network timeouts cleanly."""
    adapter = HttpBackendAdapter(base_url="http://192.0.2.1:9999", timeout=0.01)

    with patch.object(adapter.session, "get", side_effect=requests.exceptions.Timeout("Connection timed out")):
        with pytest.raises(requests.exceptions.Timeout):
            adapter.get_machines()


def test_http_adapter_malformed_response_handling():
    """Verify HttpBackendAdapter surfaces deserialization errors cleanly when receiving bad payload."""
    adapter = HttpBackendAdapter(base_url="http://localhost:8000")

    mock_resp = MagicMock()
    mock_resp.json.return_value = [{"invalid_field": 123}]  # Missing required machine fields
    mock_resp.raise_for_status = MagicMock()

    with patch.object(adapter.session, "get", return_value=mock_resp):
        with pytest.raises(Exception):
            adapter.get_machines()
