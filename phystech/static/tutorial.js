var current_popover = false;

function set_status(text) {
    $("#main").html(text);
}

function show_tip(args) {
    if (current_popover) {
        current_popover.popover('destroy');
    }
    current_popover = $(args.selector);
    current_popover.popover('destroy').popover({container: 'body', content: args.text, html: true, placement: args.dir, trigger: 'manual'});
    current_popover.popover('show');
}

function show_field_tip(args) {
    args["selector"] = "[id='"+args.x+":"+args.y+"']";
    show_tip(args);
}

function set_field(args) {
    for (var i = 0; i < args.length; i++) {
        set_fig(args[i][0], args[i][1], args[i][2]);
    }
}

var tips = [
    [
        [set_status, "Начало обучения. Читай подсказки. Чтобы перейти к следующей, нажимай Пробел"],
        [show_field_tip, {x: 7, y: 8, dir: "top", text: "Привет! Сейчас ты узнаешь основные правила игры в Морской бой по-физтеховски.<br/>Тебе будут помогать всплывающие подсказки. Чтобы перейти к следующей подсказке, нажимай Пробел"}]
    ],[
        [show_field_tip, {x: 6, y: 7, dir: "top", text: "Это игровое поле. Похоже на шахматное, но больше - 14 на 14 клеток"}]
    ],[
        [show_tip, {selector: "#vs", dir: "left", text: "Это информационная панель. Здесь написаны имена игроков. Ниже расположены командные кнопки."}]
    ],[
        [show_tip, {selector: "#main", dir: "left", text: "А в этой строке показывается, что сейчас происходит в игре и что тебе нужно делать"}]
    ],[
        [set_status, "Типы фишек"],
        [set_field, [[3,4,20],[3,5,20],[3,6,20],[3,7,20],[3,8,20],[5,12,21],[6,4,15],[6,5,2],[6,6,4],[6,7,4],[6,8,4],[7,3,5],[7,10,5]]],
        [show_field_tip, {x: 6, y: 5, dir: "top", text: "На поле располагаются фишки разных типов. Тип своих фишек ты видишь. Это, например, твой Авианосец."}]
    ],[
        [show_field_tip, {x: 7, y: 3, dir: "top", text: "Это твой Форт. Цель игры - захватить Форты противника (их по два у каждого игрока). Поэтому береги свой Форт."}]
    ],[
        [show_field_tip, {x: 3, y: 6, dir: "bottom", text: "А это фишки противника. Ты видишь, где они стоят, но не знаешь их тип - поэтому тебе придется потрудиться, чтобы найти Форт."}]
    ],[
        [show_field_tip, {x: 5, y: 12, dir: "left", text: "Тонущий корабль обозначает ничейную фишку. Она перейдет к тому, кто первый ее захватит"}]
    ]
];

var current_tip = -1;

function next_tip() {
    current_tip++;
    tips[current_tip].forEach(function (el) {
        el[0](el[1]);
    });
}
