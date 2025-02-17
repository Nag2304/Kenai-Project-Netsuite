/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: scm_Module_salesOrderItemAlert.js
 * Author           Date       Version               Remarks
 *
 *
 */

/* global define,log */

define(['N/ui/dialog', 'N/runtime'], function (dialog, runtime) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------- Sales Order Item Alert - Begin --------------------- */
  function salesOrderItemAlert(context) {
    var loggerTitle = 'Sales Order Item Alert';
    try {
      var currentRec = context.currentRecord;
      var sublistId = context.sublistId;
      var fieldId = context.fieldId;

      // Check if the field changed is on the item sublist and is the item field
      if (sublistId === 'item' && fieldId === 'item') {
        var itemId =
          parseInt(
            currentRec.getCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'item',
            })
          ) || 0; // Default to 0 if null/undefined

        log.debug(loggerTitle, 'Final Retrieved Item ID: ' + itemId);

        if (!itemId) {
          log.debug(loggerTitle, 'No item selected yet.');
          return;
        }

        log.debug(loggerTitle, 'Item ID (raw): ' + itemId);

        itemId = parseInt(itemId, 10); // Parse itemId as integer
        log.debug(loggerTitle, 'Item ID (parsed): ' + itemId);

        // Check if the script is running in production or sandbox
        var isProduction =
          runtime.envType === runtime.EnvType.PRODUCTION ? true : false;
        log.debug(loggerTitle, 'Runtime environment: ' + runtime.envType);

        // Define item IDs based on the environment
        var itemA = 3093; // SC-70-0093
        var itemB = isProduction ? 5949 : 1910; // SC-70-0010 in sandbox, SC-70-0310 in production
        log.debug(loggerTitle, 'Item A: ' + itemA + ', Item B: ' + itemB);

        // Display appropriate messages using dialog
        if (itemId == itemA) {
          log.debug(loggerTitle, 'Triggering dialog for Item A.');
          showDialog(
            'Item ' +
              (isProduction ? 'SC-70-0310' : 'SC-70-0010') +
              ' can also be used as a replacement for this item. Please check availability.'
          );
        } else if (itemId == itemB) {
          log.debug(loggerTitle, 'Triggering dialog for Item B.');
          showDialog(
            'Item SC-70-0093 can also be used as a replacement for this item. Please check availability.'
          );
        } else {
          log.debug(loggerTitle, 'Item does not match Item A or Item B.');
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
  }
  /* --------------------- Sales Order Item Alert - End --------------------- */
  //
  /* ------------------------ Helper Functions - Begin ------------------------ */
  /**
   *
   * @param {String} content
   */
  function showDialog(content) {
    try {
      log.debug('showDialog', 'Displaying dialog with message: ' + content);
      dialog.alert({
        title: 'Replacement Item Suggestion',
        message: content,
      });
    } catch (error) {
      log.error('showDialog Error', error);
    }
  }

  /* ------------------------ Helper Functions - End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.fieldChanged = salesOrderItemAlert;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
