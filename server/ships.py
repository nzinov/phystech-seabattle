from structs import Coord

class Ship:
    move_distance = 1
    patron = None
    shot_immune = []
    disposable = True

    @staticmethod
    def is_empty():
        return False

    @staticmethod
    def can_shoot(source, destination, mode, field):
        return False

    @staticmethod
    def can_attack(source, destination, field):
        return False

    @staticmethod
    def fire(destination, mode, game):
        game.destroy(destination)

@staticmethod
def simple_can_attack(source, destination, field):
    if field[destination].player == field[source].player.op():
        raise "Not opponent"
    if (destination - source).dist() != 1:
        raise "Too far"
    return True

class Ships:
    class Empty(Ship):
        @staticmethod
        def is_empty():
            return True

    class AB(Ship):
        pass

    class Av(Ship):
        can_attack = simple_can_attack

    class Br(Ship):
        disposable = False

        @staticmethod
        def can_shoot(source, destination, mode, field):
            return (destination - source).dist() == 1 and field[destination].player == field[source].player.op()

        @staticmethod
        def fire(destination, mode, game):
            game.convert(destination, game.player)

    class Es(Ship):
        can_attack = simple_can_attack

    class F(Ship):
        move_distance = 0
        shot_immune = [Ships.T, Ships.Sm, Ships.Rk]

    class Kr(Ship):
        can_attack = simple_can_attack

    class KrPl(Ship):
        can_attack = simple_can_attack

    class Lk(Ship):
        can_attack = simple_can_attack

    class Mn(Ship):
        patron = Ships.Es

    class NB(Ship):
        pass

    class Pl(Ship):
        can_attack = simple_can_attack

    class Rd(Ship):
        can_attack = simple_can_attack

    class Rk(Ship):
        patron = Ships.KrPl

        @staticmethod
        def can_shoot(source, destination, mode, field):
            if mode == 1:
                return ((destination - source).dist() <= 3 and
                        (destination - source).straight() and
                        field[destination].player == field[source].player.op())
            else:
                return ((destination - source).dist() <= 2 and
                        (destination - source).straight())

        @staticmethod
        def fire(destination, mode, game):
            if mode == 1:
                game.destroy(destination)
            else:
                game.explode(destination, 1)

    class Sm(Ship):
        patron = Ships.Av

        @staticmethod
        def can_shoot(source, destination, mode, field):
            return (((destination - source).straight() or (destination - source).diag())
                    and field[destination].player == field[source].player.op())

    class St(Ship):
        can_attack = simple_can_attack

    class Tk(Ship):
        max_move_distance = 2
        can_attack = simple_can_attack

    class T(Ship):
        patron = Ships.Tk
        max_move_distance = 2

        @staticmethod
        def can_shoot(source, destination, mode, field):
            dist = Coord.dist(source, destination)
            if dist > 4:
                raise "Too far"
            direction = (source - destination).dir()
            if not direction.straight():
                raise "Not line"
            for pos in range(1, dist):
                if not self.field[source + pos*direction].empty():
                    raise "Way blocked"
            return True


    class Tp(Ship):
        can_attack = simple_can_attack

    class Tr(Ship):
        can_attack = simple_can_attack
