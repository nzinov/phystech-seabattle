from structs import Coord, Ships
from action import *
from utils import *

class Ship:
    move_distance = 1
    explosive = False
    patron = None
    strength = None
    on_attack = None
    conquers = []

    move_actions = {"m": Move}
    attack_actions = {}
    @staticmethod
    def is_empty():
        return False

    @classmethod
    def name(cls):
        return cls.__name__

    @classmethod
    def accept_block(cls, name, ships):
        return name == cls.name() and all([el == cls.name() for el in ships])

@Ships.register
class AB(Ship):
    explosive = True
    on_attack = Explode
    attack_actions = {"e": Explode}

@Ships.register
class Av(Ship):
    attack_actions = {"a": Attack}

@Ships.register
class Br(Ship):
    explosive = True
    class Capture(Action):
        @attached("game_init")
        @staticmethod
        def init(game):
            game.brander_used = [False, False]
            def _hook(game, phase, player):
                game.brander_used[1 - player] = False
                if phase == Phase.attack:
                    game.brander_used[player] = False
            game.set_phase.add_hook(_hook)

        @staticmethod
        def is_possible(game, source, destination):
            return not (game.brander_used[game.player] and
                        (destination - source).dist() == 1 and
                        game.field[destination].is_opp(game.player))

        @staticmethod
        def take(game, source, destination):
            game.convert(destination, game.player)
            game.set_phase(Phase.move, game.player)
            game.brander_used[game.player] = True

    move_actions = {"m": Move, "c": Capture}

@Ships.register
class Es(Ship):
    attack_actions = {"a": Attack}

@Ships.register
class F(Ship):
    move_actions = {}
    attack_actions = {}

@Ships.register
class Kr(Ship):
    attack_actions = {"a": Attack}

@Ships.register
class Lk(Ship):
    attack_actions = {"a": Attack}

@Ships.register
class KrPl(Ship):
    attack_actions = {"a": Attack}
    conquers = ["Av", "Lk", "Pl", "St", "Tk", "Tr", "Tp"]

@Ships.register
class Mn(Ship):
    explosive = True
    patron = "Es"

@Ships.register
class NB(Ship):
    explosive = True

    class NBExplode(Explode):
        @staticmethod
        def action(game, coord):
            game.disown(coord)

    on_attack = NBExplode
    attack_actions = {"e": NBExplode}

@Ships.register
class Pl(Ship):
    attack_actions = {"a": Attack}
    conquers = ["Lk", "Tp"]

@Ships.register
class Rd(Ship):
    explosive = True
    attack_actions = {"a": Attack}

    @classmethod
    def accept_block(cls, name, ships):
        if Ship.accept_block(name, ships):
            return True
        if all([el in [name, Rd] for el in ships]) and Ships[name].strength <= cls.strength:
            return True
        if ships in [("Es", "Rd", "St"), ("Rd", "St")] and name == "Es":
            return True
        return False

@Ships.register
class Rk(Ship):
    explosive = True
    patron = "KrPl"

    class RocketShoot(Shoot):
        @staticmethod
        def is_possible(game, source, destination):
            if not patron_near("KrPl", source, game.field):
                raise "No patron"
            return ((destination - source).dist() <= 3 and
                    (destination - source).straight() and
                    game.field[destination].is_opp(game.player))

    class RocketAOE(Explode):
        radius = 1

        @staticmethod
        def is_possible(game, source, destination):
            if not patron_near("KrPl", source, game.field):
                raise "No patron"
            return ((destination - source).dist() <= 2 and
                    (destination - source).straight())

    move_actions = {"m": Move, "s": RocketShoot, "r": RocketAOE}


@Ships.register
class Sm(Ship):
    explosive = True
    patron = "Av"

    class AirplaneShoot(Shoot):
        @staticmethod
        def is_possible(game, source, destination):
            if not patron_near("Av", source, game.field):
                raise "No patron"
            return (((destination - source).straight() or (destination - source).diag())
                    and game.field[destination].is_opp(game.player))

    move_actions = {"m": Move, "s": AirplaneShoot}

@Ships.register
class St(Ship):
    attack_actions = {"a": Attack}

@Ships.register
class Tk(Ship):
    max_move_distance = 2
    attack_actions = {"a": Attack}

@Ships.register
class T(Ship):
    explosive = True
    patron = "Tk"
    max_move_distance = 2

    class TorpedoShoot(Shoot):
        @staticmethod
        def is_possible(game, source, destination):
            if not patron_near("Tk", source, game.field):
                raise "No patron"
            dist = (source - destination).dist()
            if dist > 4:
                raise "Too far"
            direction = (source - destination).dir()
            if not direction.straight():
                raise "Not line"
            for pos in range(1, dist):
                if not game.field[source + pos*direction].empty():
                    raise "Way blocked"
            if not game.field[destination].is_opp(game.player):
                raise "Not opp"
            return True

    move_actions = {"m": Move, "s": TorpedoShoot}

@Ships.register
class Tp(Ship):
    attack_actions = {"a": Attack}

@Ships.register
class Tr(Ship):
    attack_actions = {"a": Attack}
