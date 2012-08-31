web: python journal/manage.py collectstatic --noinput; bin/gunicorn_django --workers=4 --bind=0.0.0.0:$PORT journal/settings.py 
web: gunicorn journal.wsgi -b 0.0.0.0:$PORT
