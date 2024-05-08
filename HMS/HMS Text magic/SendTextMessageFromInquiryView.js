/**
 * @author Midware
 * @developer Francisco Alvarado Ferllini
 * @contact contact@midware.net
 */
define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function getOptionsView(pOptinos) {
        var options = "";
        for (var i = 0; i < pOptinos.length; i++) {
            options += "<option value=\"" + pOptinos[i].phone + "\">" + pOptinos[i].name + "</option>\n";
        }
        var html = /*html*/ "\n\n        <label for=\"selectRecipient\">Select A Recipient: </label>\n        <select id=\"selectRecipient\" name=\"selectRecipient\" style=\"width:100%;\">\n        <option value=\"\"></option>\n                " + options + "\n        </select>\n\n\n        <label for=\"altPhone\">Or Enter A Diferent Phone Number:  </label>\n        <input type=\"text\" id=\"altPhone\" name=\"message\" style=\"width:100%;\">\n\n        <label for=\"message\">Message: </label>\n        <textarea id=\"message\" name=\"message\" rows=\"4\" cols=\"50\" style=\"width:100%; resize: none;\"></textarea>\n        \n    ";
        // return {html: `'${html}'`};
        return html;
    }
    exports.getOptionsView = getOptionsView;
});
