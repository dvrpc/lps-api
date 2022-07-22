import argparse
import csv
import sys

import psycopg

sys.path.append("..")
from config import PG_CREDS


# get filename (passed into program with "python3 update_points_from_csv.py file_name.csv")
parser = argparse.ArgumentParser()
parser.add_argument("data_file")
args = parser.parse_args()


with open(args.data_file, newline="") as csvfile:
    reader = csv.DictReader(csvfile, delimiter=",")
    with psycopg.connect(PG_CREDS) as conn:
        for row in reader:
            conn.execute(
                "INSERT INTO points (surveyyear, survey_id, geom) VALUES (%s, %s, %s)",
                (row["surveyyear"], row["survey_id"], row["geom"]),
            )

        conn.commit()
