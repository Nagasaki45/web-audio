from django.conf.urls import patterns, url

import views

urlpatterns = patterns('',

	url(r'^$', views.IndexView.as_view(), name='index'),
	url(r'^click$', views.click, name='click'),

)
