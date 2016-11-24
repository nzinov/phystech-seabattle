from browser import alert, document, html, websocket
from model.structs import *
import model.ships
from model.utils import Dumper

squares = document.get(selector=".square")

def get_square(coord):
    return document["{}:{}".format(coord.x, coord.y)]

def get_coord(obj):
    return Coord(int(obj.x), int(obj.y))

def hl(coord):
    get_square(coord).style.background = "green"

class Log:
    @staticmethod
    def info(msg):
        document["log"] <= html.P(msg)

class State:
    def __init__(self):
        self.me = 0
        self.player = 0
        self.phase = Phase.attack
        self.field = Field(14)


socket = websocket.WebSocket("ws://localhost:8888/game_socket")
def send(data):
    socket.send(Dumper.dump(data))
def socket_connect(ev):
    send({"action": "auth", "player": 0, "game": 0})
def socket_message(ev):
    print(ev.data)
    data = Dumper.load(ev.data)
    print(data)
    action = data["action"]
    if action == "phase":
        STATE.phase = data["phase"]
        STATE.player = data["player"]
        Log.info("phase: {}, player: {}".format(STATE.phase, STATE.player))
    elif action == "square":
        coord = data["coord"]
        square = data["square"]
        STATE.field[coord] = square
        text = "" if square.player is None else \
                "?" if square.ship is None else \
                square.ship.name()
        get_square(coord).text = text
socket.bind('open', socket_connect)
socket.bind('message', socket_message)


STATE = State()

class DnDDispatcher:
    source = None

    @staticmethod
    def drag(ev):
        ev.preventDefault()
        source = get_coord(ev.target)
        if STATE.field[source].player != STATE.me or STATE.player != STATE.me:
            return
        if STATE.phase not in [Phase.move, Phase.attack]:
            return
        if STATE.field[source].player != STATE.me:
            return
        ship = STATE.field[source].ship
        actions = ship.move_actions if STATE.phase == Phase.move else ship.attack_actions
        action = actions["*"]
        for i in range(14):
            for j in range(14):
                if action.is_possible(STATE, source, Coord(i, j)) is True:
                    pass
                    #hl(Coord(i, j))
        DnDDispatcher.source = source

    @staticmethod
    def abort_drag(ev):
        ev.preventDefault()
        DnDDispatcher.source = None

    @staticmethod
    def drop(ev):
        ev.preventDefault()
        if DnDDispatcher.source is None:
            return
        source = DnDDispatcher.source
        destination = get_coord(ev.target)
        if STATE.field[source].player != STATE.me or STATE.player != STATE.me:
            return
        if STATE.phase not in [Phase.move, Phase.attack]:
            return
        if STATE.field[source].player != STATE.me:
            return
        ship = STATE.field[source].ship
        actions = ship.move_actions if STATE.phase == Phase.move else ship.attack_actions
        action = actions["*"]
        result = action.is_possible(STATE, source, destination)
        if isinstance(result, str):
            Log.info(result)
            return
        send({"action": "move", "phase": STATE.phase,
              "type": "*", "source": source, "destination": destination})
        DnDDispatcher.source = None

for el in squares:
    el.bind('mousedown', DnDDispatcher.drag)
    el.bind('mouseup', DnDDispatcher.drop)
    square = STATE.field[get_coord(el)]
    if square.ship:
        el.text = square.ship.name()
        el.style.color = "blue" if square.player else "red"
document[html.BODY][0].bind('mouseup', DnDDispatcher.abort_drag)
