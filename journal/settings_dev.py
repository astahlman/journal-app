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

key_path = os.path.join(ROOT_PATH, 'assets/misc/extra_settings.txt')
SECRET_KEY = open(key_path, 'r').read()

