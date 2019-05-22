# DVRPC License Plate Survey (LPS) Guide
---

### **Overview**
The backend of this project is running on a PostGIS enabled PostgreSQL 9.5 database using a Python Django REST Framework API 

> Python Dependencies
- Python 2.7
- Django v1.11.14
- Psycopg2 v2.7.5

#### **Root URL:** `https://alpha.dvrpc.org/api/lps/query?<query parameters>`

Parameters:
- `station=<Station Name>`
- `year=<Survey Year>`
