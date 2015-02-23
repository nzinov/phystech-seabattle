from django.shortcuts import render, get_object_or_404, redirect
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponseForbidden, HttpResponse
from phystech.utils import sign, get_signature
from phystech.models import Game
from django.conf import settings


def index(request):
    context = {}
    return render(request, 'index.html', context)

def game(request, game_id):
    context = {}
    context["row_id"] = list(range(14))
    game_obj = get_object_or_404(Game, pk=game_id)
    if game_obj.status == Game.FINISHED:
        if game_obj.history:
            return "view history"
        else:
            return "no history"
    else:
        if not request.user.is_authenticated():
            return redirect('login')
        if request.user in [game_obj.player1, game_obj.player2]:
            player = 1 if request.user == game_obj.player1 else 2
            context["mode"] = "game"
            context["code"] = sign("{}x{}".format(game_id, player))
            context["player_num"] = player
            context["server"] = settings.GAME_SERVER
            context["first"] = game_obj.player1.first_name
            context["second"] = game_obj.player2.first_name
        else:
            return "observe"
    return render(request, 'game.html', context)

@csrf_exempt
def support(request):
    command = request.POST["command"]
    signature = request.POST["signature"]
    if signature != get_signature(command):
        return HttpResponseForbidden(get_signature(command)+"//"+signature)
    command = command.split(':')
    if command[0] == "start":
        game_obj = get_object_or_404(Game, pk=command[1])
        game_obj.status = Game.ONGOING
        game_obj.save()
    elif command[0] == "end":
        game_obj = get_object_or_404(Game, pk=command[1])
        game_obj.status = Game.FINISHED
        game_obj.first_won = (None if int(command[2]) == 0
                              else int(command[2]) == 1)
        game_obj.save()
    return HttpResponse()



