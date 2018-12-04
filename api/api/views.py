from django.http import HttpResponse, JsonResponse
from lib import secret as c
import psycopg2 as psql
import re

def index(request):
    return HttpResponse('this is the index page')

def StationYear(request):
    station = re.compile(r'(?=(^\w{7}=(\w+(?=(.*&))))|&(\w{4}=(\d{4})))')
    this = request.get_full_path().split('?')[1]
    var = []
    for i in re.findall(station, this):
        if 'station' in i[0]:
            if '&' == i[2][-1]:
                var.append(str(i[1]+i[2][:-1]))
            else:
                var.append(str(i[1]))
        elif 'year' in i[-2]:
            var.append(int(i[-1]))
    if len(var) != 2:
        return HttpResponse('error')
    if '%20' in var[0]:
        var[0] = var[0].replace('%20', ' ')
    conn = psql.connect("dbname='{}' user='{}' host='{}' password='{}'".format(c.DB_NAME, c.DB_USER, c.DB_HOST, c.DB_PASS)) # connect to super secret db
    cur = conn.cursor()
    cur.execute(c.STATION_YEAR_QUERY, [var[0], var[1]]) # query super secret db with parameters
    rows = cur.fetchall()
    payload = []
    for r in rows:        # create json with returned data from super secret db
        record = {
            'id' : r[0],
            'count': int(r[3])
        }
        payload.append(record)
    if len(payload) == 0:
        record ={
            'error': 'Internal Server Error',
            'code': 500
        }
    return JsonResponse(payload, safe=False) # do it

def options(request):
    conn = psql.connect("dbname='{}' user='{}' host='{}' password='{}'".format(c.DB_NAME, c.DB_USER, c.DB_HOST, c.DB_PASS)) # connect to super secret db
    cur = conn.cursor()
    cur.execute("""SELECT station, surveyyear, operator, mode, line, dvrpc_id FROM points GROUP BY station, surveyyear, operator, mode, line, dvrpc_id ORDER BY station, surveyyear, operator, mode;""")
    rows = cur.fetchall()
    payload = list()
    stations = []
    cntr = 0
    for r in rows:
        if str(r[0]) in stations:
            for i,v in enumerate(payload):
                if str(r[0]) in payload[i]:
                    payload[i][str(r[0])]['years'].append(int(r[1]))
        else:
            record = {
                str(r[0]): {
                    'id': r[5],
                    'operator': r[2],
                    'mode': r[3],
                    'line': r[4],
                    'years': []
                }
            }
            record[str(r[0])]['years'].append(int(r[1]))
            stations.append(str(r[0]))
            payload.append(record)
        cntr+=1
    return JsonResponse(payload, safe=False)

