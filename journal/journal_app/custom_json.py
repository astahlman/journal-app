from django.utils import simplejson
import datetime
class JSONEncoder(simplejson.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        else:
            return simplejson.JSONEncoder.default(self, obj)
