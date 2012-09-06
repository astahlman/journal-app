from django import forms

class RegisterForm(forms.Form):
	username = forms.CharField(max_length=30, label="Username", help_text="30 characters or fewer - may contain letters, numbers, _, @, +, . and -. It's cool to use your email address.")
	password1 = forms.CharField(min_length=6, label="Password", help_text="6 characters or more.", widget=forms.PasswordInput())
	password2 = forms.CharField(min_length=6, label="Re-type Password.", widget=forms.PasswordInput())
	email = forms.EmailField(required=False, label="Email", help_text="Optional, but recommended in case you forget your password. (I won't give it out to spammers. Not even for a backrub or a burrito.")

class CommentsForm(forms.Form):
	name = forms.CharField(required=False, max_length=50, label="Your name:", help_text="(Optional)")
	email = forms.EmailField(required=False, label="Email:", help_text="(Optional)")
	text = forms.CharField(min_length=1, widget=forms.Textarea(attrs={'rows' : 20, 'cols' : 150}), label="Comment:", help_text="Lavish praise, cutting insults or helpful suggestions.")
