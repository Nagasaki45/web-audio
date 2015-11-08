#!/usr/bin/env python

from tornado.options import define, parse_command_line, options
import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web
import tornado.netutil

define('port', type=int, default=8000)
define('unix_socket', default=False)


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render('index.html')


class WsHandler(tornado.websocket.WebSocketHandler):
    clients = []

    def open(self):
        self.clients.append(self)

    def on_close(self):
        self.clients.remove(self)

    def on_message(self, message):
        """
        Sends the message to all of the clients except the sender.
        """
        for c in self.clients:
            if c != self:
                c.write_message(message)


def main():
    parse_command_line()

    handlers = (
        (r'/', MainHandler),
        (r'/ws', WsHandler),
    )

    settings = {'static_path': 'static'}
    tornado_app = tornado.web.Application(handlers, **settings)
    server = tornado.httpserver.HTTPServer(tornado_app)
    if options.unix_socket:
        socket = tornado.netutil.bind_unix_socket('/tmp/web-audio.sock')
        server.add_socket(socket)
    else:
        server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == '__main__':
    main()
