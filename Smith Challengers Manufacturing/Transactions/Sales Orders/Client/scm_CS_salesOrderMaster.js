/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/**
 * File name:scm_CS_salesOrderMaster.js
 * Script: SCM | CS Sales Order Master
 * Author           Date       Version               Remarks
 * nagendrababu   01.26.2024    1.00       Initial creation of the script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */
/**
 * Uses
 */
/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define([
  'SuiteScripts/Transactions/Sales Orders/Modules/scm_Module_salesOrderItemAlert',
], function (salesOrderItemAlert) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  var exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* -------------------------- Field Changed - Begin ------------------------- */
  function fieldChanged(context) {
    var loggerTitle = 'Field Changed';
    try {
      salesOrderItemAlert.fieldChanged(context);
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
  }
  /* -------------------------- Field Changed - End------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.fieldChanged = fieldChanged;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
