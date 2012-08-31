# Django settings for journal_site project.
import dj_database_url

DEBUG = False

DATABASES = {'default': dj_database_url.config(default='postgres://localhost')}

ADDITONAL_INSTALLED_APPS = (
	'gunicorn',
)

