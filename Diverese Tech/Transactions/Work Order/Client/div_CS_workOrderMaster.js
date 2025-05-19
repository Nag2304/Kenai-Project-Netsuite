/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/**
 * File name: div_CS_workOrderMaster.js
 * Script: DIV | CS WO Master
 * Author           Date       Version               Remarks
 * nagendrababu 05.18.2025     1.00      Initial version of the script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */
/**
 * Uses
 */
/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define([
  'SuiteScripts/Transactions/Work Order/Modules/div_Module_checkForUnits',
], function (checkForUnits) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  var exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------------- Save Record - Begin -------------------------- */
  function saveRecord(context) {
    var loggerTitle = ' Save Record ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      checkForUnits.saveRecord(context);
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  }
  /* --------------------------- Save Record - End -------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.saveRecord = saveRecord;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
