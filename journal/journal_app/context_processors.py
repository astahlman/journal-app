from django.conf import settings

def url_base(context):
	return {'URL_BASE': settings.URL_BASE}
