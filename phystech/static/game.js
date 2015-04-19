var opponent = you == 1 ? second : first;
var websocket;
var output;
var phase;
var player;
var input_shown = false;
var total_fig_count = 62;
var fig =
{
    AB : 1,
    Av : 2,
    Br : 3,
    Es : 4,
    F : 5,
    Kr : 6,
    KrPl : 7,
    Lk : 8,
    Mn : 9,
    NB : 10,
    Pl : 11,
    Rd : 12,
    Rk : 13,
    Sm : 14,
    St : 15,
    T : 16,
    Tk : 17,
    Tp : 18,
    Tr : 19,
    Unknown : 20,
    Sinking : 21
}
var count = [0,1,1,2,6,2,6,1,2,7,1,4,2,1,1,7,4,6,1,7];
var fig_name = ['Null', 'AB', 'Av', 'Br', 'Es', 'F', 'Kr', 'KrPl', 'Lk', 'Mn', 'NB', 'Pl', 'Rd', 'Rk', 'Sm', 'St', 'T', 'Tk', 'Tp', 'Tr', 'Unknown', 'Sinking'];
var info = [ "Пустая клетка",
    "Атомная бомба<br> Щелкнув в фазу атаки можно взорвать - уничтожить все корабли в квадрате 5х5 клеток. Если ее атакуют - взрывается.",
    "Авианосец<br> Образует блоки. Может нести Самолет. 729 е.с.",
    "Брандер.<br>Можно выстрелить в соседний (не по диагонали корабль) противника и захватить его. Захват только один раз подряд. При атаке взрывается как Мина.",
    "Эсминец.<br>Образует блоки. Может нести мины. 216 е.с.",
    "Форт<br> Абсолютно неподвижен. Если противник захватил все ваши Форты - вы проиграли. Выстрелы Торпед, Самолетов и Ракет не наносят вреда Фортам.",
    "Крейсер.<br>Образует блоки. 324 е.с.",
    "Крейсерская подводная лодка<br>Побеждает всех кроме Крейсера, Рейдера и Эсминца. Не образует и не учитывает блоки",
    "Линкор.<br>Образует блоки. 486 е.с.",
    "Мина<br> Ходит только рядом с эсминцем. Не атакует. При атаке уничтожается вместе с атаковавшим кораблем. Уничтожается Тральщиком.",
    "Нейтронная бомба<br> Щелкнув в фазу атаки можно взорвать - сделать все корабли в квадрате 5х5 клеток ничейными. Если ее атакуют - взрывается.",
    "Подводная лодка<br>Побеждает Линкор. Не образует и не учитывает блоки",
    "Рейдер<br> Образует блоки. Может входить в блоки с более слабой фишкой. Блок Рд+Ст может называться 2 Эсминца, а Рд+Ст+Эс - 3 Эсминца. 288 е.с.",
    "Ракета<br>Ходит только рядом с Крейсерской подводной лодкой. Можно выстрелить по прямой над кораблями двумя способами <b>Смотрите подсказку переключения способов внизу экрана, когда вы перетаскиваете ракету</b>: 1)не более чем на 2 клетки и уничтожить все корабли в квадрате 3х3 клетки. 2)не более чем на 3 клетки и уничтожить 1 корабль. Не наносит вреда Фортам. Уничтожается при выстреле.",
    "Самолет<br>Можно выстрелить (если рядом Авианосец) по прямой над кораблями на любое расстояние. Уничтожает любой корабль, кроме Форта. Уничтожается при выстреле.",
    "Сторож.<br>Образует блоки. 144 е.с.",
    "Торпеда<br>Ходит только рядом с Торпедным катером. Может ходить на 2 клетки. Можно выстрелить по прямой не более чем на 4 клетки. Не может стрелять сквозь корабли. Не наносит вреда Фортам.",
    "Торпедный катер<br> Образует блоки. Может ходить на 2 клетки. Переносит Торпеды. 96 е.с.",
    "Транспорт<br> Не образует блоки. Может переносить и запускать любые фишки. Уничтожается любым кораблем.",
    "Тральщик<br> Может снимать мины, торпеды и брандеры (атакуя их). Образует блоки. 64 е.с.",
    "Корабль противника",
    "Ничейный корабль<br>Атакуйте его любым кораблем, чтобы забрать себе. Ход перейдет к противнику."];
