from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'journal_site.views.home', name='home'),
    # url(r'^journal_site/', include('journal_site.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
	url(r'^$', 'journal.journal_app.views.splash'),
	url(r'^save_entry/', 'journal.journal_app.views.save_entry'),
	url(r'^save_snippet/', 'journal.journal_app.views.save_snippet'),
	url(r'^get_snippets/', 'journal.journal_app.views.get_snippets'),
	url(r'^write_entry/', 'journal.journal_app.views.write_entry'),
	url(r'^read_entry/', 'journal.journal_app.views.read_entry'),
	url(r'^get_entries/', 'journal.journal_app.views.get_entries'),
	url(r'^get_node/', 'journal.journal_app.views.get_node'),
	url(r'^search_nodes/', 'journal.journal_app.views.search_nodes'),
	url(r'^toggle_public/', 'journal.journal_app.views.toggle_public'),
	url(r'^public/(?P<id_string>[A-Za-z0-9]+)/$', 'journal.journal_app.views.get_public_node'),
	url(r'^accounts/login/$', 'django.contrib.auth.views.login'),
	url(r'^accounts/logout/$', 'django.contrib.auth.views.logout', {'next_page' : '/'}),
	url(r'^accounts/register/$', 'journal.journal_app.views.register'),
	url(r'^tests/$', 'journal.journal_app.views.tests'),
)
