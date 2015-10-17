from game import Coord
from pipeline import PipelineFailure, unpack

@unpack()
def target_empty(field, destination):
    if not field[destination].fig.is_empty():
        raise PipelineFailure("Can't move to an occupied square")
    return True

def max_dist(dist):
    @unpack
    def wrapped(source, destination):
        return source.dist(destination) <= dist
    return wrapped

@unpack()
def get_routes(source, destination, field):
    routes = []
    if Coord.dist(source, destination) == 1:
        routes.append([source, destination])
    else:
        shift = source - destination
        if shift.x == 0 or shift.y == 0:
            routes.append([source, source + shift // 2, destination])
        else:
            routes.append([source, source + Coord(shift.x, 0), destination])
            routes.append([source, source + Coord(0, shift.y), destination])
    routes = [route for route in routes
              if all([field[coord].empty() for coord in route[1:]])]
    return (True, {"routes"})

def patron_near_route(patron_type):
    @unpack()
    def wrapped(routes, field):
        routes = [route for route in routes
                  if all([patron_near(patron_type, coord, field)
                          for coord in route])]
    return wrapped

def patron_near(patron_type, coord, field):
    for x in range(-1, 2):
        for y in range(-1, 2):
            if x == 0 and y == 0:
                continue
            if not Coord(x, y).is_legal():
                continue
            current_square = field[coord + Coord(x, y)]
            if (isinstance(current_square, [patron_type, Ships.Tp])
                    and current_square.player == field[coord].player):
                return True
    return False

@unpack()
def has_route(routes):
    return len(routes) > 0


class Ship:
    max_move_distance = 1
    patron = None

    @staticmethod
    def is_empty():
        return False

    @classmethod
    def move(cls, source, destination, field):
        if not field[destination].empty():
            return False
        if source == destination:
            return False
        shift = source - destination
        if not shift.dist() < cls.max_move_distance:
            return False
        routes = []
        if shift.dist == 1:
            routes.append((source, destination))
        else:
            if shift.x == 0 or shift.y == 0:
                routes.append(source, source + shift // 2, destination)
            else:
                routes.extend([
                    (source, source + shift.x, destination),
                    (source, source + shift.y, destination),
                ])
        if cls.patron is not None:
            routes = [route for route in routes if all(
                [patron_near(cls.patron, square, field) for square in route]
                )]
        if len(routes) == 0:
            return False
        return True

class Ships:
    class Empty(Ship):
        @staticmethod
        def is_empty():
            return True

    class AB(Ship):
        pass

    class Av(Ship):
        pass

    class Br(Ship):
        pass

    class Es(Ship):
        pass

    class F(Ship): #pylint: disable=invalid-name
        @staticmethod
        def move(*args): #pylint: disable=unused-argument
            return False

    class Kr(Ship):
        pass

    class KrPl(Ship):
        pass

    class Lk(Ship):
        pass

    class Mn(Ship):
        patron = Ships.Es

    class NB(Ship):
        pass

    class Pl(Ship):
        pass

    class Rd(Ship):
        pass

    class Rk(Ship):
        patron = Ships.KrPl

    class Sm(Ship):
        patron = Ships.Av

    class St(Ship):
        pass

    class Tk(Ship):
        max_move_distance = 2

    class T(Ship): #pylint: disable=invalid-name
        patron = Ships.Tk
        max_move_distance = 2

    class Tp(Ship):
        pass

    class Tr(Ship):
        pass
