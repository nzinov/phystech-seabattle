from enum import Enum
from ships import Fig

MAX_COORD = 14

class Square:
    def __init__(self, fig=Fig.Empty, player=0):
        self.fig = fig
        self.player = player

    def empty(self):
        return self.fig == Fig.Empty

class Coord:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        if not self.is_legal():
            raise ValueError()

    @staticmethod
    def dist(a, b):
        return abs(a.x - b.x) + abs(a.y - b.y)

    def __eq__(self, other):
        return self.x == other.x and self.y == other.y

    def __add__(self, other):
        return Coord(self.x + other.x, self.y + other.y)

    def __sub__(self, other):
        return Coord(self.x - other.x, self.y - other.y)

    def __mul__(self, other):
        return Coord(self.x * other, self.y * other)

    def __floordiv__(self, other):
        return Coord(self.x // other, self.y // other)

    def __abs__(self):
        return Coord(abs(self.x), abs(self.y))

    @staticmethod
    def sign(number):
        return 1 if number > 0 else (0 if number == 0 else -1)

    def dir(self):
        return Coord(Coord.sign(self.x), Coord.sign(self.y))

    def is_legal(self):
        return 0 <= self.x < MAX_COORD and 0 <= self.y < MAX_COORD

class Field:
    def __init__(self, height, width):
        self.array = [[Square() for i in range(width)] for j in range(height)]

    @staticmethod
    def _getindex(index):
        if isinstance(index, Coord):
            return index
        elif isinstance(index, tuple):
            return Coord(index[0], index[1])
        raise TypeError()

    def __getitem__(self, index):
        index = Field._getindex(index)
        return self.array[index.x][index.y]

    def __setitem__(self, index, value):
        if isinstance(value, Square):
            raise ValueError()
        index = Field._getindex(index)
        self.array[index.x][index.y] = value

Phase = Enum('Phase', "displace, move, attack, end") #pylint: disable=invalid-name

def opponent(player):
    return 2 if player == 1 else 1

class GameRules:
    FIELD_SIZE = 14
    DISPLACE_SIZE = 5
    FIG_COUNT = [0, 0, 0, 1, 1, 2, 6, 2, 6, 1, 2,
                 7, 1, 4, 2, 1, 1, 7, 4, 6, 1, 7]

def logged(notify=None):
    def wrapper(method):
        def wrapped(self, *args, is_real=True):
            message = {"action": method.__name__, "args": args}
            for player in range(2):
                if notify in [player, "both"]:
                    self.send(player, message)
            if is_real:
                self.log(message)
            method(self, *args)
        return wrapped
    return wrapper

def restorable(**kwargs):
    def wrapper(method):
        RESTORABLE_ACTIONS[method.__name__] = method
        return logged(method, **kwargs)
    return wrapper

RESTORABLE_ACTIONS = {}

class Player:
    def __init__(self):
        self.queue = []
        self.socket = None
        self.ready = False

    def send(self, message):
        self.queue.append(message)
        self.push_queue()

    def push_queue(self):
        if self.socket:
            while len(self.queue):
                self.socket.send(self.queue.pop(0))

class Game:
    def __init__(self):
        self.rules = GameRules()
        self.field = Field(self.rules.FIELD_SIZE, self.rules.FIELD_SIZE)
        self.phase = Phase.displace
        self.player = 0
        self.players = [Player() for i in range(2)]
        self.action_log = []

    def restore(self):
        for el in self.log:
            if el.action in RESTORABLE_ACTIONS:
                RESTORABLE_ACTIONS[el.action](*el.args, is_real=False)

    def log(self, message):
        self.action_log.append(message)

    def notify(self, whom, message):
        self.players[whom].send(message)

    @restorable(notify="both")
    def set_phase(self, phase, player):
        self.phase = phase
        self.player = player

    @restorable()
    def set_fig(self, coord, fig):
        self.field[coord] = fig
        self.notify(fig.player, {"type": "field", "coord": coord, "fig": fig.fig,
                     "player": fig.player})
        self.notify(opponent(fig.player), {"type": "field", "coord": coord, "fig": fig.Unknown,
            "player": fig.player})

    def check_policy(self, policy, *args):
        return Ship.apply_policy(policy, self, *args)

    def displace(self, player, field):
        counts = [0 for el in Fig]
        if self.phase != Phase.displace or self.ready[player]:
            raise "Bad phase"
        if len(field) != self.rules.DISPLACE_SIZE or len(field[0]) != self.rules.FIELD_SIZE:
            raise "Bad size"
        for row in field:
            for el in row:
                counts[el.fig] += 1
                if el.player != player:
                    raise "Bad fig"
        if counts != self.rules.FIG_COUNT:
            raise "Bad fig count"
        lower = 0 if player == 1 else self.rules.FIELD_SIZE - self.rules.DISPLACE_SIZE
        upper = lower + self.rules.DISPLACE_SIZE
        self.field[lower:upper] = field
        self.log({"type": "displaced", "player": player})
        self.ready[player] = True
        if False not in self.ready:
            self.set_phase(Phase.move, 1)

    @restorable
    def _move(self, source, destination):
        self.field[destination] = self.field[source]
        self.field[source] = Square()

    def move(self, data):
        if self.phase != Phase.move or self.player != player:
            raise "Bad phase"
        if self.field[source].player != player:
            raise "Not yours"
        if not self.field[destination].empty():
            raise "Occupied"
        if not self.check_policy(self.field[source].fig.move_policy, source, destination):
            raise "Policy error"
        self._move(source, destination)
        self.set_phase(Phase.attack, player)

    @restorable
    def destroy(self, coord):
        self.field[coord] = Square()

    @restorable
    def convert(self, coord, player):
        self.field[coord].player = player

    def _shot(self, source, destination):
        success = self.field[destination].fig != Fig.F
        self.log({"type": "shot", "fig": self.field[source].fig,
                  "player": self.field[source].player,
                  "success": success})
        self.destroy(source)
        if success:
            self.destroy(destination)
        self.set_phase(Phase.move, self.player if success else opponent(self.player))

    def can_torpedo(self, source, target):
        dist = Coord.dist(source, target)
        if dist > 4:
            raise "Too far"
        direction = (source - target).dir()
        if not (direction.x == 0 or direction.y == 0):
            raise "Not line"
        for pos in range(1, dist):
            if not self.field[source + pos*direction].empty():
                raise "Way blocked"
        return True

    def take_action(self, data):
        if data.phase != self.phase:
            raise "Bad phase"
        ACTIONS = {
            Phase.displace : self.displace,
            Phase.move : self.move,
            Phase.attack : self.attack
        }
        ACTIONS[data.phase](data)
