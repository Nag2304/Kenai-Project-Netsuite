/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/**
 * File name: div_CS_salesOrderMaster.js
 * Script: DIV | CS Sales Order Master
 * Author           Date       Version               Remarks
 * nagendrababu  09th Aug 2024  1.00       Identify Duplicate PO# on Sales Order
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */
/**
 * Uses
 */
/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define([
  'SuiteScripts/Transactions/Sales Order/Modules/div_Module_checkDuplicatePONumber',
  'N/ui/dialog',
], function (checkDuplicatePONumber, dialog) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  var exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Save Record - Begin ------------------------- */
  function saveRecord(context) {
    var loggerTitle = ' Save Record ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');
    //
    var saveFlag = true;
    try {
      var duplicateCheckCount = checkDuplicatePONumber.saveRecord(context);
      log.debug(loggerTitle, ' Duplicate Check Count: ' + duplicateCheckCount);

      if (duplicateCheckCount > 0) {
        dialog.alert({
          title: 'Duplicate PO Number',
          message: 'This PO number has already been used for this customer.',
        });
        saveFlag = false;
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
    return saveFlag;
  }
  /* -------------------------- Save Record - End -------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.saveRecord = saveRecord;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
