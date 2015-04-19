var EventType = {Pass: 0, Move: 1, Destroy: 2, Explode: 3, Battle: 4, Shot: 5, Capture: 6, Answer: 7, End: 8}
FigName = [ "Неизвестный корабль", "Атомная бомба", "Авианосец", "Брандер", "Эсминец", "Форт", "Крейсер", "Крейсерская подводная лодка", "Линкор", "Мина", "Нейтронная бомба", "Подводная лодка", "Рейдер", "Ракета", "Самолет", "Сторож", "Торпеда", "Торпедный катер", "Транспорт", "Тральщик"];
FigNameR = [ "Неизвестного корабля", "Атомной бомбы", "Авианосца", "Брандера", "Эсминца", "Форта", "Крейсера", "Крейсерской подводной лодки", "Линкора", "Мины", "Нейтронной бомбы", "Подводной лодки", "Рейдера", "Ракетой", "Самолете", "Сторожа", "Торпеды", "Торпедного катера", "Транспорта", "Тральщика" ];
FigNameD = [ "Неизвестному кораблю", "Атомной бомбе", "Авианосцу", "Брандеру", "Эсминцу", "Форту", "Крейсеру", "Крейсерской подводной лодке", "Линкору", "Мине", "Нейтронной бомбе", "Подводной лодке", "Рейдеру", "Ракете", "Самолету", "Сторожу", "Торпеде", "Торпедному катеру", "Транспорту", "Тральщику" ];
FigNameV = [ "Неизвестный корабль", "Атомную бомбу", "Авианосец", "Брандер", "Эсминец", "Форт", "Крейсер", "Крейсерскую подводную лодку", "Линкор", "Мину", "Нейтронную бомбу", "Подводную лодку", "Рейдер", "Ракету", "Самолет", "Сторож", "Торпеду", "Торпедный катер", "Транспорт", "Тральщик" ];
FigNameT = [ "Неизвестным кораблем", "Атомной бомбой", "Авианосцем", "Брандером", "Эсминцем", "Фортом", "Крейсером", "Крейсерской подводной лодкой", "Линкором", "Миной", "Нейтронной бомбой", "Подводной лодкой", "Рейдером", "Ракетой", "Самолетом", "Сторожем", "Торпедой", "Торпедным катером", "Транспортом", "Тральщиком" ];
FigNameP = [ "Неизвестном корабле", "Атомной бомбе", "Авианосце", "Брандере", "Эсминце", "Форте", "Крейсере", "Крейсерской подводной лодке", "Линкоре", "Мине", "Нейтронной бомбе", "Подводной лодке", "Рейдере", "Ракете", "Самолете", "Стороже", "Торпеде", "Торпедном катере", "Транспорте", "Тральщике" ];
FigNameM = [ "Неизвестных кораблей", "Атомных бомб", "Авианосцев", "Брандеров", "Эсминцев", "Фортов", "Крейсеров", "Крейсерских подводных лодок", "Линкоров", "Мин", "Нейтронных бомб", "Подводных лодок", "Рейдеров", "Ракет", "Самолетов", "Сторожей", "Торпед", "Торпедных катеров", "Транспортов", "Тральщиков" ];

function message_to_chat(message)
{
    $("#output > div").append("<p>"+message+"</p>");
}

function colored_message(message,color)
{
    message_to_chat("<span style=\"color: "+color+"\">"+message+"</span>");
}

var move_highlights = [];

function highlight_log() {
    clear_highlight("log");
    highlight(move_highlights[highlight$(this).attr("data-move")], 1000, "log");
};

function highlight_message(message,color,hl)
{
    $("<p data-move="+move_highlights.length+" style=\"color: "+color+"\">"+message+"</p>").
        appendTo($("#output > div")).click(highlight_log);
    move_highlights.push(hl);
}

function get_color(good) {
	return good ? "green" : "red";
}

function get_player(is_you) {
	return is_you ? "Ты" : "Противник";
}

function LogParse(log)
{
    var is_you = log.player == you;
	var suc = (log.win ? "успешно" : "безуспешно");
	var col = (active && log.win) || (!active && !log.win) ? "green" : "red";
	switch (log.type)
	{
		case EventType.End:
			if (log.win && !is_you) $("#draw").html("Принять ничью");
			colored_message(get_player(is_you)+" "+(log.win ? "предложил ничью" : "сдался"), (log.win ? "blue" : get_color(!is_you)));
			break;
		case EventType.Destroy:
			highlight_message(get_player(is_you)+" потерял "+FigNameV[log.agr], get_good(!is_you) ,[hl(log.from.x, log.from.y, "#e32636")]);
			break;
		case EventType.Explode:
			highlight_message((is_you ? "Твоя "+FigName[log.agr] : FigName[log.agr]+" противника")+
                    " взорвалась","blue",[hl(log.from.x, log.from.y, "#ff4d00")]);
			break;
		case EventType.Battle:
			highlight_message(get_player(is_you)+" "+suc+" атаковал "+
                    (log.agr > 0 ? (log.agr_str > 1 ? "блоком из "+log.agr_str+"-х "+FigNameM[log.agr]: FigNameT[log.agr]) : "")+
                    " "+(log.tar_str > 1 ? "блок из "+log.tar_str+"-х "+FigNameM[log.tar] : FigNameV[log.tar]),
                    col, [hl(log.from.x, log.from.y, "#2a52be"), hl(log.to.x, log.to.y, "#ff0033")]);
			break;
		case EventType.Shot:
			highlight_message(get_player(is_you)+" "+suc+" произвел выстрел",
                    col,[hl(log.from.x, log.from.y, "#2a52be"), hl(log.to.x, log.to.y, "#ff0033")]);
			break;
		case EventType.Capture:
			highlight_message(get_player(is_you)+" захватил корабль", get_color(is_you),
                    [hl(log.from.x, log.from.y, "blue"), hl(log.to.x, log.to.y, "green")]);
			break;
		case EventType.Answer:
			message_to_chat("<h5>"+get_player(is_you)+" заявил "+
                    (log.agr_str > 1 ? "блок из "+log.agr_str+"-х "+FigNameM[log.agr] : FigNameV[log.agr])+"</h5>");
			break;
	}
}
