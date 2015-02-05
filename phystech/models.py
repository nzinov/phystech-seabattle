from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Game(models.Model):
    STATUS = (
        (0, "Not started"),
        (1, "Ongoing"),
        (2, "Finished"),
        (3, "Postponed"))
    player1 = models.ForeignKey(User, related_name="+")
    player2 = models.ForeignKey(User, related_name="+")
    status = models.PositiveSmallIntegerField(choices=STATUS)
    first_won = models.NullBooleanField()

    def get_winner(self, looser=False):
        if self.first_won is None:
            return None
        else:
            return self.player1 if self.first_won ^ looser else self.player2

    def get_looser(self):
        return self.get_winner(True)

    def is_ongoing(self):
        return self.status == 1
