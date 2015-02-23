var current_popover = false;

function set_status(text) {
    $("#main").html(text);
}

function show_tip(args) {
    if (current_popover) {
        current_popover.popover('destroy');
    }
    current_popover = $(args.selector);
    current_popover.popover({container: 'body', content: args.text, html: true, placement: args.dir, trigger: 'manual'}).popover('show');
}

function show_field_tip(args) {
    args["selector"] = "[id='"+x+":"+y+"']";
    show_tip(args);
}

var tips = [
    [
        [set_status, "Начало обучения"],
        [show_field_tip, {x: 7, y: 8, dir: "top", text: "Привет! Сейчас ты узнаешь основные правила игры в Морской бой по-физтеховски.<br/>Тебе будут помогать всплывающие подсказки. Чтобы перейти к следующей подсказке, нажимай Пробел"]
    ],[
        [init_displacing, {}],
        [show_field_tip, {}]
    ]
];

var current_tip = -1;

function next_tip() {
    current_tip++;
    tips[current_tip].forEach(function (el) {
        el[0](el[1]);
    });
}
