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

AUTH_USER_MODEL = 'phystech.CustomUser'


# Application definition

INSTALLED_APPS = (
    'phystech',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'django.contrib.flatpages',
    'markdown_deux',
    'bootstrap3',
    'social.apps.django_app.default'
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'social.apps.django_app.middleware.SocialAuthExceptionMiddleware',
    'django.contrib.flatpages.middleware.FlatpageFallbackMiddleware'
)

TEMPLATE_CONTEXT_PROCESSORS = (
    "django.core.context_processors.request",
    "django.contrib.auth.context_processors.auth",
    'social.apps.django_app.context_processors.backends',
    'social.apps.django_app.context_processors.login_redirect'
)

AUTHENTICATION_BACKENDS = (
    "django.contrib.auth.backends.ModelBackend",
    'social.backends.google.GooglePlusAuth'
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

from secrets import *
SOCIAL_AUTH_PIPELINE = (
    'social.pipeline.social_auth.social_details',
    'social.pipeline.social_auth.social_uid',
    'social.pipeline.social_auth.auth_allowed',
    'social.pipeline.social_auth.social_user',
    'social.pipeline.user.get_username',
    'social.pipeline.user.create_user',
    'phystech.social.save_profile',
    'social.pipeline.social_auth.associate_user',
    'social.pipeline.social_auth.load_extra_data',
    'social.pipeline.user.user_details'
)
SITE_ID = 1
