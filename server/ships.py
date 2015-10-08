from game import Coord
from pipeline import Pipeline, PipelineFailure, unpack

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
            if (isinstance(current_square, [patron_type, Fig.Tp])
                    and current_square.player == field[coord].player):
                return True
    return False

@unpack()
def has_route(routes):
    return len(routes) > 0


class Ship:
    move = Pipeline(target_empty, max_dist(1), get_routes, has_route)

    @staticmethod
    def is_empty():
        return False

class Fig:
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
        def no_move():
            return False

        move = Pipeline(no_move)

    class Kr(Ship):
        pass

    class KrPl(Ship):
        pass

    class Lk(Ship):
        pass

    class Mn(Ship):
        move = Pipeline(target_empty, max_dist(1), get_routes,
                        patron_near_route(Fig.Es), has_route)

    class NB(Ship):
        pass

    class Pl(Ship):
        pass

    class Rd(Ship):
        pass

    class Rk(Ship):
        move = Pipeline(target_empty, max_dist(1), get_routes,
                        patron_near_route(Fig.KrPl), has_route)

    class Sm(Ship):
        move = Pipeline(target_empty, max_dist(1), get_routes,
                        patron_near_route(Fig.Sm), has_route)

    class St(Ship):
        pass

    class Tk(Ship):
        move = Pipeline(target_empty, max_dist(2), get_routes, has_route)

    class T(Ship): #pylint: disable=invalid-name
        move = Pipeline(target_empty, max_dist(2), get_routes,
                        patron_near_route(Fig.Tk), has_route)

    class Tp(Ship):
        pass

    class Tr(Ship):
        pass
