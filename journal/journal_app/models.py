from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist
from django.utils.timezone import now
from id_encoder import IdEncoder
import datetime
import logging

class NodeManager(models.Manager):
	
	def get_public_node(self, s):
		try:
			return Node.objects.get(publicID=s) #TODO: Node.objects == self?
		except ObjectDoesNotExist:
			return None

class Node(models.Model):
	parent = models.ForeignKey('self', null=True, related_name='children')
	nodeVal = models.TextField()
	nodeType = models.CharField(max_length=75)
	nodeContent = models.TextField()
	level = models.IntegerField()
	containingEntry = models.ForeignKey('Entry', related_name='nodes')
	publicID = models.CharField(max_length=75, null=True)

	objects = NodeManager()

	def __unicode__(self):
		return '{0} @ Lvl{1}: {2}'.format(self.nodeType, self.level, self.nodeVal)

	def get_dict(self):
		"""Returns a dictionary for serialization."""
		d = {}
		d['nodeVal'] = self.nodeVal
		d['nodeType'] = self.nodeType
		d['nodeContent'] = self.nodeContent
		d['level'] = self.level
		d['containingEntryNum'] = self.containingEntry.entryNum
		d['publicID'] = self.publicID
		d['children'] = []
		for c in self.children.all():
			d['children'].append(c.get_dict())
		return d

	@classmethod
	def build_subtree(cls, nodeVal, nodeType, nodeContent, level, children, entry):
		root = cls.objects.create(nodeVal=nodeVal, nodeType=nodeType, nodeContent=nodeContent, level=level, containingEntry=entry)
		for c in children:
			root.children.add(cls.build_subtree(c['nodeVal'], c['nodeType'], c['nodeContent'], c['level'], c['children'], entry))
		return root
	
	def make_public(self):
		self.publicID = IdEncoder.int_to_string(self.id)
		self.save()

	def make_private(self):
		self.publicID = None 
		self.save()

class Snippet(models.Model):
	name = models.CharField(max_length=50)
	content = models.TextField()
	author = models.ForeignKey(User, related_name="snippets")

	def get_dict(self):
		d = {}
		d['name'] = self.name
		d['content'] = self.content
		return d

class UserProfile(models.Model):
	""" Contains User data and provides methods to get entries for a User """
	user = models.OneToOneField(User)
	numEntries = models.IntegerField()
	dateJoined = models.DateField(auto_now_add=True)

	def get_snippets(self, names):
		snips = Snippet.objects.filter(author=self.user)
		if names is not None and len(names) > 0:
			q = Q()
			for n in names:
				q = q | Q(name=n)
			snips = snips.filter(q)
		return snips

	def get_entries(self):
		return Entry.objects.filter(author=self.user)

	def get_last_entry(self):
		entries = self.get_entries()
		if len(entries) > 0:
			logging.debug("Returning latest entry.")
			e = entries.latest('creationDate')
			logging.debug("CreationDate=" + e.creationDate.isoformat())
			return e
 		return None

	def get_entry_by_num(self, num):
		entries = self.get_entries()
		logging.debug("User entries count: %d" % entries.count())
		if len(entries) > 0:
			try:
				return entries.get(entryNum=num)
			except ObjectDoesNotExist:
				return None
		return None

	# TODO: return all
	def get_entry_by_date(self, datetimeIn):
		entries = self.get_entries()
		if len(entries) > 0:
			entries = entries.filter(creationDate__startswith=datetimeIn)
			if len(entries) >= 1:
				return entries[0]
		return None

	def get_node(self, node_id):
		return Node.objects.filter(author=self.user).filter(id=node_id)

	def search_nodes(self, params):
		logging.debug("Inside search nodes")
		logging.debug("Here are the params: " + params.__str__())
		logging.debug("Here are the params keys: " + params.keys().__str__())
		nodes = Node.objects.filter(containingEntry__author=self.user)
		logging.debug("All nodes for user: %d" % len(nodes))
		try:
			before = datetime.datetime.strptime(params['before'], '%m/%d/%Y')
			before = datetime.datetime.combine(before, datetime.time.max)
		except Exception as e:
			logging.debug("Error parsing before: %s - %s" % (type(e), e))
			before = now() # time-zone aware
		try:
			after = datetime.datetime.strptime(params['after'], '%m/%d/%Y')
			after = datetime.datetime.combine(after, datetime.time.min)
		except Exception as e:
			logging.debug("Error parsing before: %s - %s" % (type(e), e))
			after = self.dateJoined
		logging.debug("Date range before: %s" % before.strftime("%m-%d-%Y %H:%M"))
		logging.debug("Date range after: %s" % after.strftime("%m-%d-%Y %H:%M"))
		nodes = nodes.filter(containingEntry__creationDate__range=(after,before))
		logging.debug("All nodes in date range: %d" % len(nodes))
		if 'keywords' in params:
			q = Q()
			for k in params['keywords']:
				q = q | Q(nodeContents_icontains=k)
			nodes = nodes.filter(q)
			logging.debug("All nodes for keywords: %d" % len(nodes))
		if 'tags' in params:
			q = Q()
			for t in params['tags']:
				q = q | Q(nodeVal=t);
			nodes = nodes.filter(q)
			logging.debug("All nodes for tags: %d" % len(nodes))
		if 'entryNum' in params:
			nodes = nodes.filter(containingEntry_entry_num=params['entryNum'])
			logging.debug("All nodes for entryNum: %d" % len(nodes))

		results = []
		for n in nodes:
			preview = n.nodeContent
			if (len(preview) > 25):
				preview = preview[0:25] + '...'
			r = { 'nodeID' : n.id, 'nodePreview' : preview , 'date' : n.containingEntry.creationDate.strftime('%m/%d/%Y %H:%M'), 'entryNum' : n.containingEntry.entryNum }
			results.append(r)
		return results

	def __unicode__(self):
		return "%s, joined on %s: %d entries" % (str(self.user), self.dateJoined.isoformat(), self.numEntries)

