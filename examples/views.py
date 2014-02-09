import json

from django.http import HttpResponse
from django.views import generic
from django.conf import settings

# Setting up pusher service
import pusher

p = pusher.Pusher(
    app_id=settings.PUSHER_APP_ID,
    key=settings.PUSHER_KEY,
    secret=settings.PUSHER_SECRET
)


# Create your views here.
class IndexView(generic.TemplateView):
	template_name = 'examples/index.html'


def click(request):
	x = request.GET.get("x")
	y = request.GET.get("y")
	p['clients_channel'].trigger('click', dict(x=x, y=y))
	return HttpResponse(json.dumps(dict(success=True)))
