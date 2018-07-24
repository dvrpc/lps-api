from django.http import HttpResponse, JsonResponse
from lib import secret as c
import psycopg2 as psql

def index(request):
    return HttpResponse('this is the index page')

def StationYear(request):
    this = request.get_full_path().split('?')[1].split('&')
    var = []
    for i in this:
        temp = i.split('=')
        var.append(str(temp[1]))
    conn = psql.connect("dbname='{}' user='{}' host='{}' password='{}'".format(c.DB_NAME, c.DB_USER, c.DB_HOST, c.DB_PASS)) # connect to super secret db
    cur = conn.cursor()
    cur.execute(c.STATION_YEAR_QUERY.format(var[0], var[1])) # query super secret db with parameters
    rows = cur.fetchall()
    payload = []
    for r in rows:        # create json with returned data from super secret db
        record = {
            'id' : r[0],
            'count': int(r[3])
        }
        payload.append(record)
    if len(payload) == 0:
        return HttpResponse("Invalid request") # you didn't do it right
    else:
        return JsonResponse(payload, safe=False) # do it


