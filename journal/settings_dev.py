# Django settings for journal_site project.
import os
ROOT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(ROOT_PATH, 'development/database/sqlite3.db'),
    }
}

key_path = os.path.join(ROOT_PATH, 'development/extra_settings.txt')
extra_settings = open(key_path, 'r')
for line in extra_settings:
	exec line # evaluates the strings as assignments

URL_BASE = 'http://127.0.0.1:8000'
