from .utils import *
from .structs import *
from .ships import Ships
from .utils import Dumper

class GameRules:
    FIELD_SIZE = 14
    DISPLACE_SIZE = 5
    FIG_COUNT = {"Av": 1, "Lk": 2, "Kr": 6, "Rd": 2, "Es": 6,
                 "KrPl": 1, "St": 7, "Tk": 6, "Tr": 7, "Pl": 4,
                 "Sm": 1, "Rk": 1, "T": 4, "Mn": 7, "Br": 2,
                 "AB": 1, "NB": 1, "F": 2, "Tp": 1}

class Game:
    @attachable("game_init")
    def __init__(self, rules=GameRules):
        self.rules = rules
        self.field = Field(self.rules.FIELD_SIZE)
        self.phase = Phase.displace
        self.handlers = [None]*2
        self.player = None
        self.ready = [False]*2
        self.action_log = []

    def notify(self, message, who=None):
        json_string = Dumper.dump(message)
        if who is not None:
            if self.handlers[who]:
                self.handlers[who].write_message(json_string)
        else:
            for handler in self.handlers:
                if handler:
                    handler.write_message(json_string)

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

    def introduce(self, player):
        for i in range(self.rules.FIELD_SIZE):
            for j in range(self.rules.FIELD_SIZE):
                if not self.field[i, j].empty():
                    self.send_square(Coord(i, j), player)
        self.notify({"action": "phase", "phase": self.phase, "player": self.player}, who=player)


    def displace(self, player, field):
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
        lower = 0 if player == 0 else self.rules.FIELD_SIZE - self.rules.DISPLACE_SIZE
        for x in range(self.rules.DISPLACE_SIZE):
            for y in range(self.rules.FIELD_SIZE):
                self.set_square(Coord(lower + x, y), field[x, y])
        self.log({"type": "displaced", "player": player})
        self.ready[player] = True
        if False not in self.ready:
            self.set_phase(Phase.move, 0)

    def move(self, source, destination):
        self.set_square(destination, self.field[source])
        self.set_square(source, Square())

    def destroy(self, coord):
        self.set_square(coord, Square())

    def convert(self, coord, player):
        self.set_square(coord, Square(self.field[coord].ship, player))

    def take_action(self, player, data):
        handler = self.handlers[player]
        if data["phase"] != self.phase:
            return
        if player != self.player:
            return
        if self.field[data["source"]].player != player:
            return
        if not self.phase in [Phase.move, Phase.attack]:
            return
        ship = self.field[data["source"]].ship
        actions = ship.move_actions if self.phase == Phase.move else ship.attack_actions
        if data["type"] not in actions:
            return
        action = actions[data["type"]]
        if not action.is_possible(self, data["source"], data["destination"]):
            return
        action.take(self, data["source"], data["destination"])
