from structs import *

def patron_near(patron_type, coord, field):
    for x in range(-1, 2):
        for y in range(-1, 2):
            if x == 0 and y == 0:
                continue
            if not (coord + Coord(x, y)).is_legal():
                continue
            current_square = field[coord + Coord(x, y)]
            if (current_square.ship.name() in [patron_type, "Tp"]
                    and current_square.player == field[coord].player):
                return True
    return False


class Action:
    @staticmethod
    def init(game):
        pass

    @staticmethod
    def is_possible(*args):
        return False

    @staticmethod
    def take(*args):
        pass

class Move(Action):
    @staticmethod
    def is_possible(game, source, destination):
        if not game.field[source].is_his(game.player):
            raise "Not yours"
        if not game.field[destination].empty():
            raise "Occupied"
        ship = game.field[source].ship
        if not source.dist(destination) <= ship.move_distance:
            raise "Too far"
        routes = []
        if (source - destination).dist() == 1:
            routes.append([source, destination])
        else:
            shift = source - destination
            if shift.x == 0 or shift.y == 0:
                routes.append([source, source + shift // 2, destination])
            else:
                routes.append([source, source + Coord(shift.x, 0), destination])
                routes.append([source, source + Coord(0, shift.y), destination])
        routes = [route for route in routes
                if all([game.field[coord].empty() for coord in route[1:]])]
        if ship.patron is not None:
            routes = [route for route in routes
                    if all([patron_near(ship.patron, coord, game.field)
                        for coord in route])]
        if not routes:
            raise "No route"

    @staticmethod
    def take(game, source, destination):
        game._move(source, destination)
        game.set_phase(Phase.attack, game.player)

class Shoot(Action):
    @staticmethod
    def take(game, source, destination):
        game.destroy(source)
        failed = game.field[destination].ship.name()  == "F"
        if not failed:
            game.destroy(destination)
        game.set_phase(Phase.move, 1 - game.player if failed else game.player)

class Attack(Action):
    @staticmethod
    def is_possible(game, source, destination):
        if game.field[destination].is_opp(game.player):
            raise "Not opponent"
        if (destination - source).dist() != 1:
            raise "Too far"
        return True

    @staticmethod
    def take(game, source, destination):
        win = None
        squares = [source, destination]
        blocks = [None]*2
        ships = [game.field[source].ship,
                 game.field[destination].ship]
        if ships[1].explosive:
            win = ships[0].name() == "Tr"
            if not win:
                game.destroy(source)
                if ships[1].on_attack is not None:
                    ships[1].on_attack.take(game, destination)
            game.destroy(destination)
        else:
            for player, ship in enumerate(ships):
                if ship.strength is not None:
                    blocks[player] = game.ask_block(squares[player])
            if blocks[1]:
                blocks[1] = blocks[1].wait()
            game.send_block(blocks[1] if blocks[1] else Block(ships[1], [destination]))
            if blocks[0]:
                blocks[0] = blocks[0].wait()

            if all(blocks):
                if blocks[0].strength() == blocks[1].strength():
                    win = None
                else:
                    win = blocks[0].strength() > blocks[1].strength()
            else:
                if ships[0].name() == ships[1].name():
                    win = None
                else:
                    if not blocks[0]:
                        win = ships[1].name() in ships[0].conquers
                    else:
                        win = ships[0].name() not in ships[1].conquers
            game.attack(source, destination, win)
            if win is None:
                for block, square in zip(blocks, squares):
                    if block:
                        for el in block.coords:
                            game.destroy(el)
                    else:
                        game.destroy(square)
            else:
                game.destroy(squares[win])
        game.set_phase(Phase.move, game.player if win else 1 - game.player)

class Explode(Action):
    radius = 2

    @staticmethod
    def action(game, coord):
        game.destroy(coord)

    @staticmethod
    def is_possible(*args):
        return True

    @classmethod
    def take(cls, game, source):
        game.destroy(source)
        for x in range(-cls.radius, cls.radius + 1):
            for y in range(-cls.radius, cls.radius + 1):
                if x == 0 and y == 0:
                    continue
                coord = source + Coord(x, y)
                if not coord.is_legal():
                    continue
                if not game.field[coord].empty():
                    cls.action(game, coord)
        game.set_phase(Phase.move, game.player)
