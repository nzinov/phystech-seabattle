from django.contrib import admin
from phystech.models import Game, CustomUser

# Register your models here.
admin.site.register(CustomUser)
admin.site.register(Game)
