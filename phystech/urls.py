from django.conf.urls import patterns, url
from django.contrib.auth.views import login
from django.contrib import admin

urlpatterns = patterns('',
                       url(r'^$', views.index, name='index'),
                       url(r'^accounts/login$', login, name='login'),
                       url(r'^game$', views.game, name='game')
                       url(r'^admin/', include(admin.site.urls)),
                      )
