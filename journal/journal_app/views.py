# Create your views here.
from django.utils import simplejson
from journal.journal_app.models import Node, Entry, Snippet
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.contrib.auth.forms import AuthenticationForm
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from journal.journal_app.custom_forms import RegisterForm 
from dateutil.parser import parse as iso_date_parse
from journal.journal_app.custom_json import JSONEncoder as customJSON
from journal.journal_app.id_encoder import IdEncoder
from django.conf import settings
import logging

@login_required
def save_entry(request):
	logging.debug("Received request for save_entry")
	responseData = {}
	if request.method == 'POST':
		data = simplejson.loads(request.raw_post_data)
		logging.debug("Just deserialized data: %s", data.__str__())
		if data['rawText'].__len__() > 0 and data['root'] is not None:
			if data.get('entryNum', None) is None or data['entryNum'] < 0:
				logging.debug("About to create entry: rootData = %s", data['root'].__str__())
				e = Entry.objects.create_entry(data['rawText'], request.user, data['root'])
				logging.debug("About to save...")
				e.save()
			else:
				e = Entry.objects.update_entry(data['entryNum'], data['rawText'], request.user, data['root'])
		responseData['entryNum'] = e.entryNum if e is not None else -1
	return HttpResponse(simplejson.dumps(responseData), mimetype="application/json")
@login_required
def write_entry(request):
	logging.debug("Received request for write_entry")
	return render_to_response('write.html', {"can_save" : True}, context_instance=RequestContext(request))

@login_required
def read_entry(request):
	logging.debug("Received request for read_entry")
	return render_to_response('read.html', context_instance=RequestContext(request))

@login_required
def get_entries(request):
	if request.method == 'GET':
		e = None
		profile = request.user.get_profile()

		# No GET params defaults to most recent entry
		if request.GET.items().__len__() == 0:
			logging.debug("Getting most recent entry.")
			e = profile.get_last_entry()
		else:
			try:
				entryNum = int(request.GET.get('entryNum', -1))
			except ValueError:
				entryNum = -1
			creationDate = request.GET.get('creationDate', '')
			# entryNum takes precedence over date
			if entryNum >= 0:
				e = profile.get_entry_by_num(entryNum)
				logging.debug("Just got e: " + e.get_dict().__str__())
			elif len(creationDate) > 0:
				try:
					creationDate = iso_date_parse(creationDate)
				except ValueError:
					creationDate = None
				if creationDate:
					e = profile.get_entry_by_date(creationDate)

		# TODO: Allow for gte, lte, range of entryNums, etc., serialize to list
		responseData = {}
		if not e is None:
			responseData = e.get_dict()
			eNext = Entry.objects.filter(author=request.user).filter(entryNum__gt=e.entryNum).order_by('entryNum')
			ePrev = Entry.objects.filter(author=request.user).filter(entryNum__lt=e.entryNum).order_by('-entryNum')
			responseData['nextEntry'] = eNext[0].entryNum if len(eNext) > 0 else -1
			responseData['prevEntry'] = ePrev[0].entryNum if len(ePrev) > 0 else -1
		else:
			responseData['nextEntry'] = -1
			responseData['prevEntry'] = -1
	logging.debug("About to json dump this entry: " + responseData.__str__())
	return HttpResponse(simplejson.dumps(responseData), mimetype="application/json")

@login_required
def search_nodes(request):
	results = []
	if request.method == 'POST':
		params = simplejson.loads(request.raw_post_data)
		logging.debug("Just received a GET with params=" + params.__str__())
		if params and len(params) > 0:
			results = request.user.get_profile().search_nodes(params)

	logging.debug("About to json dump this entry: " + results.__str__())
	return HttpResponse(simplejson.dumps(results, cls=customJSON), mimetype="application/json")

@login_required
def toggle_public(request):
	response = {}
	if request.method == 'GET':
		entry_num = request.GET.get('entryNum', None)
		entry_num = int(entry_num) if entry_num != None else None
		result = None
		if entry_num:
			logging.debug("In view: About to toggle public")
			result = Entry.objects.toggle_public(request.user, entry_num)
		if result == False:
			response = { 'error' : 'Cannot modify entry' }
		else:
			response = { 'entryNum' : entry_num, 'publicID' : result }
	return HttpResponse(simplejson.dumps(response, cls=customJSON), mimetype="application/json")
		
			
@login_required
def get_node(request):
	if request.method == 'GET':
		node_id = int(request.GET.get('nodeID', -1))
		if node_id > -1:
			n = Node.objects.filter(containingEntry__author=request.user).filter(id=node_id) 
			if len(n) == 1:
				return HttpResponse(simplejson.dumps(n[0].get_dict(), cls=customJSON), mimetype="application/json")
	return HttpResponse("No nodes matching query.")

def get_public_node(request, id_string=''):
	data = {}
	if request.method == 'GET' and len(id_string) >= IdEncoder.MIN_LENGTH:
		n = Node.objects.get_public_node(id_string)
		data = simplejson.dumps(n.get_dict(), cls=customJSON)
	return render_to_response('public.html', { 'json_node' : data }, context_instance=RequestContext(request))

def register(request):
	errors = []
	if request.method == 'POST':
		form = RegisterForm(request.POST)
		if form.is_valid():
			username = form.cleaned_data['username']
			password1 = form.cleaned_data['password1']
			password2 = form.cleaned_data['password2']
			email = form.cleaned_data.get('email')
			logging.debug("username: " + username)
			logging.debug("Number of duplicates: %d" % User.objects.filter(username=username).count())
			if User.objects.filter(username=username).count() == 0:
				if password1 == password2: 				
					User.objects.create_user(username=username, password=password1, email=email)
					user = authenticate(username=username, password=password1)
					login(request, user)
					return HttpResponseRedirect('/write_entry/')
				else:
					errors.append('Passwords do not match')
			else:
				errors.append('Username is taken')
	else:
		form = RegisterForm()

	return render_to_response('registration/register.html', {'form' : form, 'errors' : errors}, context_instance=RequestContext(request))

@login_required
def get_snippets(request):
	if request.method == 'POST':
		names = []
		try:
			data = simplejson.loads(request.raw_post_data)
			names = data.get('names', [])
		except:
			logging.debug("Couldn't load any parameters from the request. Returning all snippets")
		snips = request.user.get_profile().get_snippets(names)
		results = []
		for s in snips:
			results.append(s.get_dict())
		return HttpResponse(simplejson.dumps(results), mimetype="application/json")
	return HttpResponse("No snippets matching query.")

def save_snippet(request):
	if request.method == 'POST':
		data = simplejson.loads(request.raw_post_data)
		if data['name'] is not None and data['content'] is not None:
			(s, created) = Snippet.objects.get_or_create(name=data['name'], defaults={'content' : data['content'], 'author' : request.user})
			if not created:
				s.content = data['content']
			return HttpResponse(simplejson.dumps(s.get_dict()), mimetype="application/json")
	return HttpResponse("Invalid request.");

def tests(request):
	return render_to_response('tests.html', context_instance=RequestContext(request))

def splash(request):
	data = {}
	data['can_save'] = False;
	data['form'] = AuthenticationForm
	f = open(settings.STATIC_ROOT + 'misc/splash_editor.txt', 'r')
	data['default_text'] = f.read()
	if request.user.is_authenticated():
		data['num_entries'] = Entry.objects.filter(author=request.user).count()
	return render_to_response('splash.html', data, context_instance=RequestContext(request))
