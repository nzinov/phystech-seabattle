from structs import Coord
from action import *
from util import *

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

class Ships:
    class AB(Ship):
        explosive = True
        on_attack = Explode
        attack_actions = {"e": Explode}

    class Av(Ship):
        attack_actions = {"a": Attack}

    class Br(Ship):
        explosive = True
        class Capture(Action):
            @attached("game_init")
            @staticmethod
            def init(game):
                game.brander_used = [None, False, False]
                def _hook(game, phase, player):
                    game.brander_used[3 - player] = False
                    if phase == Phase.attack:
                        game.brander_used[player] = False
                game.set_phase.add_hook(_hook)

            @staticmethod
            def is_possible(game, source, destination):
                return not game.brander_used[game.player] and (destination - source).dist() == 1 and game.field[destination].is_opp(game.player)

            @staticmethod
            def take(game, source, destination):
                game.convert(destination, game.player)
                game.set_phase(Phase.move, game.player)
                game.brander_used[game.player] = True

        move_actions = {"m": Move, "c": Capture}

    class Es(Ship):
        attack_actions = {"a": Attack}

    class F(Ship):
        move_actions = {}
        attack_actions = {}

    class Kr(Ship):
        attack_actions = {"a": Attack}

    class Lk(Ship):
        attack_actions = {"a": Attack}

    class KrPl(Ship):
        attack_actions = {"a": Attack}

    class Mn(Ship):
        explosive = True
        patron = Ships.Es

    class NB(Ship):
        explosive = True

        class NBExplode(Explode):
            @staticmethod
            def action(game, coord):
                game.disown(coord)

        on_attack = NBExplode
        attack_actions = {"e": NBExplode}

    class Pl(Ship):
        attack_actions = {"a": Attack}

    class Rd(Ship):
        explosive = True
        attack_actions = {"a": Attack}

    class Rk(Ship):
        explosive = True
        patron = Ships.KrPl

        class RocketShoot(Shoot):
            @staticmethod
            def is_possible(game, source, destination):
                if not patron_near(Ships.KrPl, source, game.field):
                    raise "No patron"
                return ((destination - source).dist() <= 3 and
                        (destination - source).straight() and
                        game.field[destination].is_opp(game.player))

        class RocketAOE(Explode):
            radius = 1

            @staticmethod
            def is_possible(game, source, destination):
                if not patron_near(Ships.KrPl, source, game.field):
                    raise "No patron"
                return ((destination - source).dist() <= 2 and
                        (destination - source).straight())

        move_actions = {"m": Move, "s": RocketShoot, "r": RocketAOE}


    class Sm(Ship):
        explosive = True
        patron = Ships.Av

        class AirplaneShoot(Shoot):
            @staticmethod
            def is_possible(game, source, destination):
                if not patron_near(Ships.Av, source, game.field):
                    raise "No patron"
                return (((destination - source).straight() or (destination - source).diag())
                        and game.field[destination].is_opp(game.player))

        move_actions = {"m": Move, "s": AirplaneShoot}

    class St(Ship):
        attack_actions = {"a": Attack}

    class Tk(Ship):
        max_move_distance = 2
        attack_actions = {"a": Attack}

    class T(Ship):
        explosive = True
        patron = Ships.Tk
        max_move_distance = 2

        class TorpedoShoot(Shoot):
            @staticmethod
            def is_possible(game, source, destination):
                if not patron_near(Ships.Tk, source, game.field):
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

    class Tp(Ship):
        attack_actions = {"a": Attack}

    class Tr(Ship):
        attack_actions = {"a": Attack}
    
    KrPl.conquers = [Ships.Av, Ships.Lk, Ships.Pl, Ships.St, Ships.Tk, Ships.Tr, Ships.Tp]
    Pl.conquers = [Ships.Lk, Ships.Tp]
