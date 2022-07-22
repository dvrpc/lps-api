import pytest

endpoint = "api/lps/v1/hexbins"


@pytest.mark.parametrize("station,year", [("abc", 2013), (96, "abc")])
def test_422_when_parameter_cannot_be_converted_to_int(client, station, year):
    response = client.get(endpoint + f"?station={station}&year={year}")
    assert response.status_code == 422


@pytest.mark.parametrize("station,year", [("", 2013), (96, "")])
def test_422_when_parameter_is_missing(client, station, year):
    response = client.get(endpoint + f"?station={station}&year={year}")
    assert response.status_code == 422


@pytest.mark.parametrize("station,year", [(999, 2018), (96, 2014)])
def test_404_when_no_matching_station_year(client, station, year):
    response = client.get(endpoint + f"?station={station}&year={year}")
    assert response.status_code == 404


@pytest.mark.parametrize("station,year", [("96", 2013), (96, "2019")])
def test_200_when_parameter_converted_to_int_successfully(client, station, year):
    response = client.get(endpoint + f"?station={station}&year={year}")
    assert response.status_code == 200


@pytest.mark.parametrize(
    "station,year,count_hexbins,total_vehicles",
    [(96, 2013, 50, 207), (96, 2019, 42, 86), (1, 2017, 64, 155), (189, 2019, 31, 101)],
)
def test_success_spot_check(client, station, year, count_hexbins, total_vehicles):
    """Stations being checked:
    96: Miquon
    1: 46th Street
    189: Wallingford
    """
    response = client.get(endpoint + f"?station={station}&year={year}")
    sum_vehicles = 0
    for hexbin in response.json():
        sum_vehicles += hexbin["count"]

    assert response.status_code == 200
    assert len(response.json()) == count_hexbins
    assert sum_vehicles == total_vehicles
