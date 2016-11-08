from structs import *

class Block:
    def __init__(self, ship, coords):
        self.ship = ship
        self.coords = coords

    def strength(self):
        return Ships[self.ship].strength*len(self.coords)

    def check(self, field, main):
        if self.ship.strength is None:
            raise "Unblockable ship"
        if not 1 <= len(self.coords) <= 3:
            raise "Wrong length"
        if not main in self.coords:
            raise "Not contain main ship"
        player = field[main].player
        if not all([field[coord].player == player for coord in self.coords]):
            raise "Not yours"
        for coord in self.coords:
            for other in self.coords:
                if (coord - other).dist() == 1:
                    break
            else:
                raise "Not adjacent"
        ships = tuple(sorted([field[coord].ship.name() for coord in self.coords]))
        for coord in self.coords:
            if field[coord].ship.accept_block(self.ship, ships):
                return True
        return False
