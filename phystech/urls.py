from django.conf.urls import patterns, url, include
from django.contrib import admin
import phystech.views as views

urlpatterns = patterns('',
                       url(r'^$', views.index, name='index'),
                       url(r'^game/(\d+)$', views.game, name='game'),
                       url(r'^profile$', views.profile),
                       url(r'^rating$', views.rating),
                       url(r'^tutorial$', views.game),
                       url(r'^support/$', views.support),
                       url(r'^admin/', include(admin.site.urls)),
                       url(r'^pages/', include('django.contrib.flatpages.urls')),
                       url(r'', include('social.apps.django_app.urls', namespace='social'))
                      )
