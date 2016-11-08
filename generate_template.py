# coding: utf-8
s = open("client/game.html").read()
import tornado.template
t = tornado.template.Template(s)
f = open("client/generated.html", "w")
f.write(t.generate().decode())
f.close()
