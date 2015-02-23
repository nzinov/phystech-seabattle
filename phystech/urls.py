from django.conf.urls import patterns, url, include
from django.contrib.auth.views import login
from django.contrib import admin
import phystech.views as views

urlpatterns = patterns('',
                       url(r'^$', views.index, name='index'),
                       url(r'^accounts/login$', login, name='login'),
                       url(r'^game/(\d+)$', views.game, name='game'),
                       url(r'^tutorial$', views.game),
                       url(r'^support/$', views.support),
                       url(r'^admin/', include(admin.site.urls)),
                      )
