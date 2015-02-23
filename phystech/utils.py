from hashlib import sha1
from django.conf import settings
from base64 import urlsafe_b64encode

def get_signature(data):
    hasher = sha1()
    hasher.update(data.encode('latin1'))
    hasher.update(settings.SECRET_KEY.encode('latin1'))
    return urlsafe_b64encode(hasher.digest()).decode('latin1')

def sign(data):
    return "{}:{}".format(data, get_signature(data))

def check(signature):
    data, signature = signature.split(':')
    if get_signature(data) != signature:
        return None
    return data

