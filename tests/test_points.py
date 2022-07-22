import sys

import psycopg
import pytest

sys.path.append("..")
from config import PG_CREDS


def test_points_count():
    """
    Check count of points in database.
    Before/after adding new survey data, check and update the assertion below to ensure
    the proper number of insertions. Comment out previous assertions and add a new one with
    the date.
    Also keep a record of updates in the data/README.me file.
    """
    with psycopg.connect(PG_CREDS) as conn:
        result = conn.execute("""SELECT COUNT(*) FROM points""").fetchone()

    # number of points prior to insertion of Fall 2021/Spring 2022 surveys
    # assert result[0] == 77379

    # number of points after insertion of Fall 2021/Spring 2022 surveys
    assert result[0] == 77379 + 2948
