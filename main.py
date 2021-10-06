from contextlib import contextmanager
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
import psycopg2
from pydantic import BaseModel

from config import PG_CREDS


class HexbinResponse(BaseModel):
    count: int
    hex_id: int


class StationResponse(BaseModel):
    id: int
    name: str
    mode: Optional[str]
    line: str
    operator: Optional[str]
    years: list


class Message(BaseModel):
    message: str


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="DVRPC LPS API",
        version="1.0",
        description=(
            "Application Programming Interface for the Delaware Valley Regional "
            "Planning Commission's station survey data in the region."
        ),
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app = FastAPI(openapi_url="/api/lps/v1/openapi.json", docs_url="/api/lps/v1/docs")
app.openapi = custom_openapi
responses = {
    404: {"model": Message, "description": "Not Found"},
}
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@contextmanager
def db(conn_string):
    conn = psycopg2.connect(conn_string)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            yield cur
    finally:
        conn.close()


@app.get(
    "/api/lps/v1/hexbins",
    response_model=List[HexbinResponse],
    responses=responses,
)
def hexbins(station: int, year: int):
    """Get hexbins, and count of commuters, from which commuters traveled to a station/year."""
    with db(PG_CREDS) as cur:
        cur.execute(
            """
            WITH a AS (
                SELECT points.survey_id as id,
                    points.count as count,
                    points.surveyyear as year,
                    points.geom
                FROM points
                JOIN stations ON points.survey_id = stations.survey_id
            )

            SELECT hexbins.gid as hex_id,
                SUM(a.count) as count
            FROM a, hexbins
            WHERE
                (a.id = '%s' and a.year = '%s')
                AND
                ST_Within(a.geom, hexbins.geom)
            GROUP BY
                hexbins.gid,
                hexbins.geom,
                a.id
            ORDER BY id
        """,
            (station, year),
        )
        result = cur.fetchall()

    if not result:
        return JSONResponse(
            status_code=404,
            content={"message": "No matching results for provided station and year"},
        )

    hexbins = []
    for row in result:
        hexbins.append({"hex_id": str(row[0]), "count": int(row[1])})
    return hexbins


@app.get(
    "/api/lps/v1/stations",
    response_model=List[StationResponse],
    responses=responses,
)
def stations():
    """Get station information, including years surveyed."""
    with db(PG_CREDS) as cur:
        cur.execute(
            """
            SELECT
                stations.survey_id as id,
                stations.name as name,
                stations.type as type,
                stations.line as line,
                stations.operator as operator,
                points.surveyyear as year
            FROM stations
            JOIN points ON stations.survey_id = points.survey_id
            GROUP BY id, name, type, stations.line, stations.operator, year
            ORDER BY name
            """
        )
        result = cur.fetchall()

        cur.execute(
            """
                SELECT DISTINCT survey_id, surveyyear
                FROM points
                ORDER BY survey_id, surveyyear
            """
        )
        year_per_station = cur.fetchall()

    if not result:
        return []

    stations = []
    for row in result:
        stations.append(
            {
                "id": row[0],
                "name": row[1],
                "mode": row[2],
                "line": row[3],
                "operator": row[4],
                "years": [yps[1] for yps in year_per_station if yps[0] == row[0]],
            }
        )
    return stations
