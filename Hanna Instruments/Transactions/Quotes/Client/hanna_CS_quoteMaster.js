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
  'N/search',
  'SuiteScripts/Transactions/Quotes/Modules/hanna_Module_complimentaryCodes',
], function (search, complimentaryCodes) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  var exports = {};
  var priceLevel = '';
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* -------------------------- Field Changed - Begin ------------------------- */
  /**
   *
   * @param {Object} context
   */
  function fieldChanged(context) {
    var loggerTitle = 'Field Changed';
    try {
      var currentRecord = context.currentRecord;
      var fieldId = context.fieldId;

      if (fieldId == 'entity') {
        var customer = currentRecord.getValue({ fieldId: 'entity' });
        priceLevel = retrieveCustomerPriceLevel(customer);
        log.debug(loggerTitle + 'Price Level: ', priceLevel);
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
  }
  /* -------------------------- Field Changed - End ------------------------- */
  //
  /* -------------------------- Sublist Changed - Begin ------------------------- */
  /**
   *
   * @param {Object} context
   */
  function sublistChanged(context) {
    var loggerTitle = ' Sublist Changed ';
    try {
      complimentaryCodes.sublistChanged(context, priceLevel);
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
  }
  /* -------------------------- Sublist Changed - End -------------------------- */
  //
  /* --------------------------- Save Record - Begin -------------------------- */
  /**
   *
   * @param {Object} context
   * @returns {Boolean}
   */
  function saveRecord(context) {
    var loggerTitle = 'Save Record';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      var record = context.currentRecord;
      var lineCount = record.getLineCount({ sublistId: 'item' });
      log.debug(loggerTitle, 'Line Count: ' + lineCount);
      //
      for (var index = 0; index < lineCount; index++) {
        var itemId = record.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: index,
        });
        log.debug(loggerTitle, 'Item Id: ' + itemId);
        if (itemId) {
          var priceLevel = record.getSublistValue({
            sublistId: 'item',
            fieldId: 'price',
            line: index,
          });
          if (!priceLevel) {
            record.selectLine({ sublistId: 'item', line: index });
            record.setCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'price',
              value: priceLevel,
            });
            record.commitLine({ sublistId: 'item' });
            log.debug(
              loggerTitle,
              ' Price Level Set Successfully at index: ' + index
            );
          }
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' Error:', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return true;
  }
  /* ---------------------------- Save Record - End --------------------------- */
  //
  /* ------------------------ Helper Functions - Begin ------------------------ */
  //
  /* *********************** Retrieve Customer PriceLevel - Begin *********************** */
  /**
   *
   * @param {Number} customer
   * @returns {Number}
   */
  function retrieveCustomerPriceLevel(customer) {
    var loggerTitle = 'Retrieve Customer PriceLevel';
    var priceLevel = 0;
    try {
      var customerLookUpFields = search.lookupFields({
        type: search.Type.CUSTOMER,
        id: String(customer),
        columns: ['pricelevel'],
      });
      priceLevel = customerLookUpFields.pricelevel[0].value || 0;
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    log.debug(loggerTitle + 'Price Level: ', priceLevel);
    return priceLevel;
  }
  /* *********************** Retrieve Customer PriceLevel - End *********************** */
  //
  /* ------------------------- Helper Functions - End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.fieldChanged = fieldChanged;
  exports.sublistChanged = sublistChanged;
  exports.saveRecord = saveRecord;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
