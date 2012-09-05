# Django settings for journal_site project.
import dj_database_url
from os import environ

# Helper lambda for gracefully degrading environmental variables:
env = lambda e, d: environ[e] if environ.has_key(e) else d

DEBUG = False

DATABASES = {'default': dj_database_url.config(default='postgres://localhost')}

ADDITIONAL_INSTALLED_APPS = (
	'gunicorn',
)

# Make this unique, and don't share it with anybody.
SECRET_KEY = env('SECRET_KEY', None)
