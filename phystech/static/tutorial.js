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

var tips = [
    [
        [set_status, "Начало обучения"],
        [show_field_tip, {x: 7, y: 8, dir: "top", text: "Привет! Сейчас ты узнаешь основные правила игры в Морской бой по-физтеховски.<br/>Тебе будут помогать всплывающие подсказки. Чтобы перейти к следующей подсказке, нажимай Пробел"}]
    ],[
        [show_field_tip, {x: 6, y: 7, dir: "top", text: "Это игровое поле. Похоже на шахматное, но больше - 14 на 14 клеток"}]
    ]
];

var current_tip = -1;

function next_tip() {
    current_tip++;
    tips[current_tip].forEach(function (el) {
        el[0](el[1]);
    });
}
