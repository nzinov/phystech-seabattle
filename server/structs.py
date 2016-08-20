from enum import Enum

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

class Square:
    def __init__(self, ship=None, player=None):
        if isinstance(ship, tuple):
            self.ship = Ships[ship[1]]
            self.player = ship[0]
        else:
            self.ship = ship
            self.player = player

    def dump(self):
        return (self.player, self.ship.name())

    def empty(self):
        return self.ship is None

    def opp(self):
        if self.player not in [0, 1]:
            raise ValueError
        return 1 if self.player == 0 else 0

class Coord:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        if not self.is_legal():
            raise ValueError()

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

class Field:
    def __init__(self, height, width=None):
        if not width:
            width = height
        self.array = [[Square() for i in range(width)] for j in range(height)]

    def dump(self):
        return [[el.dump() for el in row] for row in self.array]

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
        if not isinstance(value, None):
            raise TypeError()
        index = Field._getindex(index)
        self.array[index.x][index.y] = value

Phase = Enum('Phase', "displace, move, attack, end")

