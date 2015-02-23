from django.contrib import admin
from phystech.models import Game, Player
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

class PlayerAdmin(admin.StackedInline):
    model = Player
    can_delete = False

class CustomUserAdmin(UserAdmin):
    inlines = (PlayerAdmin,)

# Register your models here.
admin.site.register(Game)
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
