from django.db import models
from django.contrib.auth.models import AbstractUser
from trueskill import MU, SIGMA

class CustomUser(AbstractUser):
    rate_mu = models.FloatField(default=MU)
    rate_sigma = models.FloatField(default=SIGMA)
    rate_ordering = models.FloatField(default=0)
    avatar_url = models.URLField(default="")

    def get_rate(self):
        return self.rate_mu - 3 * self.rate_sigma

    def save(self, *args, **kwargs):
        self.rate_ordering = self.get_rate()
        super(CustomUser, self).save(*args, **kwargs)

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
    player1 = models.ForeignKey(CustomUser, related_name="player1")
    player2 = models.ForeignKey(CustomUser, related_name="player2")
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

    @classmethod
    def get_by_player(cls, player_id):
        return cls.objects.filter(models.Q(player1_id=player_id) | models.Q(player2_id=player_id))

    def get_role(self, player_id):
        if self.player1_id == player_id:
            return 1
        if self.player2_id == player_id:
            return 2
        return None

    def get_opponent(self, player_id):
        role = self.get_role(player_id)
        if role == 1:
            return self.player2
        if role == 2:
            return self.player1
        return None
