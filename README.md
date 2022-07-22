# License Plate Survey (LPS) API

Base URL: https://cloud.dvrpc.org/api/lps/

Documentation: http://cloud.dvrpc.org/api/lps/v1/docs

## Development Setup

First, create, activate, and setup up a virtual environment:

```
python3 -m venv ve
. ve/bin/activate
pip install -r requirements-dev.txt
```

If it does not already exist, create and restore the Postgresql database:

```
createdb licenseplate
pg_restore -d licenseplate data/NAME_OF_BACKUP.pgc
```

Create a config.py file in this top-level directory, declaring a variable for connecting to the database, in the format:

```python
PG_CREDS = "postgres://YOUR_USERNAME:YOURPASSWORD@localhost:PORT/licenseplate"
```

Run the dev server: `uvicorn main:app --reload`. The docs for it will be at <http://127.0.0.1:8000/api/lps/v1/docs>.

## Tests

Create, activate, and setup a virtual environment as above, and then run: `python -m pytest tests`.

To see test coverage:
```
# stdout results
python -m pytest --cov=main
# html results
python -m pytest --cov=main --cov-report=html
```
