/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/**
 * File name: hanna_CS_quoteMaster.js
 * Script:Hanna | CS Quote Master
 * Author           Date       Version               Remarks
 * nagendrababu  02.18.2025      1.00        Initial creation of the script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */
/**
 * Uses
 */
/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define([
  'SuiteScripts/Transactions/Quotes/Modules/hanna_Module_complimentaryCodes',
], function (complimentaryCodes) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  var exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* -------------------------- Field Changed - Begin ------------------------- */
  function fieldChanged(context) {
    var loggerTitle = ' Field Changed ';
    try {
      complimentaryCodes.fieldChanged(context);
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
  }
  /* -------------------------- Field Changed  - End -------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.fieldChanged = fieldChanged;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
