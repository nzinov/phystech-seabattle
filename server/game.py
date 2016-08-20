from utils import *
from structs import *
from ships import Ships

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
        self.field = Field(self.rules.FIELD_SIZE, self.rules.FIELD_SIZE)
        self.phase = Phase.displace
        self.handlers = [None]*2
        self.player = None
        self.ready = [False]*2
        self.action_log = []

    def log(self, message):
        self.action_log.append(message)
        for handler in self.handlers:
            if handler:
                handler.write_message(message)

    @hooked
    def set_phase(self, phase, player):
        self.phase = phase
        self.player = player

    def set_fig(self, coord, fig):
        self.field[coord] = fig

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
                self.set_fig(Coord(lower + x, y), field[x, y])
        self.log({"type": "displaced", "player": player})
        self.ready[player] = True
        if False not in self.ready:
            self.set_phase(Phase.move, 0)

    def move(self, source, destination):
        self.field[destination] = self.field[source]
        self.field[source] = Square()

    def destroy(self, coord):
        self.field[coord] = Square()

    def convert(self, coord, player):
        self.field[coord].player = player

    def take_action(self, player, data):
        handler = self.handlers[player]
        if player != self.player:
            handler.error("Not you")
            return
        if not self.field[data["source"]].is_his(player):
            handler.error("Not yours")
            return
        if not self.phase in [Phase.move, Phase.attack]:
            handler.error("Not now")
            return
        ship = self.field[data["source"]].ship
        actions = ship.move_actions if self.phase == Phase.move else ship.attack_actions
        if data["type"] not in actions:
            handler.error("Not avaliable")
            return
        action = actions[data["type"]]
        if not action.is_possible(self, data["source"], data["destination"]):
            handler.error("Not possible")
            return
        action.take(self, data["source"], data["destination"])
