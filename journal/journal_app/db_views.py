from django.db import connection, transaction
from django.utils import simplejson

def drop_table(request):

	cursor = connection.cursor()
	cursor.execute("DROP TABLE journal_app_node;")
	success = simplejson.dumps({'success':'success',})
	return HttpResponse(success, mimetype='application/json')
