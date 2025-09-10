from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from .models import Profile
from PIL import Image
import re

class UserRegisterForm(UserCreationForm):
    email = forms.EmailField()

    class Meta:
        model = User
        fields = ['first_name','last_name','username','email','password1','password2']

    def clean_email(self):
        email = self.cleaned_data.get('email')
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("A user with this email already exists.")
        
        # Validate email format and prevent fake emails
        if not self._is_valid_email_format(email):
            raise forms.ValidationError("Please enter a valid email address.")
        
        # Check for disposable/temporary email domains
        if self._is_disposable_email(email):
            raise forms.ValidationError("Disposable email addresses are not allowed. Please use a permanent email address.")
        
        return email
    
    def _is_valid_email_format(self, email):
        """Basic email format validation"""
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(email_regex, email) is not None
    
    def _is_disposable_email(self, email):
        """Check if email is from a disposable email service"""
        disposable_domains = [
            '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'temp-mail.org',
            'throwaway.email', 'yopmail.com', 'maildrop.cc', 'tempail.com', 'dispostable.com',
            '0-mail.com', 'mail-temporaire.fr', 'spamgourmet.com', 'getnada.com', 'mailcatch.com'
        ]
        
        domain = email.split('@')[-1].lower()
        return domain in disposable_domains


class UserUpdateForm(forms.ModelForm):
    email = forms.EmailField()

    class Meta:
        model = User
        fields = ['first_name','last_name','username','email']

    def clean_email(self):
        email = self.cleaned_data.get('email')
        
        # Check if email already exists (but allow current user's email)
        if User.objects.filter(email=email).exclude(pk=self.instance.pk).exists():
            raise forms.ValidationError("A user with this email already exists.")
        
        # Validate email format and prevent fake emails
        if not self._is_valid_email_format(email):
            raise forms.ValidationError("Please enter a valid email address.")
        
        # Check for disposable/temporary email domains
        if self._is_disposable_email(email):
            raise forms.ValidationError("Disposable email addresses are not allowed. Please use a permanent email address.")
        
        return email
    
    def _is_valid_email_format(self, email):
        """Basic email format validation"""
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(email_regex, email) is not None
    
    def _is_disposable_email(self, email):
        """Check if email is from a disposable email service"""
        disposable_domains = [
            '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'temp-mail.org',
            'throwaway.email', 'yopmail.com', 'maildrop.cc', 'tempail.com', 'dispostable.com',
            '0-mail.com', 'mail-temporaire.fr', 'spamgourmet.com', 'getnada.com', 'mailcatch.com'
        ]
        
        domain = email.split('@')[-1].lower()
        return domain in disposable_domains


class ProfileUpdateForm(forms.ModelForm):
    x = forms.FloatField(widget=forms.HiddenInput(), required=False)
    y = forms.FloatField(widget=forms.HiddenInput(), required=False)
    width = forms.FloatField(widget=forms.HiddenInput(), required=False)
    height = forms.FloatField(widget=forms.HiddenInput(), required=False)

    image = forms.ImageField(label=('Image'), error_messages = {'invalid':("Image files only")}, widget=forms.FileInput, required=False)
    class Meta:
        model = Profile
        fields = ['bio','date_of_birth','image',]


    """Saving Cropped Image"""
    def save(self,*args,**kwargs):
        img = super(ProfileUpdateForm, self).save(*args, **kwargs)

        x = self.cleaned_data.get('x')
        y = self.cleaned_data.get('y')
        w = self.cleaned_data.get('width')
        h = self.cleaned_data.get('height')

        if x and y and w and h:
            image = Image.open(img.image)
            cropped_image = image.crop((x, y, w+x, h+y))
            resized_image = cropped_image.resize((300, 300), Image.ANTIALIAS)
            resized_image.save(img.image.path)

        return img