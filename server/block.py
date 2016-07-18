from struct import *

class Block:
    def __init__(self, ship, number, coords):
        self.ship = ship
        self.number = number
        self.coords = coords

    def strength(self):
        return self.ship.strength*self.number

    def check(self):
        if self.ship.strength is None:
            raise "Unblockable ship"
        return True
