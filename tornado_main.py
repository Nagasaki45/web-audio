#!/usr/bin/env python

import os

from tornado.options import options, define, parse_command_line
import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web
import tornado.wsgi

import django.core.handlers.wsgi
from django.conf import settings as djsettings

os.environ.setdefault('DJANGO_SETTINGS_MODULE',
                      'web_audio.settings.base')

define('port', type=int, default=8000)

clients = []


class HelloHandler(tornado.web.RequestHandler):

    def get(self):
        self.write('Hello from tornado')


class WsHandler(tornado.websocket.WebSocketHandler):

    def open(self):
        clients.append(self)

    def on_close(self):
        clients.remove(self)

    def on_message(self, message):
        '''
        Sends the message to all of the clients except the sender.
        '''

        for c in clients:
            if c != self:
                c.write_message(message)


def main():
    tornado.options.parse_command_line()
    wsgi_app = tornado.wsgi.WSGIContainer(
        django.core.handlers.wsgi.WSGIHandler()
    )

    handlers = (
        (r'/hello-tornado', HelloHandler),
        (djsettings.WEBSOCKET_URL, WsHandler),
        (r'.*', tornado.web.FallbackHandler, dict(fallback=wsgi_app)),
    )

    settings = dict(
        debug=djsettings.DEBUG,
        # be sure to run "python manage.py collecstatic"!
        static_path=djsettings.STATIC_ROOT
    )

    tornado_app = tornado.web.Application(handlers, **settings)
    server = tornado.httpserver.HTTPServer(tornado_app)
    server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == '__main__':
    main()
