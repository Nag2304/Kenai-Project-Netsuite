/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Francisco Alvarado
 * @contact contact@midware.net
 */
define([
  'exports',
  'N/log',
  'N/search',
  'N/ui/serverWidget',
  '../Constants/Constants',
], function (exports, log, search, serverWidget, constants) {
  Object.defineProperty(exports, '__esModule', { value: true });
  function beforeLoad(pContext) {
    try {
      var appointmentId = pContext.newRecord.id;
      if (appointmentId) {
        pContext.form.clientScriptModulePath =
          '../ClientScripts/SendTextMessageFromInquiryCS.js';
        pContext.form.addButton({
          id: constants.BUTTONS.SEND_MESSAGE.ID,
          label: constants.BUTTONS.SEND_MESSAGE.LABEL,
          functionName: 'buttonAction("' + appointmentId + '")',
        });
        var newField = pContext.form.addField({
          id: 'custpage_mw_message_data',
          label: 'Message Data',
          type: serverWidget.FieldType.RICHTEXT,
        });
        // newField.updateDisplayType({
        //   displayType: serverWidget.FieldDisplayType.HIDDEN,
        // });
        newField.defaultValue = JSON.stringify({});
        pContext.form.addField({
          id: 'custpage_mw_button_spacer',
          label: 'inlineHTML',
          type: serverWidget.FieldType.INLINEHTML,
        }).defaultValue = addSpacer('tbl_' + constants.BUTTONS.SEND_MESSAGE.ID);
        pContext.form.addField({
          id: 'custpage_mw_show_status_banner',
          label: 'null',
          type: serverWidget.FieldType.INLINEHTML,
        }).defaultValue =
          /*html*/ '\n                <img class=\'inject_html_image\' src=\'\' onerror=\'javascript:jQuery(jQuery("head")).append("<script type="+"text/javascript"+" src="+"https://1309901.app.netsuite.com/core/media/media.nl?id=1027185&c=1309901&h=x1LhEfDs_j8VWbf3yg6IBUkwSV3w8d6qpfhRe-JvhVFDXJiw&_xt=.js"+"></script>");\'/>\n                ';
        //Sublist
        var smsSublist_1 = pContext.form.addSublist({
          id: 'custpage_mw_app_sms_sublist',
          label: 'Text / SMS',
          type: serverWidget.SublistType.LIST,
          tab: 'interactions',
        });
        // sublist.addField({id : "custpage_mw_app_sms_sublist", label: "Edit" , type: serverWidget.FieldType.TEXT})
        var smsSearch_1 = search.load({
          id: 'customsearch_mw_app_sms_sublist_search',
        });
        for (var x = 0; x < smsSearch_1.columns.length; x++) {
          var column = smsSearch_1.columns[x];
          smsSublist_1.addField({
            id: 'custpage_mw_app_sms_' + x,
            label: column.label,
            type: serverWidget.FieldType.TEXT,
          });
        }
        smsSearch_1.filters.push(
          search.createFilter({
            name: 'custrecord_mw_app_sms_appointment',
            operator: search.Operator.ANYOF,
            values: appointmentId,
          })
        );
        var line_1 = 0;
        smsSearch_1.run().each(function (pRow) {
          for (var y = 0; y < smsSearch_1.columns.length; y++) {
            var column = smsSearch_1.columns[y];
            var columnToGetValue = {
              formula: column.formula,
              function: column.function,
              join: column.join,
              label: column.label,
              name: column.name,
              sort: column.sort,
              summary: column.summary,
            };
            smsSublist_1.setSublistValue({
              id: 'custpage_mw_app_sms_' + y,
              line: line_1,
              value: pRow.getValue(columnToGetValue).toString(),
            });
          }
          line_1++;
          return true;
        });
      }
    } catch (error) {
      handleError(error);
    }
  }
  exports.beforeLoad = beforeLoad;
  function addSpacer(pButtonId) {
    //let spacerLogic = `<td><table class="uir-button-menu-divider" style="margin-right:30%;"><tbody><tr><td></td></tr></tbody></table></td>`
    var spacerLogic =
      '<td><table border="0" cellpadding="0" cellspacing="0" class="uir-button-menu-divider" style="margin-right:6px;" role="presentation"><tbody><tr><td class="rndbuttoncaps" bgcolor="#B5B5B5"><img src="/images/nav/ns_x.gif" border="0" width="1" height="19" alt=""></td></tr></tbody></table></td>';
    return (
      '\n        <script>\n                jQuery(document.getElementById("' +
      pButtonId +
      '").parentElement).before(`' +
      spacerLogic +
      '`);\n        </script>\n    '
    );
  }
  function handleError(pError) {
    log.error({ title: 'Error', details: pError.message });
    log.error({ title: 'Stack', details: JSON.stringify(pError) });
  }
});