function coord(x, y) {
    return {
        x: x,
            y: y
    }
}

function is_equal_coord(a, b) {
    return a.x == b.x && a.y == b.y;
}

var field = new Array();
var dragging;
var isshot;
var movepassed = false;
var auto_attack_pass = true;
var last_moved_fig = 0;
var isaoe;
var ask_data = {
    is_aggressor: false,
    aggressor: coord(0, 0),
    target: coord(0, 0),
    blocks: [],
    ships: []
};

function show_input()
{
    $("#input").fadeIn(1000);
    input_shown = true;
    $("#text").focus();
}

function toggle_aoe() {
    set_aoe(!isaoe);
}

function set_aoe(value)
{
    isaoe = value
    $("#aoeon").html(isaoe ? "<span style=\"color: green\">включен</span>" : "<span style=\"color: red\">выключен</span>");
}

var page_visible = true;
const DB_KEY = 'seabattle-displacing';
const FIELD_SIZE = 14;

function fill_field(array, value) {
    for (var x = 0; x < FIELD_SIZE; x++) {
        array[x] = [];
        for (var y = 0; y < FIELD_SIZE; y++) {
            array[x][y] = value;
        }
    }
}

function on_keypress(evt) {
    if (MODE == 'tutorial') {
        if (evt.which == 32) {
            next_tip();
            return;
        }
    }
    if (evt.which == 13)
    {
        if (!input_shown)
        {
            showinput();
        }
        else
        {
            $("#input").fadeOut(1000);
            input_shown = false;
            var text = $("#text").val();
            if (text!= "")
            {
                if (text[0] == "/") {
                    cheat_command(text);
                }
                SendJSON({action: 0, message: text});
                $("#text").val("");
            }
        }
        return false;
    }
    else if ((player == you || phase == 0) && !input_shown)
    {
        if (evt.which == 82 && phase == 1 && isshot)
        {
            toggle_aoe();
        }
        else if (evt.which == 32)
        {
            if (phase == 0)
            {
                displace()
            }
            else if (phase == 1)
            {
                movepass()
            }
            else if (phase == 4)
            {
                attackpass()
            }
        }
        else if (evt.which == 83)
        {
            if (phase == 1)
            {
                toggle_shot()
            }
        }
        else
        {
            return true;
        }
        return false
    }
    return true;
}

function enable_squares()
{
    $(".square").mouseup(on_drop).mousedown(on_drag);
}

function init()
{
    fill_field(field, 0);
    $(window).resize(function (){
        $("#output").scrollTop($("#output > div").height());
    }).resize();
    $("body").keydown(on_keypress);
    $(".square").popover({trigger: 'hover', placement: 'auto bottom', delay: {show: 1000},
        html: true, container: 'body', content: function() { return info[$(this).attr("data-fig")];}});
    $(".square").on( "touchmove", function(e){
        e.preventDefault();
    });
    $(".square").on( "touchstart", function(e){
        $(e.target).mousedown();
        e.preventDefault();
    });
    $(".square").on( "touchend", function(e){
        $(document.elementFromPoint(e.originalEvent.changedTouches[0].pageX - window.pageXOffset,
                e.originalEvent.changedTouches[0].pageY - window.pageYOffset)).mouseup();
        e.preventDefault();
    });
    window.onfocus = function () {
        page_visible = true;
    };
    window.onblur = function () {
        page_visible = false;
    };
    Notification.requestPermission();
    if (MODE == "game") {
        init_socket();
    }
    else if (MODE == "tutorial") {
        next_tip();
    }
    enable_squares();
}

function init_socket()
{
    websocket = new WebSocket(wsUri);
    websocket.onopen = function(evt) { on_open(evt) };
    websocket.onclose = function(evt) { on_close(evt) };
    websocket.onmessage = function(evt) { on_message(evt) };
    websocket.onerror = function(evt) { on_error(evt) };
}

function on_open(evt)
{
    send_package(type);
    console.info("Подключено к серверу");
}

