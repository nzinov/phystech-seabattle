import json
from tornado.websocket import WebSocketHandler
from tornado.locks import Event
from .loader import GameLoader
from .utils import Dumper

class GameHandler(WebSocketHandler):
    def __init__(self, *args, **kwargs):
        super(GameHandler, self).__init__(*args, **kwargs)
        self.game = None
        self.player = None
        self.answered = Event()

    def open(self):
        pass

    def auth(self, data):
        self.game = GameLoader.load(data["game"])
        self.player = data["player"]
        self.game.handlers[self.player] = self
        self.game.introduce(self.player)

    def on_message(self, message):
        data = Dumper.load(message)
        if data["action"] == "auth":
            self.auth(data)
        if self.game is None:
            self.close()
        if data["action"] == "move":
            self.game.take_action(self.player, data)
        if data["action"] == "answer":
            self.answered.set()

    def on_close(self):
        print("WebSocket closed")

    def check_origin(self, origin):
        return True
