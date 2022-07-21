import pytest

endpoint = "api/lps/v1/stations"


def test_success_spot_check(client):
    response = client.get(endpoint)
    assert response.status_code == 200
    assert len(response.json()) > 0
