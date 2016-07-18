from util import *
from structs import *
from ships import Ships

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
    @attachable("game_init")
    def __init__(self):
        self.rules = GameRules()
        self.field = Field(self.rules.FIELD_SIZE, self.rules.FIELD_SIZE)
        self.phase = Phase.displace
        self.player = Player()
        self.players = [Player() for i in range(2)]
        self.ready = [False]*2
        self.action_log = []

    def restore(self):
        for el in self.action_log:
            if el.action in RESTORABLE_ACTIONS:
                RESTORABLE_ACTIONS[el.action](*el.args, is_real=False)

    def log(self, message):
        self.action_log.append(message)

    def notify(self, whom, message):
        self.players[whom].send(message)

    @hooked
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
        if not all([a == b for a, b in zip(counts, self.rules.FIG_COUNT)]):
            raise "Bad fig count"
        lower = 0 if player == 1 else self.rules.FIELD_SIZE - self.rules.DISPLACE_SIZE
        for x in range(self.rules.DISPLACE_SIZE):
            for y in range(self.rules.FIELD_SIZE):
                self.set_fig(Coord(lower + x, y), field(x, y))
        self.log({"type": "displaced", "player": player})
        self.ready[player] = True
        if False not in self.ready:
            self.set_phase(Phase.move, FIRST)

    @restorable
    def _move(self, source, destination):
        self.field[destination] = self.field[source]
        self.field[source] = Square()

    @restorable
    def destroy(self, coord):
        self.field[coord] = Square()

    @restorable
    def convert(self, coord, player):
        self.field[coord].player = player

    def _shoot(self, source, destination, mode):
        ship = self.field[source].ship
        success = ship not in self.field[destination].ship.shot_immune
        self.log({"type": "shot", "fig": self.field[source].fig,
                  "player": self.field[source].player,
                  "success": success})
        if success:
            ship.fire(destination, mode, self)
        if source and ship.disposable:
            self.destroy(source)
        self.set_phase(Phase.move, self.player if success else not self.player)

    def shoot(self, source, destination, mode):
        if self.field[source].player != self.player:
            raise "Not yours"
        ship = self.field[source].ship
        if not ship.can_shoot(source, destination, mode, self.field):
            raise "Can't shoot"
        self._shoot(source, destination, mode)

    def attack(self, source, destination):
        if self.field[source].player != self.player:
            raise "Not yours"

    def take_action(self, data):
        if data.phase != self.phase:
            raise "Bad phase"
        ACTIONS = {
            Phase.displace : self.displace,
            Phase.move : self.move,
            Phase.attack : self.attack
        }
        ACTIONS[data.phase](data)
