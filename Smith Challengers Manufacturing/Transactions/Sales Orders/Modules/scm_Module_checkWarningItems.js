/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: scm_Module_checkWarningItems.js
 * Author           Date       Version               Remarks
 * nagendrababu  03.10.2026     1.00            Initial creation of the script
 *
 */

/* global define,log */

define(['N/runtime', 'N/ui/dialog'], function (runtime, dialog) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------- Check for Warning Items - Begin -------------------- */
  function checkForWarningItems(context) {
    var loggerTitle = ' Check For Warning Items ';
    var rec = context.currentRecord;

    // Get parameter value
    var paramItems = runtime.getCurrentScript().getParameter({
      name: 'custscript_sc_lug_warning_items',
    });

    if (!paramItems) return true;

    var itemList = paramItems.split(',').map(function (id) {
      return id.trim();
    });

    var lineCount = rec.getLineCount({
      sublistId: 'item',
    });
    for (var i = 0; i < lineCount; i++) {
      var itemId = rec.getSublistValue({
        sublistId: 'item',
        fieldId: 'item',
        line: i,
      });

      if (itemList.indexOf(String(itemId)) !== -1) {
        dialog.alert({
          title: 'Reminder',
          message:
            'Please make sure the lugs are welded to the broom prior to shipment!',
        });

        break;
      }
    }

    return true;
  }
  /* ---------------------- Check for Warning Items - End --------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.saveRecord = checkForWarningItems;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
