var highlights = [];
var base_layer = [];

const FIELD_SIZE = 14;

for (var x = 0; x < FIELD_SIZE; x++) {
    base_layer[x] = [];
    for (var y = 0; y < FIELD_SIZE; y++) {
        base_layer[x][y] = "#ffffff";
    }
}

function set_color(x, y, color) {
    $("[id='"+x+":"+y+"']").css("background-color",color);
}

function update_highlights(arg)
{
    for (var x = 0; x < FIELD_SIZE; x++) {
        for (var y = 0; y < FIELD_SIZE; y++) {
            set_color(x, y, base_layer[x][y]);
        }
    }
    highlights.sort(function(a, b) {
        return a.priority - b.priority;
    });
    highlights.forEach(function (list) {
        list.squares.forEach(function (el) {
            set_color(el.x, el.y, el.color);
        }
    });
}

function highlight(squares, priority, key) {
    if (typeof(key) === "undefined") {
        key = Math.random();
    }
    highlights.push({
        key: key,
        priority: priority,
        squares: squares
    });
    update_highlights();
    return key;
}

function clear_highlight(key) {
    highlight = highlight.filter(function (el) {
        return el.key.startsWith(key);
    });
    update_highlights();
}

function hl(x, y, color) {
    return {
        x: x,
        y: y,
        color: color
    };
}