function on_close(evt)
{
    console.info("Соединение закрыто");
}

function show_modal(title, msg)
{
    $('#modal_title').html(title);
    $('#modal_msg').html(msg);
    $('#modal_window').modal({keyboard: false});
}

function displace()
{
    d = you == 1 ? 0 : 9;
    f = field.slice(0+d,5+d);
    var c = 0;
    for (var i = d; i < d+5; i++)
        for (var j = 0; j < 14; j++)
            if (field[i][j])
                c++;
    if (total_fig_count != c)
    {
        alert('Расставьте все корабли');
        return;
    }
    SendJSON({action: 1, phase: 0, field: f});
    for (var i = 0; i < 14; i++)
        for (var j = 0; j < 14; j++)
            set_fig(i, j, 0);
    $(".square").css("background-color","#FFFFFF");
    localStorage.removeItem(DB_KEY);
}

function pass_move()
{
    movepassed = true;
    SendJSON({action: 1, phase: 1, pass: true});
}

function pass_attack()
{
    SendJSON({action: 1, phase: 4, pass: true});
}

function toggle_shot()
{
    set_shot(!isshot);
}

function set_shot(value)
{
    isshot = value;
    $("#shot").html((isshot ? "Стреляйте" : "Ходите"));
    if (isshot) {
        $("#aoe").show();
    } else {
        $("#aoe").hide();
    }
}

function on_drop(evt)
{
    if (dragging == null)
        return false;
    if (phase == 0)
    {
        x = $(this).attr("x");
        y = $(this).attr("y");
        fig = field[x][y];
        drag = $(dragging);
        id = drag.attr("id");
        sx = drag.attr("x");
        sy = drag.attr("y");
        if (field[sx][sy] != 0)
        {
            buf = field[x][y]
                field[x][y] = field[sx][sy];
            field[sx][sy] = buf
                set_fig(x, y, field[x][y]);
            set_fig(sx, sy, field[sx][sy]);
            localStorage.setItem(DB_KEY, JSON.stringify(you == 1 ? field : field.slice().reverse()));
        }
    }
    else if (phase == 1)
    {
        x = $(dragging).attr("x");
        y = $(dragging).attr("y");
        last_moved_fig = field[x][y];
        SendJSON({action: 1, phase: 1, fromx: x, fromy: y, tox: $(this).attr("x"), toy: $(this).attr("y"), isshot: isshot, isaoe: isaoe});
    }
    else if (phase == 4)
    {
        SendJSON({action: 1, phase: 4, fromx: $(dragging).attr("x"), fromy: $(dragging).attr("y"), tox: $(this).attr("x"), toy: $(this).attr("y")});
    }
    dragging = null;
    return false;
}

function on_drag(evt)
{
    dragging = this;
    return false;
}

function set_fig(x, y, fig, player)
{
    if (typeof(player) === "undefined") {
        player = -1;
    }
    field[x][y] = fig;
    var pos = $("[id='"+x+":"+y+"']");
    if (player == 0)
        pos.css("background-color", "white");
    else if (player == 1)
        pos.css("background-color", "#98ff98");
    else if (player == 2)
        pos.css("background-color", "#7fc7ff");
    pos.attr("data-fig", fig);
    if (fig != 0) {
        pos.css("background-image","url('/static/figures/"+fig_name[fig]+".png')");
    }
    else {
        pos.css("background-image","none");
    }
}

const ATTACKING_FIGS = [fig.Pl, fig.KrPl, fig.Av, fig.Lk, fig.Kr, fig.Rd, 
    fig.Es, fig.St, fig.Tk, fig.Tr, fig.Tp];

function should_pass() {
    if (last_moved_fig in [fig["AB"], fig["NB"]]) {
        return false;
    }
    for (var x = 0; x < 14; x++) {
        for (var y = 0; y < 14; y++) {
            if (field[x][y] in ATTACKING_FIGS) {
                for (var i = Math.max(0, x-1); i < Math.min(x+2, 14); i++) {
                    for (var j = Math.max(0, y-1); j < Math.min(y+2, 14); j++) {
                        if (field[i][j] == fig.Unknown) {
                            return false;
                        }
                    }
                }
            }
        }
    }
    return true;
}

