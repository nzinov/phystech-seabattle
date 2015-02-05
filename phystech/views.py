from django.shortcuts import render


def index(request):
    context = {}
    return render(request, 'index.html', context)

def game(request):
    return render(request, 'game.html', {"row_id": list(range(14))})
# Create your views here.
