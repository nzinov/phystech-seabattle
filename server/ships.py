from game import Coord

def next_square(state, source, destination):
    return Coord.dist(source, destination) == 1

def double_move(state, source, destination):
    if Coord.dist(source, destination) != 2:
        return False
    dist = source - destination
    if dist.x == 0 or dist.y == 0:
        return state.field[source + dist*0.5].empty()
    else:
        return (state.field[source + Coord(dist.x, 0)].empty() or
                state.field[source + Coord(0, dist.y)].empty())

def patron_near(patron_type):
    def wrapped(state, source, destination):
        for coord in (source, destination):
            flag = False
            for x in range(-1, 2):
                for y in range(-1, 2):
                    if x == 0 and y == 0:
                        continue
                    if state.field[coord + Coord(x, y)].fig == patron_type:
                        flag = True
            if not flag:
                return False
        return True
    return wrapped

class Ship:
    @staticmethod
    def apply_policy(policy, *args):
        for el in policy:
            if not el(*args):
                return False
        return True

    move_policy = (next_square,)

class Fig:
    class Empty(Ship):
        pass

    class AB(Ship):
        pass

    class Av(Ship):
        pass

    class Br(Ship):
        pass

    class Es(Ship):
        pass

    class F(Ship):
        @staticmethod
        def no_move(*args):
            raise "Fort can't move"

        move_policy = (no_move,)

    class Kr(Ship):
        pass

    class KrPl(Ship):
        pass

    class Lk(Ship):
        pass

    class Mn(Ship):
        move_policy = (next_square, patron_near(Fig.Es))

    class NB(Ship):
        pass

    class Pl(Ship):
        pass

    class Rd(Ship):
        pass

    class Rk(Ship):
        move_policy = (next_square, patron_near(Fig.KrPl))

    class Sm(Ship):
        move_policy = (next_square, patron_near(Fig.Av))

    class St(Ship):
        pass

    class Tk(Ship):
        move_policy = (double_move,)

    class T(Ship):
        move_policy = (double_move, patron_near(Fig.Tk))

    class Tp(Ship):
        pass

    class Tr(Ship):
        pass
