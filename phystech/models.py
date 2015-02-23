from django.db import models
from django.contrib.auth.models import User
from trueskill import MU, SIGMA

class Player(models.Model):
    user = models.OneToOneField(User, primary_key=True)
    rate_mu = models.FloatField(default=MU)
    rate_sigma = models.FloatField(default=SIGMA)

class Game(models.Model):
    NOT_STARTED = 0
    ONGOING = 1
    FINISHED = 2
    INTERRUPTED = 3
    STATUS = (
        (0, "Not started"),
        (1, "Ongoing"),
        (2, "Finished"),
        (3, "Interrupted"))
    player1 = models.ForeignKey(User, related_name="player1")
    player2 = models.ForeignKey(User, related_name="player2")
    status = models.PositiveSmallIntegerField(choices=STATUS, default=0)
    first_won = models.NullBooleanField()
    history = models.FileField(null=True, blank=True)

    def get_winner(self, looser=False):
        if self.first_won is None:
            return None
        else:
            return self.player1 if self.first_won ^ looser else self.player2

    def get_looser(self):
        return self.get_winner(looser=True)

    def is_ongoing(self):
        return self.status == 1
