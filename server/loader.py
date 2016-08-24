from .game import Game

class GameLoader:
    pool = {}

    @classmethod
    def load(cls, game_id):
        if not game_id in cls.pool:
            cls.pool[game_id] = Game()
        return cls.pool[game_id]
