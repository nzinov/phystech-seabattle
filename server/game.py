from enum import Enum

Fig = Enum('Fig', "Empty, Unknown, Sinking," + #pylint: disable=invalid-name
           "AB, Av, Br, Es, F, Kr, KrPl, Lk, Mn," +
           "NB, Pl, Rd, Rk, Sm, St, T, Tk, Tp, Tr")

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

    def __abs__(self):
        return Coord(abs(self.x), abs(self.y))

    @staticmethod
    def sign(number):
        return 1 if number > 0 else (0 if number == 0 else -1)

    def dir(self):
        return Coord(Coord.sign(self.x), Coord.sign(self.y))

class Field:
    def __init__(self, size):
        self.array = [[Square() for i in range(size)] for j in range(size)]

    @staticmethod
    def _getindex(index):
        if type(index) is Coord:
            return index
        elif type(index) is tuple:
            return Coord(index[0], index[1])
        raise TypeError()

    def __getitem__(self, index):
        index = Field._getindex(index)
        return self.array[index.x][index.y]

    def __setitem__(self, index, value):
        if type(value) is not Square:
            raise ValueError()
        index = Field._getindex(index)
        self.array[index.x][index.y] = value

Phase = Enum('Phase', "displace, move, attack, end") #pylint: disable=invalid-name

def opponent(player):
    return 2 if player == 1 else 1