function nudge() {
    if (phase == 3 || (player == you && (phase == 1 || phase == 3)))
    {
        if (!page_visible)
        {
            var n = new Notification("Ваш ход", {
                tag : "your-move",
                body : "Действуйте в игре с "+opponent,
            });
        }
        document.title = "<Действуйте!> Морской бой против "+opponent;
    } else {
        document.title = "Морской бой против "+opponent;
    }
}

displacing_ongoing = false;

function init_displacing() {
    if (displacing_ongoing) {
        return;
    }
    displacing_ongoing = true;
    zone = you == 1 ? $("[id^='0:'],[id^='1:'],[id^='2:'],[id^='3:'],[id^='4:']") : $("[id^='9:'],[id^='10:'],[id^='11:'],[id^='12:'],[id^='13:']");
    zone.css("background-color","#98ff98");
    var displ = localStorage.getItem(DB_KEY);
    if (displ !== null && confirm('Обнаружена незавершенная расстановка. Вы хотите ее продолжить?')) {
        field = JSON.parse(displ);
        if (you == 2) {
            field.reverse();
        }
        for (var i = 0; i < 14; i++) {
            for (var j = 0; j < 14; j++) {
                set_fig(i, j, field[i][j]);
            }
        }
    } else {
        cur = you != 1 ? 4*14 : 5*14;
        for (i = 0; i < count.length; i++)
        {
            for (j = 0; j < count[i]; j++)
            {
                set_fig(Math.floor(cur/14), cur%14, i);
                cur++;
            }
        }
    }
}

function set_phase(phase, player) {
    switch(phase) {
        case 0:
            if (player != you)
            {
                $("#main").html('<h4>Расставьте корабли</h4><a onclick=displace()>Нажмите</a> Пробел, когда будете готовы');
                init_displacing();
            }
            else
            {
                $("#main").html("<h4>Ждите</h4>Противник на вашу погибель готовит подводные лодки");
            }
            break;
        case 1:
            if (player == you)
            {
                if (!movepassed && auto_attack_pass && should_pass()) {
                    attackpass();
                }
                $("#main").html('<h4>Атакуйте</h4>Чтобы '+(movepassed ? 'вернуться к фазе хода' : 'пропустить атаку')+' <a onclick=attackpass()>нажмите</a> Пробел');
            }
            else
            {
                $("#main").html("<h4>Ждите</h4>Противник атакует.");
            }
    }
}

function start_asking(mess) {
    $("#main").html("<h4>Выберите блок</h4>");
    ask_data.target = coord(mess.targetx, mess.targety);
    ask_data.aggressor = coord(mess.agressorx, mess.agressory);
    ask_data.is_aggressor = mess.player == you;
    var ship = mess.player == you ? ask_data.aggressor : ask_data.target;
    if (field[ship.x][ship.y] == "Pl" || field[ship.x][ship.y] == "KrPl")
        return;
    highlight([hl(ask_data.target.x, ask_data.target.y, "#ff0033"), hl(ask_data.aggressor.x, ask_data.aggressor.y, "#2a52be")]);
    ask_data.ships.push(ship);
    add_block(1, field[ship.x][ship.y], [ship.x], [ship.y]);
    $(".square").click(add_ship);
    if (ship.x < 5)
        $("#answer").addClass("bottom");
    else
        $("#answer").removeClass("bottom");
    $("#answer").show();
}

function on_message(evt)
{
    console.log('<span style="color: blue;">Сообщение от сервера: ' + evt.data+'</span>');
    mess = JSON.parse(evt.data);
    onbottom = ($("#output").scrollTop() > $("#output > div").height() - $("#output").height());
    if (mess.action == 1)
    {
        nudge();
        set_phase(mess.phase, mess.player);
    }
    else if (mess.action == 4)
    {
        if (mess.player == 0) $("#output > div").append("<p class=\"log\">"+mess.message+"<p>");
        else $("#output > div").append("<p style=\"color: "+(mess.player == you ? "gray" : "black")+"\">"+mess.message+"<p>");
    }
    else if (mess.action == 3)
    {
        for (i = 0; i < mess.changex.length; i++)
        {
            x = mess.changex[i];
            y = mess.changey[i];
            fig = mess.changefig[i];
            set_fig(x, y, fig);
        }
    }
    else if (mess.action == 2)
    {
        LogParse(mess.log);
    }
    else if (mess.action == 0)
    {
        $("#main").html("Соединено с сервером. Ожидание игры");
    }
    if (onbottom)
        $('#output').stop().animate({
            scrollTop: $("#output")[0].scrollHeight
        }, 800);
}