# register callback to create UserProfile on creation of User
def create_user_profile(sender, instance, created, **kwargs):
	if created:
		UserProfile.objects.create(user=instance, numEntries=0)

post_save.connect(create_user_profile, sender=User)

class EntryManager(models.Manager):
	"""Custom Manager for Entry model."""
	def create_entry(self, rawText, author, rootData):
		e = self.create(rawText=rawText, author=author, entryNum=author.get_profile().numEntries, creationDate=now(), lastEditDate=now())
		e.save()
		e.treeRoot = Node.build_subtree(rootData['nodeVal'], rootData['nodeType'], rootData['nodeContent'], rootData['level'], rootData['children'], e) 
		e.save()
		author.get_profile().numEntries += 1
		author.get_profile().save()
		return e

	def update_entry(self, entryNum, rawText, author, rootData):
		try:
			e = self.filter(author=author).get(entryNum=entryNum)
		except ObjectDoesNotExist:
			e = None
		if e is not None:
			e.rawText = rawText
			e.treeRoot.delete()
			logging.debug("About to update the entry.")
			e.treeRoot = Node.build_subtree(rootData['nodeVal'], rootData['nodeType'], rootData['nodeContent'], rootData['level'], rootData['children'], e) 
			e.lastEditDate = now()
			e.save()
			return e

	def toggle_public(self, author, entryNum):
		try:
			e = self.filter(author=author).get(entryNum=entryNum)
		except ObjectDoesNotExist:
			return False
		n = e.treeRoot
		if n.publicID != None:
			logging.debug("Making node private.")
			n.make_private()
		else:
			logging.debug("Making node public.")
			n.make_public()
		return n.publicID

class Entry(models.Model):
	rawText = models.TextField()
	author = models.ForeignKey(User)
	entryNum = models.IntegerField()
	creationDate = models.DateTimeField()
	lastEditDate = models.DateTimeField()
	treeRoot = models.ForeignKey(Node, null=True)
	
	objects = EntryManager() # install custom Manager

	def get_dict(self):
		"""Returns a dictionary for serialization."""
		d = {}
		d['rawText'] = self.rawText
		d['creationDate'] = self.creationDate.isoformat()
		d['entryNum'] = self.entryNum
		d['treeRoot'] = self.treeRoot.get_dict()
		return d
		
	def __unicode__(self):
		l = min(25, len(self.rawText))
		return self.creationDate.__str__() + ": " + self.rawText[:l]
		

