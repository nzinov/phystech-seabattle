from .utils import dumpable

def sign(number):
    return 1 if number > 0 else (0 if number == 0 else -1)


class Ships:
    def __getitem__(self, name):
        return getattr(self, name)

    def register(self, attr):
        setattr(self, attr.__name__, attr)
        return attr

Ships = Ships()

MAX_COORD = 14

@dumpable
class Square:
    def __init__(self, ship=None, player=None):
        self.ship = ship
        self.player = player

    def __load__(self, data):
        self.ship = Ships[data[1]] if data[1] else None
        self.player = data[0]
        return self

    def __dump__(self):
        return (self.player, (self.ship.name() if self.ship else None))

    def empty(self):
        return self.ship is None

    def opp(self):
        if self.player is None:
            return None
        return 1 if self.player == 0 else 0

@dumpable
class Coord:
    def __init__(self, x=None, y=None):
        self.x = x
        self.y = y

    def __load__(self, data):
        self.x, self.y = data
        return self

    def __dump__(self):
        return (self.x, self.y)

    def dist(self):
        return abs(self.x) + abs(self.y)

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

    def dir(self):
        return Coord(sign(self.x), sign(self.y))

    def is_legal(self):
        return 0 <= self.x < MAX_COORD and 0 <= self.y < MAX_COORD

    def straight(self):
        return self.x == 0 or self.y == 0

    def diag(self):
        return self.x == self.y

@dumpable
class Field:
    def __init__(self, height, width=None):
        if not width:
            width = height
        self.array = [[Square() for i in range(width)] for j in range(height)]

    def __load__(self, data):
        self.array = [[Square().__load__(el) for el in row] for row in data]
        return self

    def __dump__(self):
        return [[el.__dump__() for el in row] for row in self.array]

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
        index = Field._getindex(index)
        self.array[index.x][index.y] = value

class Phase:
    displace = 0
    move = 1
    attack = 2
    end = 3
