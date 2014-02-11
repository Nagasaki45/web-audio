#!/usr/bin/env python

from tornado.options import options, define, parse_command_line
import django.core.handlers.wsgi
import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.wsgi

from django.conf import settings as djsettings

define('port', type=int, default=8000)


class HelloHandler(tornado.web.RequestHandler):
    def get(self):
        self.write('Hello from tornado')


def main():
    wsgi_app = tornado.wsgi.WSGIContainer(
        django.core.handlers.wsgi.WSGIHandler()
    )

    handlers = (
        ('/hello-tornado', HelloHandler),
        ('.*', tornado.web.FallbackHandler, dict(fallback=wsgi_app)),
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