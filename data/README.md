# Instructions for Data Updates

The database name is "licenseplate", on the cloud.dvrpc.org servers.

To add additional surveyed stations, a CSV file in the format "surveyyear,survey_id,geom" (with that also being the header line) is required (from the GIS department). Import it into a local version of the database via the update_points_from_csv.py script in this directory.

There's a test that verifies that the total count of the "points" table (data from the surveys), in tests/test_points.py. Update this to what it should be (create a new assert statement from the previous one, adding the new number of records). Once the import is done, run the tests (`python -m pytest tests`, from the root directory in an activated virtual environment) to ensure the import is successful.

After a successful data import, backup the local database. From the postgres account, run `pg_dump -O -Fc licensplate > licenseplate_DATE_HERE.pgc`. Then use the cloud-ansible (https://github.com/dvrpc/cloud-ansible) project to restore it on the server.

Add the data update to the record below.

Data updates:
  * 7/21/2022: added the data from the Fall_2021_Spring_2022_origins_for_web_app.csv file. The "points" table of the database now has 80,327 records.
  * 8/4/2021: added the data from the Miquon_2019.csv file. "points" table contains 77,379 records.
  * 10/5/2020: added the data from the stations-2019.csv and the points2019crp.csv files.
