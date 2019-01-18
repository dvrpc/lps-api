from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^$', views.queryCheck, name='query1')
    ]