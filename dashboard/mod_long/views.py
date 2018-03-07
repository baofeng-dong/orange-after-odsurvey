# Copyright (C) 2017 Baofeng Dong
# This program is released under the "MIT License".
# Please see the file COPYING in the source
# distribution of this software for license terms.


import os, sys, json
import time
from decimal import Decimal

from flask import Blueprint, redirect, url_for,render_template, jsonify, request
from sqlalchemy import func
from sqlalchemy.orm import aliased
from geoalchemy2 import functions as geofunc

from dashboard import Session as Session
from dashboard import debug, error
from ..shared.models import Stops, SurveysCore, CallbackFlag as CFlag
from ..shared.helper import Helper as h
from .helper import Helper
from .auth import Auth

from dashboard.mod_long import fields as F

STATIC_DIR = '/long'
mod_long = Blueprint('long', __name__, url_prefix='/long')

def static(html, static=STATIC_DIR):
    """returns correct path to static directory"""
    return os.path.join(static, html)

@mod_long.route('/')
def index():
    return render_template('long/index.html')

@mod_long.route('/data')
def data():
    """Sets up table headers and dropdowns in template"""
    headers = ['Date', 'Time', 'Surveyor', 'Route', 'Direction', 'On Stop', 'Off Stop', 'Hop']
    routes = [ route['rte_desc'] for route in Helper.get_routes() ]
    directions = h.get_directions()
    users = Helper.get_users()

    return render_template('long/data.html',
            routes=routes, directions=directions, headers=headers,
            users=users)


@mod_long.route('/data/_query', methods=['GET'])
def data_query():
    response = []
    user = ""
    rte_desc = ""
    dir_desc = ""
    csv = False

    if 'rte_desc' in request.args.keys():
        rte_desc = request.args['rte_desc'].strip()
        debug(rte_desc)
    if 'dir_desc' in request.args.keys():
        dir_desc = request.args['dir_desc'].strip()
        debug(dir_desc)
    if 'user' in request.args.keys():
        user = request.args['user'].strip()
        debug(user)
    if 'csv' in request.args.keys():
        csv = request.args['csv']
        debug(csv)

    if csv:
        data = Helper.query_route_data(
            user=user, rte_desc=rte_desc, dir_desc=dir_desc,csv=csv
        )
        response = ""
        # build csv string
        for record in data:
            response += ','.join(record) + '\n'
    else:
        response = Helper.query_route_data(
            user=user, rte_desc=rte_desc, dir_desc=dir_desc
        )

    return jsonify(data=response)

@mod_long.route('/status')
def status():
    routes = [ route['rte_desc'] for route in Helper.get_routes() ]
    data = Helper.query_route_status()
    web_session = Session()
    query = web_session.execute("""
        SELECT s.rte_desc, sum(s.count) AS count
        FROM odk.records_long s
        WHERE s.rte_desc LIKE 'Portland Streetcar%'
        GROUP BY s.rte_desc;""")
    #hardcode streetcar targets, then populate the count
    streetcar = {
            "Portland Streetcar - NS Line":{'target':869, 'count':0},
            "Portland Streetcar - A Loop":{'target':331, 'count':0},
            "Portland Streetcar - B Loop":{'target':343, 'count':0}
    }
    for record in query:
        debug(record)
        streetcar[record[0]]['count'] = int(record[1])
    web_session.close()
    summary = Helper.query_routes_summary()
    return render_template('long/status.html', 
            streetcar=streetcar, routes=routes, data=data, summary=summary)

@mod_long.route('/surveyors')
def surveyor_status():
    return render_template('long/surveyors.html')


@mod_long.route('/surveyors/_summary', methods=['GET'])
def surveyor_summary_query():
    response = []
    date = time.strftime("%d-%m-%Y")

    if 'date' in request.args.keys():
        date = request.args['date'].strip()

    response = Helper.current_users(date)
    #debug(response)
    return jsonify(users=response)

"""
def query_locations(uri):
    ret_val = {}
    On = aliased(Stops)
    Off = aliased(Stops)
    session = Session()
    record = session.query(
        SurveysCore.uri,
        func.ST_AsGeoJSON(func.ST_Transform(SurveysCore.orig_geom, 4326))
            .label('orig_geom'),
        func.ST_AsGeoJSON(func.ST_Transform(SurveysCore.dest_geom, 4326))
            .label('dest_geom'),
        func.ST_AsGeoJSON(func.ST_Transform(On.geom, 4326))
            .label('on_geom'),
        func.ST_AsGeoJSON(func.ST_Transform(Off.geom, 4326))
            .label('off_geom'))\
        .join(On, SurveysCore.board).join(Off, SurveysCore.alight)\
        .filter(SurveysCore.uri == uri).first()
    if record:
        ret_val["orig_geom"] = json.loads(record.orig_geom)
        ret_val["dest_geom"] = json.loads(record.dest_geom)
        ret_val["on_geom"] = json.loads(record.on_geom)
        ret_val["off_geom"] = json.loads(record.off_geom)
    return ret_val
 

def check_flags(record):
    if not record.flags.english:
        return False
    if not record.flags.locations:
        return False
    return True
"""

"""
Filter by route and direction
Show each tad centroid as pie chart with pct complete
"""
@mod_long.route('/map')
def map():
    session = Session()
    keys = []
    query = session.query(SurveysCore)
    for record in query:
        #TODO check that survey has not already been flagged by user
        debug(record.uri)
        #if record.flags.locations:
        keys.append(record.uri)
    session.close()
    return render_template(static('map.html'), keys=keys)


@mod_long.route('/_geoquery', methods=['GET'])
def geo_query():
    points,lines = None, None
    debug(request.args)
    if 'uri' in request.args:
        uri = request.args.get('uri')
        data = query_locations(uri)
        debug(data)
    return jsonify({'data':data})
    #return jsonify({'points':points, 'lines':lines})
