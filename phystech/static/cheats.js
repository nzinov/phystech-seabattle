function cheat_command(command) {
    switch (command) {
        case "/unlock_field":
            $(".square").click(function (evt) {
                var el=$(this);
                var x = el.attr("x");
                var y = el.attr("y");
                set_fig(x, y, (field[x][y] + 1) % figname.length);
            })
            break;
        case "/stop":
            $(".square").unbind("click");
            break;
        case "/dump_field":
            var ans = "[";
            for (var i = 0; i < 14; i++) {
                for (var j = 0; j < 14; j++) {
                    if (field[i][j] != 0) {
                        ans += "["+i+","+j+","+field[i][j]+"],";
                    }
                }
            }
            ans += "]";
            message_to_chat(ans);
            break;
    }
}
