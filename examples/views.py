import json

from django.http import HttpResponse
from django.shortcuts import render
from django.conf import settings

# Setting up pusher service
import pusher

p = pusher.Pusher(
    app_id=settings.PUSHER_APP_ID,
    key=settings.PUSHER_KEY,
    secret=settings.PUSHER_SECRET
)


# Create your views here.
def index(request):
    return render(request, 'examples/index.html')


def click(request):
    x = request.GET.get('x')
    y = request.GET.get('y')
    csrftoken = request.COOKIES.get('csrftoken')
    p['clients_channel'].trigger('click', dict(x=x,
                                               y=y,
                                               csrftoken=csrftoken))
    return HttpResponse(json.dumps(dict(success=True)))