class GameController:
    FIELD_SIZE = 14
    DISPLACE_SIZE = 5
    FIG_COUNT = [0, 0, 0, 1, 1, 2, 6, 2, 6, 1, 2,
                 7, 1, 4, 2, 1, 1, 7, 4, 6, 1, 7]

    def log(self, msg):
        pass

    def notify(self, msg, who):
        pass

    def __init__(self):
        self.field = Field(self.FIELD_SIZE)
        self.phase = Phase.displace
        self.player = 0
        self.ready = [False, False]
        self.used_Br = False

    def set_phase(self, phase, player):
        self.phase = phase
        self.player = player
        self.notify({"type": "phase", "phase": phase, "player": player}, "both")

    def set_fig(self, x, y, fig):
        self.field[x][y] = fig
        self.notify({"type": "field", "x": x, "y": y, "fig": fig.fig,
                     "player": fig.player}, "both")

    def displace(self, player, field):
        counts = [0 for el in Fig]
        if self.phase != Phase.displace or self.ready[player]:
            raise "Bad phase"
        if len(field) != self.DISPLACE_SIZE or len(field[0]) != self.FIELD_SIZE:
            raise "Bad size"
        for row in field:
            for el in row:
                counts[el.fig] += 1
                if el.player != player:
                    raise "Bad fig"
        if counts != self.FIG_COUNT:
            raise "Bad fig count"
        lower = 0 if player == 1 else self.FIELD_SIZE - self.DISPLACE_SIZE
        upper = lower + self.DISPLACE_SIZE
        self.field[lower:upper] = field
        self.log({"type": "displaced", "player": player})
        self.ready[player] = True
        if False not in self.ready:
            self.set_phase(Phase.move, 1)

    def can_move(self, source, destination):
        if Coord.dist(source, destination) == 1:
            return True
        if (self.field[source] not in [Fig.Tk, Fig.T] or
                Coord.dist(source, destination) != 2):
            return False
        dist = source - destination
        if dist.x == 0 or dist.y == 0:
            return self.field[source + dist*0.5].empty()
        else:
            return (self.field[source + Coord(dist.x, 0)].empty() or
                    self.field[source + Coord(0, dist.y)].empty())

    def _move(self, source, destination, log=True):
        if log:
            self.log({"type": "move", "source": source,
                      "destination": destination})
        self.field[destination] = self.field[source]
        self.field[source] = Square()

    def move(self, player, source, destination):
        if self.phase != Phase.move or self.player != player:
            raise "Bad phase"
        if self.field[source].player != player:
            raise "Not yours"
        if not self.field[destination].empty():
            raise "Occupied"
        if not self.can_move(source, destination):
            raise "Too far"
        self._move(source, destination)
        self.set_phase(Phase.attack, player)

    def destroy(self, coord, log=True):
        if log:
            self.log({"type": "destroy", "coord": coord,
                      "fig": self.field[coord]})
        self.field[coord] = Square()

    def convert(self, coord, player, log=True):
        if log:
            self.log({"type": "convert", "coord": coord, "player": player})
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

    def explode(self, point, radius, neutron=False):
        for x in range(max(0, point.x - radius),
                       min(self.FIELD_SIZE, point.x + radius)):
            for y in range(max(0, point.y - radius),
                           min(self.FIELD_SIZE, point.y + radius)):
                if not self.field[x][y].empty():
                    if neutron:
                        self.sink(Coord(x, y))
                    else:
                        self.destroy(Coord(x, y))


    def shot(self, player, source, target, is_aoe):
        if self.phase != Phase.move or self.player != player:
            raise "Bad phase"
        if self.field[source].player != player:
            raise "Not yours"
        if not (self.field[target].player == opponent(player) or
                (self.field[source].fig == Fig.Rk and is_aoe)):
            raise "No target"
        fig = self.field[source].fig
        if fig == Fig.T:
            if not self.can_torpedo(source, target):
                raise "Can't torpedo"
            self._shot(source, target)
        elif fig == Fig.Sm:
            dist = target - source
            if dist.x == 0 or dist.y == 0 or dist.x == dist.y:
                self._shot(source, target)
            else:
                raise "Can't shot"
        elif fig == Fig.Br:
            if self.used_Br:
                raise "Not allowed"
            if Coord.dist(source, target) > 1:
                raise "Too far"
            self.convert(target, player, True)
        elif fig == Fig.Rk:
            if is_aoe:
                if Coord.dist(source, target) <= 2:
                    self.destroy(source)
                    self.explode(target, 3)
                else:
                    raise "Too far"
            else:
                if Coord.dist(source, target) <= 3:
                    self._shot(source, target)
                else:
                    raise "Too far"
        else:
            raise "Can't shot"

    def explode_bomb(self, square):
        self.explode(square, 5, self.field[square].fig == Fig.NB)

    def attack(self, player, source, target):
        if self.phase != Phase.attack or self.player != player:
            raise "Bad phase"
        if self.field[source].player != player:
            raise "Not yours"
        if self.field[target].empty():
            raise "Empty"
        fig = self.field[source].fig
        if fig in [Fig.AB, Fig.NB] and source == target:
            self.explode_bomb(source)
            self.set_phase(Phase.move, player)
            return
        if self.field[target].player == 0:
            self.convert(source, player, True)
            return
        if self.field[target].player == player:
            raise "Can't attack yourself"
        if fig not in [Fig.Tp, Fig.Tr, Fig.Tk, Fig.St,
                       Fig.Es, Fig.Rd, Fig.Kr, Fig.Lk,
                       Fig.Av, Fig.Pl, Fig.KrPl]:
            raise "Not attacking"
        target_fig = self.field[target].fig
        if target_fig in [Fig.Mn, Fig.T, Fig.Rk, Fig.Sm, Fig.AB, Fig.NB, Fig.Br]:
            if fig == Fig.Tr:
                self.destroy(target)
            else:
                self.destroy(source)
                if target_fig in [Fig.AB, Fig.NB]:
                    self.explode_bomb(target)
                else:
                    self.destroy(target)
        if target_fig == Fig.F:
            self.destroy(target)
        if fig not in [Fig.Pl, Fig.KrPl, Fig.Tp]:
            self.ask_block(source)
        if self.field[target].fig not in [Fig.Pl, Fig.KrPl, Fig.Tp]:
            self.ask_block(target)

    def take_action(self, data):
        if data.phase != self.phase:
            raise "Bad phase"
        ACTIONS = {
            Phase.displace : self.displace,
            Phase.move : self.move,
            Phase.attack : self.attack
        }
        ACTIONS[data.phase](data)