function on_error(evt)
{
    $("#output > div").append('<p style="color: red;">Ошибка соединения с сервером</p>');
    console.error('<span style="color: red;">Произошла ошибка.</span> ' + evt.data);
}

function send_json(mess)
{
    send_package(JSON.stringify(mess));
}

function send_package(message)
{
    console.log("Отправил сообщение: " + message);
    websocket.send(message);
}

function add_ship(evt)
{
    var el=$(this);
    var x = el.attr("x");
    var y = el.attr("y");
    var ship = coord(x, y);
    if (field[x][y] > 0 && field[x][y] < 20 && !is_equal_coord(ship, ask_data.aggressor) && !is_equal_coord(ship, ask_data.target))
    {
        var index = -1;
        ask_data.ships.forEach(function (val, i) {if (is_equal_coord(ship, val)) { index = i; }});
        if (index != -1)
        {
            ask_data.ships.splice(index, 1);
            highlight(hl(x, y, "#ffffff"));
        }
        else
        {
            ask_data.ships.push(ship);
            highlight(hl(x, y, ask_data.is_aggressor ? "#2a52be" : "#ff0035"));
        }
        find_blocks();
    }
}

const MASKABLE_FIGS = [fig.Es, fig.St, fig.Tk, fig.Tr]

function find_blocks()
{
    $("#answer").html("");
    var types = [];
    var str = 0;
    var ox = [];
    var oy = [];
    var count_Rd = 0;
    ask_data.ships.forEach(function (val) { count_Rd += field[val.x][val.y] == fig.Rd });
    for (var i = 0; i < ask_data.ships.length; i++) {
        var ship = ask_data.ships[i];
        var cur_fig = field[ship.x][ship.y];
        if (types.length == 0) {
            types.push(cur_fig);
            if (cur_fig == fig.Rd) {
                types = types.concat(MASKABLE_FIGS);
            }
        }
        else {
            types = types.filter(function (type) {
                if (type == cur_fig) {
                    return true;
                }
                if (type in MASKABLE_FIGS && cur_fig == fig.Rd) {
                    return true;
                }
                if (type == fig.Es && cur_fig == fig.St && count_Rd > 0) {
                    count_Rd -= 1;
                    return true;
                }
                return false;
            });
            if (types.length == 0) {
                return false;
            }
        }
        ox.push(ship.x);
        oy.push(ship.y);
        str++;
    }
    types.forEach(function (type) { add_block(str, type, ox, oy) });
}

function add_block(str,fig,x,y)
{
    var n = ask_data.blocks.length;
    ask_data.blocks.push({
        strength: str,
        fig: fig,
        x: x,
        y: y
    });
    $("#answer").append("<td onclick=block_click() height=64 width=64 style=\"background-image: url('/static/"+fig_name[fig]+".png');\" data-index="+n+"><h2>"+str+"</h2></td>");
}

function block_click()
{
    var n = $(this).attr("data-index");
    var block = ask_data.blocks[n];
    SendJSON({action: 1, phase: 3, blockstrength: block.strength, blocktype: block.fig, blockx: block.x, blocky: block.y});
    for (i = 0; i < block.x.length; i++) {
        highlight(hl(block.x[i], block.y[i], "#ffffff"));
    }
    highlight([hl(ask_data.aggressor.x, ask_data.aggressor.y, "#ffffff"), hl(ask_data.target.x, ask_data.target.y, "#ffffff")]);
    ask_data.blocks = [];
    ask_data.ships = [];
    $(".square").unbind("click");
    $("#answer").html("");
    $("#answer").hide();
}
