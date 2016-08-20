import os
import tornado.ioloop
import tornado.web
from server.handler import GameHandler

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, world")

if __name__ == "__main__":
    application = tornado.web.Application([
        (r"/", MainHandler),
        (r"/game_socket", GameHandler),
        ])
    print("start")
    application.listen(os.environ.get('PORT', 8888))
    tornado.ioloop.IOLoop.current().start()
