/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: div_Module_checkDuplicatePONumber.js
 * Author           Date       Version               Remarks
 * nagendrababu  09th Aug 2024  1.00       Identify Duplicate PO# on Sales Order
 *
 */

/* global define,log */

define(['N/search'], function (search) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------- Check Duplicate Number - Begin --------------------- */
  function checkDuplicateNumber(context) {
    var loggerTitle = ' Check Duplicate Number ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');
    //
    var searchResultCount = 0;
    try {
      var currentRecord = context.currentRecord;

      var poNumber = currentRecord.getValue('otherrefnum');
      var customerId = currentRecord.getValue('entity');

      log.debug(
        loggerTitle,
        ' PO Number: ' + poNumber + ' Customer ID: ' + customerId
      );

      if (poNumber && customerId) {
        // Perform a saved search to check for duplicate PO numbers
        var salesorderSearchObj = search.create({
          type: search.Type.SALES_ORDER,
          filters: [
            ['mainline', 'is', 'T'],
            'AND',
            ['type', 'anyof', 'SalesOrd'],
            'AND',
            ['otherrefnum', 'equalto', poNumber],
            'AND',
            ['customermain.internalidnumber', 'equalto', customerId],
          ],
          columns: [
            search.createColumn({
              name: 'otherrefnum',
              summary: 'GROUP',
            }),
          ],
        });

        searchResultCount = salesorderSearchObj.runPaged().count;
        log.debug(loggerTitle, ' Search Result Count: ' + searchResultCount);
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
    return searchResultCount;
  }
  /* --------------------- Check Duplicate Number - End --------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.saveRecord = checkDuplicateNumber;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
