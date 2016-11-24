from .utils import *
from .structs import *
from .ships import Ships
from .utils import Dumper

class Game:
    @hooked
    def __init__(self, rules):
        self.rules = rules
        self.field = Field(self.rules.FIELD_SIZE)
        self.phase = Phase.displace
        self.handlers = [None]*2
        self.player = None
        self.ready = [False]*2
        self.action_log = []

    def notify(self, message, who=None):
        pass

    def log(self, message):
        self.action_log.append(message)
        self.notify(message)

    @hooked
    def set_phase(self, phase, player):
        self.phase = phase
        self.player = player
        self.notify({"action": "phase", "phase": phase, "player": player})

    def send_square(self, coord, player):
        fig = self.field[coord]
        shadowed = Square(fig.ship if fig.player == player else None, fig.player)
        self.notify({"action": "square", "coord": coord, "square": shadowed}, who=player)

    def set_square(self, coord, fig):
        self.field[coord] = fig
        for player in range(2):
            self.send_square(coord, player)

    def can_displace(self, player, field):
        if self.phase != Phase.displace or self.ready[player]:
            raise "Bad phase"
        if len(field) != self.rules.DISPLACE_SIZE or len(field[0]) != self.rules.FIELD_SIZE:
            raise "Bad size"
        counts = self.rules.FIG_COUNT.copy()
        for row in field:
            for el in row:
                counts[el.fig] -= 1
                if el.player != player:
                    raise "Bad fig"
        if not all([el == 0 for el in counts]):
            raise "Bad fig count"

    def move(self, source, destination):
        self.set_square(destination, self.field[source])
        self.set_square(source, Square())

    def destroy(self, coord):
        self.set_square(coord, Square())

    def convert(self, coord, player):
        self.set_square(coord, Square(self.field[coord].ship, player))
