"""
Django settings for phystech project.

For more information on this file, see
https://docs.djangoproject.com/en/1.7/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.7/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

IS_PRODUCTION = 'OPENSHIFT_REPO_DIR' in os.environ

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.7/howto/deployment/checklist/

if IS_PRODUCTION:
    DATA_DIR = os.environ["OPENSHIFT_DATA_DIR"]
    GAME_SERVER = "server-seabattle.rhcloud.com"
else:
    DATA_DIR = BASE_DIR
    GAME_SERVER = "localhost"


SECRET_KEY = 'test'
if IS_PRODUCTION:
    with open(os.path.join(DATA_DIR, "secret_token.txt")) as f:
        SECRET_KEY = f.read().strip()

DEBUG = not IS_PRODUCTION

TEMPLATE_DEBUG = True

ALLOWED_HOSTS = ["*-seabattle.rhcloud.com"]
LOGIN_REDIRECT_URL = "/"


# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'phystech',
    'bootstrap3'
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'phystech.urls'

WSGI_APPLICATION = 'phystech.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.7/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(DATA_DIR, 'db.sqlite3'),
    }
}

# Internationalization
# https://docs.djangoproject.com/en/1.7/topics/i18n/

LANGUAGE_CODE = 'ru-ru'

TIME_ZONE = 'Europe/Moscow'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.7/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(DATA_DIR, "static")
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(DATA_DIR, "media")
ADMINS = (("Nikolay", "nzinov@gmail.com"))
