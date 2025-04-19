/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/**
 * File name: hanna_CS_opportunityMaster.js
 * Script:Hanna | CS Opportunity Master
 * Author           Date       Version               Remarks
 * nagendrababu  04.19.2025      1.00        Initial creation of the script
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
  'SuiteScripts/Transactions/Opportunity/Modules/hanna_Module_oppComplimentaryCodes',
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
      var customForm = currentRecord.getValue({ fieldId: 'customform' });
      if (customForm == '100') {
        if (fieldId == 'entity') {
          var customer = currentRecord.getValue({ fieldId: 'entity' });
          priceLevel = retrieveCustomerPriceLevel(customer);
          log.debug(loggerTitle + 'Price Level: ', priceLevel);
        }
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
      var currentRecord = context.currentRecord;
      //
      var customForm = currentRecord.getValue({ fieldId: 'customform' });
      if (customForm == '100') {
        complimentaryCodes.sublistChanged(context, currentRecord, priceLevel);
      }
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
      var customForm = record.getValue({ fieldId: 'customform' });
      if (customForm == '100') {
        var lineCount = record.getLineCount({ sublistId: 'item' });
        log.debug(loggerTitle, 'Line Count: ' + lineCount);
        //
        // Collect all item IDs to batch fetch details
        var itemIds = [];
        for (var index1 = 0; index1 < lineCount; index1++) {
          var itemId = record.getSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: index1,
          });
          if (itemId) {
            itemIds.push(itemId);
          }
        }
        log.debug(loggerTitle, 'Item IDs: ' + JSON.stringify(itemIds));
        //
        // Fetch item details in batch
        var itemDetailsMap = complimentaryCodes.getItemDetails(
          itemIds,
          priceLevel
        );
        //
        for (var index = 0; index < lineCount; index++) {
          var itemId = record.getSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: index,
          });
          log.debug(loggerTitle, 'Item Id: ' + itemId);
          if (itemId) {
            var itemDetails = itemDetailsMap[itemId] || {
              listPrice: 1,
              description: '',
              priceLevel: priceLevel || '',
            };
            //
            record.selectLine({ sublistId: 'item', line: index });
            //
            // Set price level if not set
            var currentPriceLevel = record.getCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'price',
            });
            if (!currentPriceLevel && itemDetails.priceLevel) {
              record.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'price',
                value: itemDetails.priceLevel,
                ignoreFieldChange: true,
              });
              log.debug(
                loggerTitle,
                'Price Level Set Successfully at index: ' + index
              );
            }
            //
            // Set rate if not set or wiped out
            var currentRate = record.getCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'rate',
            });
            if (!currentRate || currentRate <= 0) {
              record.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                value: itemDetails.listPrice,
                ignoreFieldChange: true,
              });
              log.debug(
                loggerTitle,
                'Rate Set Successfully at index: ' +
                  index +
                  ' to ' +
                  itemDetails.listPrice
              );
            }
            //
            // Set amount based on rate and quantity
            var quantity =
              record.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
              }) || 1;
            var rate = record.getCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'rate',
            });
            var amount = rate * quantity;
            record.setCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'amount',
              value: amount,
              ignoreFieldChange: true,
            });
            log.debug(
              loggerTitle,
              'Amount Set Successfully at index: ' + index + ' to ' + amount
            );
            //
            record.commitLine({ sublistId: 'item' });
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
