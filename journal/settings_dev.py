# Django settings for journal_site project.
DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': join(ROOT_PATH, 'development/database/sqlite3.db'),
    }
}
