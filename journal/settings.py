from platform import node
import os

ROOT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

DEV_HOST = (
	'Andrew-Stahlmans-MacBook-Pro.local',
)

if node() in DEV_HOST:
	from settings_dev import *
else:
	from settings_prod import *

# These settings are common to both the production 
# and development environment:

import os.path
import logging

TEMPLATE_DEBUG = DEBUG

AUTH_PROFILE_MODULE = 'journal_app.UserProfile'
LOGIN_REDIRECT_URL = '/read_entry/'

ADMINS = (
    # ('Your Name', 'your_email@example.com'),
)

MANAGERS = ADMINS

TIME_ZONE = 'America/Chicago'

LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# Internationalization
USE_I18N = True

# Locale
USE_L10N = True

# Timezone
USE_TZ = True

# URL prefix for static files.
# Example: "http://media.lawrence.com/static/"
STATIC_ROOT = os.path.join(ROOT_PATH, 'static/')

STATIC_URL = '/static/'

# Additional locations of static files
STATICFILES_DIRS = (
)


# Make this unique, and don't share it with anybody.
SECRET_KEY = 'kx9hw$-mpcl%x)*up#f(+7rd2c*gop$0yc5m&amp;pqsaz41vmui_v'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
#     'django.template.loaders.eggs.Loader',
)

TEMPLATE_CONTEXT_PROCESSORS = (
	'django.contrib.auth.context_processors.auth',
	'django.core.context_processors.debug',
	'django.core.context_processors.i18n',
	'django.core.context_processors.media',
	'django.core.context_processors.static',
	'django.core.context_processors.tz',
	'django.contrib.messages.context_processors.messages',
	'django.core.context_processors.request',
	'django.core.context_processors.csrf',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # Uncomment the next line for simple clickjacking protection:
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'journal.urls'

WSGI_APPLICATION = 'journal.wsgi.application'

TEMPLATE_DIRS = (
	os.path.join(ROOT_PATH, 'templates'),
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.admin',
    'django.contrib.admindocs',
	'journal.journal_app',
)

try:
	if ADDITIONAL_INSTALLED_APPS is not None:
		INSTALLED_APPS = ADDITIONAL_INSTALLED_APPS + INSTALLED_APPS
except NameError:
	# settings did not define additional apps, continue
	INSTALLED_APPS = INSTALLED_APPS

# Send an email to the site admins on every HTTP 500 error when DEBUG=False.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        }
    },
    'handlers': {
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler'
        }
    },
    'loggers': {
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
        },
    }
}

logging.basicConfig(
	level = logging.DEBUG,
	format = '%(asctime)s %(levelname)s %(message)s',
)
