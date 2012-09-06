"""
This module adapted from:
http://codecomments.wordpress.com/2008/01/04/python-gmail-smtp-example/
"""
import smtplib
import datetime
from email.MIMEMultipart import MIMEMultipart
from email.MIMEText import MIMEText

def send_email(text, **kwargs):
	required = ['from_user', 'email_pass', 'to_user']
	for r in required:
		if not r in kwargs:
			print("Failed to send email with out required arg %s" % r)
			return False
	gmailUser = kwargs['from_user']
	gmailPassword = kwargs['email_pass']
	recipient = kwargs['to_user']
	msg = MIMEMultipart()
 	msg['From'] = gmailUser
 	msg['To'] = recipient
 	if not 'subject' in kwargs:
		msg['Subject'] = 'DearQwerty Comment - ' + str(datetime.date.today())
	else:
		msg['Subject'] = kwargs['subject']
	msg.attach(MIMEText(text))
	mailServer = smtplib.SMTP('smtp.gmail.com', 587)
	mailServer.ehlo()
	mailServer.starttls()
	mailServer.ehlo()
	mailServer.login(gmailUser, gmailPassword)
	mailServer.sendmail(gmailUser, recipient, msg.as_string())
	mailServer.close()
	return True
